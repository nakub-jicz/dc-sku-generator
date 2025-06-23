import {
    Card,
    BlockStack,
    Text,
    Badge,
    Button,
    InlineStack,
} from "@shopify/polaris";

export function KartaCommando() {
    return (
        <Card>
            <BlockStack gap="400">
                {/* Nagłówek z oznaczeniem PRO */}
                <InlineStack align="space-between">
                    <Text variant="headingMd" as="h2">
                        COMMANDO Features
                    </Text>
                    <Badge tone="info">PRO</Badge>
                </InlineStack>

                {/* Opis pakietu */}
                <Text as="p" variant="bodyMd">
                    Unlock unparalleled automation to dominate your inventory.
                </Text>

                {/* Sekcja Generatora Warunkowego */}
                <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">
                        Conditional Logic
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                        Set up IF...THEN... rules to assign specific SKU formats based on product attributes like type, vendor, or tags.
                    </Text>
                    <Button disabled>
                        Add condition
                    </Button>
                </BlockStack>

                {/* Sekcja Metafields */}
                <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">
                        Metafield Integration
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                        Incorporate any product or variant metafield directly into your SKU structure for ultimate customization.
                    </Text>
                    <Button disabled>
                        Add metafield source
                    </Button>
                </BlockStack>

                {/* Sekcja Audytu */}
                <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">
                        Advanced Audit Trail
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                        Track every SKU change with detailed history, user attribution, and rollback capabilities.
                    </Text>
                    <Button disabled>
                        View audit log
                    </Button>
                </BlockStack>

                {/* Sekcja Importu/Exportu */}
                <BlockStack gap="300">
                    <Text variant="headingSm" as="h3">
                        Bulk Operations
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                        Import SKU rules from CSV, export configurations, and schedule automated updates.
                    </Text>
                    <Button disabled>
                        Import/Export
                    </Button>
                </BlockStack>

                {/* Przycisk Upgrade */}
                <BlockStack gap="200">
                    <Button variant="primary" size="large" fullWidth disabled>
                        Upgrade to COMMANDO
                    </Button>
                    <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Coming soon - Join the elite
                    </Text>
                </BlockStack>
            </BlockStack>
        </Card>
    );
} 