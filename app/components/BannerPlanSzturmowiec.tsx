import { Banner, BlockStack, Text, InlineStack, Button } from "@shopify/polaris";

/**
 * Banner informacyjny o planie SZTURMOWIEC.
 * 
 * MISJA: Informuje użytkownika, że ma dostęp do pełnej funkcjonalności za darmo.
 * To jest nasz system propagandowy - pokazujemy siłę darmowego planu.
 * 
 * TAKTYKA: Używamy pozytywnego tonu i jasno komunikujemy wartość.
 * Banner ma być widoczny, ale nie nachalny.
 */
export function BannerPlanSzturmowiec() {
    return (
        <Banner
            title="Plan SZTURMOWIEC - Pełna funkcjonalność ZA DARMO!"
            tone="success"
        >
            <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                    <strong>Wszystkie funkcje są dostępne w darmowym planie SZTURMOWIEC:</strong>
                </Text>

                <InlineStack gap="400" wrap>
                    <Text variant="bodyMd" as="span" fontWeight="semibold">
                        Kontynuacja numeracji od ostatniego
                    </Text>
                    <Text variant="bodyMd" as="span" fontWeight="semibold">
                        Wszystkie dodatkowe komponenty
                    </Text>
                    <Text variant="bodyMd" as="span" fontWeight="semibold">
                        Elastyczne separatory
                    </Text>
                    <Text variant="bodyMd" as="span" fontWeight="semibold">
                        Podgląd w czasie rzeczywistym
                    </Text>
                </InlineStack>

                <Text variant="bodyMd" as="p" tone="subdued">
                    Nie ma ukrytych opłat ani ograniczeń. To jest nasza strategia "SPALONA ZIEMIA" -
                    dajemy Ci wszystko, czego potrzebujesz, żebyś mógł skupić się na swoim biznesie.
                </Text>
            </BlockStack>
        </Banner>
    );
} 