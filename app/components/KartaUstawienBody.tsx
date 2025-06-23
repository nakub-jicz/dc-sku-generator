import { Card, ChoiceList, Select, BlockStack, Text } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";
import { TypBody } from "../types/ZasadyGeneratora";

interface KartaUstawienBodyProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

/**
 * Karta konfiguracji głównej, numerycznej części SKU.
 * 
 * MISJA: Panel sterowania głównym silnikiem maszyny.
 * Umożliwia wybór strategii generowania body SKU i konfigurację separatora.
 * 
 * STRATEGIA "SPALONA ZIEMIA": Wszystkie opcje są darmowe w planie "Szturmowiec".
 * Kontynuacja od ostatniego SKU jest w pełni funkcjonalna bez ograniczeń.
 */
export function KartaUstawienBody({ zasady, aktualizuj }: KartaUstawienBodyProps) {
    const opcjeTypuBody = [
        {
            label: "Kolejny numer (1, 2, 3...)",
            value: TypBody.KOLEJNY_NUMER,
            helpText: "Generuje kolejne numery od ustawionego początku"
        },
        {
            label: "Kontynuuj od ostatniego",
            value: TypBody.KONTYNUUJ_OSTATNI,
            helpText: "Automatycznie znajduje najwyższy użyty numer i kontynuuje"
        },
        {
            label: "ID produktu",
            value: TypBody.ID_PRODUKTU,
            helpText: "Używa unikalnego ID produktu z Shopify"
        },
        {
            label: "ID wariantu",
            value: TypBody.ID_WARIANTU,
            helpText: "Używa unikalnego ID wariantu z Shopify"
        },
        {
            label: "Losowy numer",
            value: TypBody.LOSOWY_NUMER,
            helpText: "Generuje losowy numer dla każdego SKU"
        },
        {
            label: "Bez body",
            value: TypBody.BEZ_BODY,
            helpText: "Pomija główną część numeryczną"
        },
    ];

    const opcjeSeparatora = [
        { label: "Brak separatora", value: "" },
        { label: "Myślnik (-)", value: "-" },
        { label: "Podkreślenie (_)", value: "_" },
        { label: "Kropka (.)", value: "." },
        { label: "Spacja ( )", value: " " },
    ];

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Główna część SKU
                </Text>

                <ChoiceList
                    title="Typ generowania"
                    choices={opcjeTypuBody}
                    selected={[zasady.typBody]}
                    onChange={(selected) => {
                        if (selected.length > 0) {
                            aktualizuj({ typBody: selected[0] as TypBody });
                        }
                    }}
                />

                <Text variant="bodyMd" as="p" tone="subdued">
                    Wybierz strategię generowania głównej części SKU
                </Text>

                <Select
                    label="Separator"
                    options={opcjeSeparatora}
                    value={zasady.separator}
                    onChange={(value) => aktualizuj({ separator: value })}
                    helpText="Znak oddzielający części SKU"
                />
            </BlockStack>
        </Card>
    );
} 