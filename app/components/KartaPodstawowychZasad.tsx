import { Card, TextField, InlineGrid, Text } from "@shopify/polaris";
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
        </Card>
    );
} 