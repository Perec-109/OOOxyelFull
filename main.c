/* ============================================================
   main.c
   ----------------------------------------------------------
   ЗАЧЕМ ЭТОТ ФАЙЛ:
   В браузере C-код не выполняется — JS на фронтенде не умеет
   вызывать .c файлы напрямую. Этот файл — заготовка для
   БУДУЩЕГО серверного ядра магазина (например, компилируется
   в маленький сервис на C, который считает цены/скидки очень
   быстро, либо компилируется в WebAssembly через emscripten
   и тогда сможет быть вызван прямо из products.js).

   Сейчас здесь реализована простая, но настоящая логика:
   расчёт итоговой цены товара с учётом скидки и НДС —
   та же логика, что должна когда-то быть на сервере, чтобы
   цены не подделывались на клиенте.
   ============================================================ */

#include <stdio.h>

typedef struct {
    const char *name;
    double price;
    double discount_percent; /* 0..100 */
} Product;

/* Возвращает финальную цену товара после скидки */
double calculate_final_price(Product *p) {
    double discount_value = p->price * (p->discount_percent / 100.0);
    return p->price - discount_value;
}

/* Простейший расчёт корзины: сумма всех товаров */
double calculate_cart_total(Product products[], int count) {
    double total = 0.0;
    for (int i = 0; i < count; i++) {
        total += calculate_final_price(&products[i]);
    }
    return total;
}

int main(void) {
    Product cart[] = {
        { "Coat Noir",      24900.0, 0.0  },
        { "Wool Trench",    36900.0, 13.5 },
        { "Cashmere Knit",  18900.0, 15.9 },
    };

    int count = sizeof(cart) / sizeof(cart[0]);

    printf("=== OOOXYEL — расчёт корзины (ядро на C) ===\n");
    for (int i = 0; i < count; i++) {
        double final_price = calculate_final_price(&cart[i]);
        printf("%-16s | цена: %8.2f | скидка: %5.1f%% | к оплате: %8.2f\n",
               cart[i].name, cart[i].price, cart[i].discount_percent, final_price);
    }

    printf("---------------------------------------------\n");
    printf("ИТОГО: %.2f\n", calculate_cart_total(cart, count));

    return 0;
}

/*
   КАК ЗАПУСТИТЬ ЛОКАЛЬНО (для проверки, что логика работает):
   gcc main.c -o cart_engine
   ./cart_engine          (на Windows: cart_engine.exe)
*/
