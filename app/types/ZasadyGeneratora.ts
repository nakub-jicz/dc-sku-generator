/**
 * Definiuje, w jaki sposób może być generowana główna, numeryczna część SKU.
 * Każda wartość to konkretna strategia.
 */
export enum TypBody {
    KOLEJNY_NUMER = "consecutive",
    KONTYNUUJ_OSTATNI = "continue_from_last", // Paid
    BEZ_BODY = "disable_body",
    ID_PRODUKTU = "product_id",
    ID_WARIANTU = "variant_id",
    LOSOWY_NUMER = "random",
}

/**
 * Definiuje typy opcjonalnych, dodatkowych części, które można dołączyć do SKU.
 * To jest nasz arsenał dodatkowych informacji.
 */
export enum DodatkowyKomponentTyp {
    NAZWA_PRODUKTU = "product_name",
    NAZWA_WARIANTU = "variant_name",
    DOSTAWCA = "product_vendor",
    TYP_PRODUKTU = "product_type",
    STARE_SKU = "old_sku",
    OPCJA_1 = "variant_option1",
    OPCJA_2 = "variant_option2",
    OPCJA_3 = "variant_option3",
    // W przyszłości dodamy tu również obsługę metafields.
}

/**
 * Reprezentuje pojedynczy, opcjonalny komponent dodany do SKU.
 * Unikalne 'id' jest kluczowe dla Reacta i operacji na listach (np. drag-and-drop).
 */
export interface DodatkowyKomponent {
    id: string; // np. 'product_name_1678886400000'
    typ: DodatkowyKomponentTyp;
}

/**
 * Centralny, nadrzędny interfejs dla CAŁEGO stanu konfiguracji generatora.
 * To jest plan bitwy. Każde pole w interfejsie użytkownika ma tutaj swoje odzwierciedlenie.
 */
export interface ZasadyGeneratora {
    // Podstawowe bloki konstrukcyjne
    prefix: string;
    sufix: string;

    // Główna logika numeryczna
    poczatekNumeracji: number;
    typBody: TypBody;

    // Elastyczny separator
    separator: string;

    // Komponenty opcjonalne (zarządzane przez użytkownika)
    dodatkoweKomponenty: DodatkowyKomponent[];

    // Porządek bitwy - tablica ID komponentów definiująca finalną strukturę SKU
    ukladSKU: string[]; // np. ['prefix', 'body', 'nazwa_produktu_123', 'sufix']
} 