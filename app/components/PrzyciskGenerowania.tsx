import { Button, Card, BlockStack, Text, InlineStack } from "@shopify/polaris";
import { PlayIcon } from "@shopify/polaris-icons";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";

interface PrzyciskGenerowaniaProps {
    zasady: ZasadyGeneratora;
    onGeneruj: () => void;
    selectedCount: number;
    isLoading?: boolean;
}

/**
 * Komponent przycisku generowania produktów z SKU.
 * 
 * MISJA: Umożliwia użytkownikowi wygenerowanie produktów z aktualnymi ustawieniami SKU.
 * To jest nasz system bojowy - łączy konfigurację z rzeczywistym generowaniem.
 * 
 * TAKTYKA: Przycisk jest aktywny tylko gdy konfiguracja jest kompletna.
 * Pokazujemy podsumowanie tego, co zostanie wygenerowane.
 */
export function PrzyciskGenerowania({ zasady, onGeneruj, selectedCount, isLoading = false }: PrzyciskGenerowaniaProps) {
    // Sprawdzamy czy konfiguracja jest kompletna
    const czyKonfiguracjaKompletna = zasady.prefix || zasady.sufix || zasady.typBody !== "disable_body";

    // Określamy czy użyć bulk operations
    const shouldUseBulk = selectedCount > 10;
    const buttonPrefix = shouldUseBulk ? "Bulk " : "";
    const metodaInfo = shouldUseBulk ? " (Bulk API)" : " (Standard API)";

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Generowanie produktów
                </Text>

                <BlockStack gap="300">
                    <Text variant="bodyMd" as="p">
                        Kliknij poniższy przycisk, aby wygenerować produkty z aktualnymi ustawieniami SKU.
                    </Text>

                    <InlineStack gap="400" align="start">
                        <Button
                            variant="primary"
                            size="large"
                            icon={PlayIcon}
                            onClick={onGeneruj}
                            loading={isLoading}
                            disabled={!czyKonfiguracjaKompletna || isLoading || selectedCount === 0}
                        >
                            {isLoading ? "Generowanie..." : `${buttonPrefix}Generate SKU (${selectedCount})`}
                        </Button>

                        {!czyKonfiguracjaKompletna && (
                            <Text variant="bodyMd" as="p" tone="critical">
                                Skonfiguruj przynajmniej prefix, sufix lub główną część SKU
                            </Text>
                        )}
                    </InlineStack>

                    {czyKonfiguracjaKompletna && selectedCount > 0 && (
                        <Text variant="bodyMd" as="p" tone="subdued">
                            Zostanie zaktualizowanych {selectedCount} wariantów z nowymi SKU{metodaInfo}.
                            {shouldUseBulk && " Bulk operations są używane dla większych operacji."}
                        </Text>
                    )}
                </BlockStack>
            </BlockStack>
        </Card>
    );
} 