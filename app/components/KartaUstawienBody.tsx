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
            label: "Consecutive Number (1, 2, 3...)",
            value: TypBody.KOLEJNY_NUMER,
            helpText: "Generates sequential numbers from the set start"
        },
        {
            label: "Continue from Last SKU",
            value: TypBody.KONTYNUUJ_OSTATNI,
            helpText: "Automatically finds the highest used number and continues"
        },
        {
            label: "Product ID",
            value: TypBody.ID_PRODUKTU,
            helpText: "Uses the unique Product ID from Shopify"
        },
        {
            label: "Variant ID",
            value: TypBody.ID_WARIANTU,
            helpText: "Uses the unique Variant ID from Shopify"
        },
        {
            label: "Random Number",
            value: TypBody.LOSOWY_NUMER,
            helpText: "Generates a random number for each SKU"
        },
        {
            label: "Disable Body",
            value: TypBody.BEZ_BODY,
            helpText: "Skips the main numerical part"
        },
    ];

    const opcjeSeparatora = [
        { label: "No Separator", value: "" },
        { label: "Dash (-)", value: "-" },
        { label: "Underscore (_)", value: "_" },
        { label: "Dot (.)", value: "." },
        { label: "Space ( )", value: " " },
    ];

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    SKU Main Body & Separator
                </Text>

                <ChoiceList
                    title="Generation Type"
                    choices={opcjeTypuBody}
                    selected={[zasady.typBody]}
                    onChange={(selected) => {
                        if (selected.length > 0) {
                            aktualizuj({ typBody: selected[0] as TypBody });
                        }
                    }}
                />

                <Text variant="bodyMd" as="p" tone="subdued">
                    Choose the generation strategy for the main part of the SKU.
                </Text>

                <Select
                    label="Separator"
                    options={opcjeSeparatora}
                    value={zasady.separator}
                    onChange={(value) => aktualizuj({ separator: value })}
                    helpText="Character separating SKU parts"
                />
            </BlockStack>
        </Card>
    );
} 