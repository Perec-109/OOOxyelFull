/* ============================================================
   WORKER/INDEX.JS
   Cloudflare Worker — прокси между сайтом и Telegram Bot API.
   Токен бота и chat_id хранятся ТОЛЬКО здесь, в secrets/vars
   Cloudflare, и никогда не попадают на фронт.

   Что делает:
   1. Принимает POST-запрос с фронта (name, email, message)
   2. Сам обращается к Telegram API с секретным токеном
   3. Возвращает фронту просто { ok: true/false }
   ============================================================ */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------- Диагностика: GET /diag ----------
    // Открой в браузере: https://твой-воркер.workers.dev/diag
    // Покажет, правильно ли настроены токен/chat_id и видит ли бот этот чат,
    // без необходимости лезть в логи.
    if (request.method === 'GET' && url.pathname === '/diag') {
      return diag(env);
    }

    // ---------- CORS preflight ----------
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'Invalid JSON' }, 400, env);
    }

    // ---------- Простая защита от спама ----------
    // Honeypot-поле: если бот заполнил скрытое поле — тихо игнорируем
    if (body.website) {
      return json({ ok: true }, 200, env);
    }

    const text = body.type === 'order' ? buildOrderText(body) : buildContactText(body);
    if (text === null) {
      return json({ ok: false, error: 'Missing required fields' }, 400, env);
    }

    const tgUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
      const tgResponse = await fetch(tgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      });

      const tgData = await tgResponse.json();

      if (!tgResponse.ok || !tgData.ok) {
        // Логируем ПОЛНЫЙ ответ Telegram — он содержит точную причину
        // (chat not found / bot is not a member / unauthorized и т.д.)
        // Смотри эти логи через `wrangler tail` или в Cloudflare Dashboard → Logs.
        console.error('Telegram API error:', JSON.stringify(tgData));
        return json(
          { ok: false, error: tgData.description || 'Telegram API rejected the message' },
          502,
          env
        );
      }

      return json({ ok: true }, 200, env);
    } catch (err) {
      console.error('Worker fetch error:', err);
      return json({ ok: false, error: 'Failed to reach Telegram' }, 502, env);
    }
  },
};

async function diag(env) {
  const report = { token_set: !!env.TELEGRAM_BOT_TOKEN, chat_id_set: !!env.TELEGRAM_CHAT_ID };

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    report.hint = 'Секреты не заданы. Выполни: wrangler secret put TELEGRAM_BOT_TOKEN и wrangler secret put TELEGRAM_CHAT_ID';
    return json(report, 200, env);
  }

  report.chat_id_looks_like_group = String(env.TELEGRAM_CHAT_ID).startsWith('-');

  // 1) Проверяем токен — getMe
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`);
    const me = await meRes.json();
    report.bot_token_valid = !!me.ok;
    if (me.ok) report.bot_username = '@' + me.result.username;
    else report.bot_token_error = me.description;
  } catch (e) {
    report.bot_token_valid = false;
    report.bot_token_error = String(e);
  }

  // 2) Проверяем, видит ли бот указанный chat_id
  try {
    const chatRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(env.TELEGRAM_CHAT_ID)}`
    );
    const chat = await chatRes.json();
    report.chat_reachable = !!chat.ok;
    if (chat.ok) {
      report.chat_type = chat.result.type;
      report.chat_title = chat.result.title || chat.result.username || '(личный чат)';
    } else {
      report.chat_error = chat.description;
      report.hint =
        chat.description && chat.description.includes('chat not found')
          ? 'chat_id неверный, либо бот ни разу не получал сообщений из этого чата. Для группы chat_id отрицательный (-100... для супергруппы). Узнать его: добавь в группу @RawDataBot.'
          : chat.description && chat.description.includes('not a member')
          ? 'Бот не состоит в этой группе — добавь его как участника.'
          : 'См. chat_error выше.';
    }
  } catch (e) {
    report.chat_reachable = false;
    report.chat_error = String(e);
  }

  return json(report, 200, env);
}

function buildContactText(body) {
  const name = String(body.name || '').trim().slice(0, 200);
  const email = String(body.email || '').trim().slice(0, 200);
  const message = String(body.message || '').trim().slice(0, 2000);

  if (!name || !message) return null;

  return (
    `📩 <b>Новая заявка с сайта Zara</b>\n\n` +
    `Имя: ${escapeHtml(name)}\n` +
    `Email: ${escapeHtml(email)}\n` +
    `Сообщение: ${escapeHtml(message)}`
  );
}

function buildOrderText(body) {
  const name = String(body.name || '').trim().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const address = String(body.address || '').trim().slice(0, 300);
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const total = Number(body.total) || 0;

  if (!name || !phone || !items.length) return null;

  const itemsText = items
    .map((i) => {
      const itemName = escapeHtml(String(i.name || '').slice(0, 120));
      const qty = Math.max(1, Math.min(999, Number(i.qty) || 1));
      const price = Number(i.price) || 0;
      const size = i.size ? ` (размер ${escapeHtml(String(i.size).slice(0, 10))})` : '';
      return `• ${itemName}${size} × ${qty} — ${formatPrice(price * qty)}`;
    })
    .join('\n');

  return (
    `🛍 <b>Новый заказ с сайта Zara</b>\n\n` +
    `Имя: ${escapeHtml(name)}\n` +
    `Телефон: ${escapeHtml(phone)}\n` +
    (address ? `Адрес: ${escapeHtml(address)}\n` : '') +
    `\n<b>Состав заказа:</b>\n${itemsText}\n\n` +
    `<b>Итого: ${formatPrice(total)}</b>`
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env),
    },
  });
}
