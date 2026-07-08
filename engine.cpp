/* ============================================================
   engine.cpp
   ----------------------------------------------------------
   ЗАЧЕМ ЭТОТ ФАЙЛ:
   Объектно-ориентированный пример того, как могла бы выглядеть
   часть реального backend-сервиса OOOXYEL — модуль учёта
   остатков на складе (inventory engine). На фронтенде такого
   кода никогда не будет: им управляет сервер (Node.js / C++ /
   Go — без разницы), а сайт просто получает готовый JSON через
   fetch(). Этот файл — демонстрация, ЧТО могло бы стоять
   "за кулисами" products.js в реальном проекте с базой данных.
   ============================================================ */

#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

class Item {
public:
    std::string name;
    int stock;
    double price;

    Item(std::string n, int s, double p) : name(std::move(n)), stock(s), price(p) {}

    bool isAvailable() const { return stock > 0; }

    bool reserve(int quantity) {
        if (quantity > stock) return false;
        stock -= quantity;
        return true;
    }
};

class Inventory {
private:
    std::vector<Item> items;

public:
    void addItem(const Item &item) { items.push_back(item); }

    Item* findByName(const std::string &name) {
        auto it = std::find_if(items.begin(), items.end(),
            [&](const Item &i) { return i.name == name; });
        return it != items.end() ? &(*it) : nullptr;
    }

    void printReport() const {
        std::cout << "=== OOOXYEL — отчёт по складу (ядро на C++) ===\n";
        for (const auto &item : items) {
            std::cout << item.name << " | остаток: " << item.stock
                      << " | цена: " << item.price
                      << " | доступен: " << (item.isAvailable() ? "да" : "нет") << "\n";
        }
    }
};

int main() {
    Inventory warehouse;
    warehouse.addItem(Item("Coat Noir", 12, 24900.0));
    warehouse.addItem(Item("Wool Trench", 0, 36900.0));
    warehouse.addItem(Item("Signature Suit", 5, 38900.0));

    warehouse.printReport();

    Item* target = warehouse.findByName("Coat Noir");
    if (target && target->reserve(2)) {
        std::cout << "\nЗарезервировано 2 шт. 'Coat Noir'. Остаток: "
                  << target->stock << "\n";
    }

    return 0;
}

/*
   КАК ЗАПУСТИТЬ ЛОКАЛЬНО:
   g++ engine.cpp -o inventory_engine -std=c++17
   ./inventory_engine
*/
