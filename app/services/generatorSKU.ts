import type { ZasadyGeneratora, DodatkowyKomponent } from "../types/ZasadyGeneratora";
import { TypBody, DodatkowyKomponentTyp } from "../types/ZasadyGeneratora";

// Typ dla wariantu produktu - na razie uproszczony
// W przyszłości będzie pochodził z typów GraphQL
interface ProductVariant {
    id: string;
    title: string;
    sku: string | null;
    product: {
        id: string;
        title: string;
        vendor: string;
        productType: string;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
}

/**
 * Generuje pojedyncze SKU na podstawie zasad i danych wariantu.
 * Działa jak snajper - dostaje cel i warunki, i wykonuje jedno, perfekcyjne zadanie.
 *
 * @param zasady - Aktualne zasady generowania SKU.
 * @param wariant - Obiekt wariantu produktu z danymi.
 * @param index - Numer porządkowy wariantu na liście (dla numeracji sekwencyjnej).
 * @returns Wygenerowane SKU jako string.
 */
export function generujPojedynczeSKU(
    zasady: ZasadyGeneratora,
    wariant: ProductVariant,
    index: number
): string {
    // Krok 1: Stwórz mapę komponentów
    const dostepneCzesci: { [key: string]: string } = {
        prefix: zasady.prefix,
        sufix: zasady.sufix,
    };

    // Krok 2: Wygeneruj 'body'
    switch (zasady.typBody) {
        case TypBody.KOLEJNY_NUMER:
            dostepneCzesci['body'] = (zasady.poczatekNumeracji + index).toString();
            break;
        case TypBody.ID_PRODUKTU:
            dostepneCzesci['body'] = wariant.product.id.split('/').pop() || "";
            break;
        case TypBody.ID_WARIANTU:
            dostepneCzesci['body'] = wariant.id.split('/').pop() || "";
            break;
        case TypBody.LOSOWY_NUMER:
            dostepneCzesci['body'] = Math.floor(1000 + Math.random() * 9000).toString();
            break;
        case TypBody.KONTYNUUJ_OSTATNI:
            // Logika do implementacji - na razie placeholder
            dostepneCzesci['body'] = (100 + index).toString();
            break;
        case TypBody.BEZ_BODY:
            dostepneCzesci['body'] = "";
            break;
    }

    // Krok 3: Wygeneruj części dodatkowe
    zasady.dodatkoweKomponenty.forEach((komponent: DodatkowyKomponent) => {
        let wartosc = "";
        switch (komponent.typ) {
            case DodatkowyKomponentTyp.NAZWA_PRODUKTU:
                wartosc = wariant.product.title;
                break;
            case DodatkowyKomponentTyp.NAZWA_WARIANTU:
                wartosc = wariant.title;
                break;
            case DodatkowyKomponentTyp.DOSTAWCA:
                wartosc = wariant.product.vendor;
                break;
            case DodatkowyKomponentTyp.TYP_PRODUKTU:
                wartosc = wariant.product.productType;
                break;
            case DodatkowyKomponentTyp.STARE_SKU:
                wartosc = wariant.sku || "";
                break;
            case DodatkowyKomponentTyp.OPCJA_1:
                wartosc = wariant.selectedOptions[0]?.value || "";
                break;
            case DodatkowyKomponentTyp.OPCJA_2:
                wartosc = wariant.selectedOptions[1]?.value || "";
                break;
            case DodatkowyKomponentTyp.OPCJA_3:
                wartosc = wariant.selectedOptions[2]?.value || "";
                break;
        }
        dostepneCzesci[komponent.id] = wartosc;
    });

    // Krok 4: Sklej SKU - to jest, kurwa, czysta poezja
    const finalneSKU = zasady.ukladSKU
        .map(id => dostepneCzesci[id])
        .filter(Boolean)
        .join(zasady.separator);

    return finalneSKU;
} 