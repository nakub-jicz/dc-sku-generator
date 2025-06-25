import { useLocation, useFetcher } from "@remix-run/react";
import {
    Card,
    BlockStack,
    Text,
    Button,
    InlineStack,
    Badge,
    Divider,
} from "@shopify/polaris";

export function KartaZasobowDocelowych() {
    const location = useLocation();
    const fetcher = useFetcher();
    const params = new URLSearchParams(location.search);
    const currentScope = params.get("scope") || "none";
    const currentIds = params.get("ids")?.split(",") || [];

    // Wyświetlanie aktualnego scope z wyraźnym wskaźnikiem wizualnym
    const renderCurrentScopeIndicator = () => {
        switch (currentScope) {
            case 'all':
                return (
                    <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">✓</Badge>
                        <Text as="span" variant="bodyMd">
                            All Products Selected
                        </Text>
                    </InlineStack>
                );
            case 'products':
                if (currentIds.length > 0 && currentIds[0] !== "") {
                    return (
                        <InlineStack gap="200" blockAlign="center">
                            <Badge tone="info">{`${currentIds.length} Product${currentIds.length !== 1 ? 's' : ''} Selected`}</Badge>
                        </InlineStack>
                    );
                }
                return null;
            case 'none':
            default:
                return (
                    <InlineStack gap="200" blockAlign="center">
                        <Badge>◦</Badge>
                        <Text as="span" variant="bodyMd" tone="subdued">
                            No Products Selected
                        </Text>
                    </InlineStack>
                );
        }
    };

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Product Selection
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                    Choose which products you want to generate SKUs for.
                </Text>

                <Divider />

                <BlockStack gap="300">
                    <fetcher.Form method="post">
                        <input type="hidden" name="scope" value="all" />
                        <Button submit fullWidth variant="primary">
                            All Products
                        </Button>
                    </fetcher.Form>

                    <fetcher.Form method="post">
                        <input type="hidden" name="scope" value="products" />
                        <Button submit fullWidth variant="secondary">
                            Select Specific Products
                        </Button>
                    </fetcher.Form>
                </BlockStack>

                {renderCurrentScopeIndicator()}
            </BlockStack>
        </Card>
    );
}