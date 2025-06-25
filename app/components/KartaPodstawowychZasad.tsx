import { Card, TextField, InlineGrid, Text, Checkbox, BlockStack } from "@shopify/polaris";
import type { ZasadyGeneratora } from "../types/ZasadyGeneratora";

interface KartaPodstawowychZasadProps {
    zasady: ZasadyGeneratora;
    aktualizuj: (noweZasady: Partial<ZasadyGeneratora>) => void;
}

/**
 * Karta konfiguracji podstawowych bloków SKU.
 * 
 * MISJA: Umożliwia użytkownikowi ustawienie prefix, poczatekNumeracji i sufix.
 * To są fundamenty każdego SKU - bez nich nie ma struktury.
 * 
 * DOKTRYNA NR 3: Komponent jest głupim, posłusznym żołnierzem.
 * Każde wciśnięcie klawisza przez usera jest natychmiast meldowane do centrali.
 * Nie ma własnego zdania, nie zarządza globalnym stanem.
 */
export function KartaPodstawowychZasad({ zasady, aktualizuj }: KartaPodstawowychZasadProps) {
    return (
        <Card>
            <Text variant="headingMd" as="h2">
                Core SKU Settings
            </Text>

            <InlineGrid columns={3} gap="400">
                <TextField
                    label="Prefix"
                    value={zasady.prefix}
                    onChange={(value) => aktualizuj({ prefix: value })}
                    helpText="Text at the beginning of each SKU (e.g., 'SKU', 'PROD')"
                    autoComplete="off"
                />

                <TextField
                    label="Starting Number"
                    type="number"
                    value={zasady.poczatekNumeracji.toString()}
                    onChange={(value) => {
                        const numValue = parseInt(value) || 1;
                        aktualizuj({ poczatekNumeracji: numValue });
                    }}
                    helpText="Which number to start from (e.g., 1, 100, 1000)"
                    autoComplete="off"
                />

                <TextField
                    label="Suffix"
                    value={zasady.sufix}
                    onChange={(value) => aktualizuj({ sufix: value })}
                    helpText="Text at the end of each SKU (e.g., 'END', '2024')"
                    autoComplete="off"
                />
            </InlineGrid>

            <BlockStack gap="400">
                <Checkbox
                    label="Use Zero-Padded Numbering"
                    helpText="Format numbers with leading zeros (e.g., 001, 002, 003 instead of 1, 2, 3)"
                    checked={zasady.uzyjNumeracjiZZerami}
                    onChange={(checked) => aktualizuj({ uzyjNumeracjiZZerami: checked })}
                />

                {zasady.uzyjNumeracjiZZerami && (
                    <div style={{ width: '200px' }}>
                        <TextField
                            label="Number of Digits"
                            type="number"
                            value={zasady.iloscCyfrWNumeracji.toString()}
                            onChange={(value) => {
                                const numValue = parseInt(value) || 3;
                                // Minimum 2 digits, maximum 10 digits
                                const clampedValue = Math.max(2, Math.min(10, numValue));
                                aktualizuj({ iloscCyfrWNumeracji: clampedValue });
                            }}
                            helpText={`Numbers will be formatted like: ${(zasady.poczatekNumeracji).toString().padStart(zasady.iloscCyfrWNumeracji, '0')}`}
                            autoComplete="off"
                            min={2}
                            max={10}
                        />
                    </div>
                )}
            </BlockStack>
        </Card>
    );
} 