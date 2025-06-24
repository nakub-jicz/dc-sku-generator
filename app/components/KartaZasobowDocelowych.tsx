import { useLocation, useFetcher } from "@remix-run/react";
import {
    Card,
    BlockStack,
    Text,
    Button,
    InlineStack,
    Badge,
} from "@shopify/polaris";

export function KartaZasobowDocelowych() {
    const location = useLocation();
    const fetcher = useFetcher();
    const params = new URLSearchParams(location.search);
    const currentScope = params.get("scope") || "all";
    const currentIds = params.get("ids")?.split(",") || [];
    const currentValues = params.get("values")?.split(",") || [];

    // Wyświetlanie aktualnego scope z wyraźnym wskaźnikiem wizualnym
    const renderCurrentScopeIndicator = () => {
        switch (currentScope) {
            case 'all':
                return (
                    <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success">✓</Badge>
                        <Text as="span" variant="bodyMd">
                            Current Target: All Products
                        </Text>
                    </InlineStack>
                );
            case 'collections':
                if (currentIds.length > 0 && currentIds[0] !== "") {
                    return (
                        <InlineStack gap="200" blockAlign="center">
                            <Badge tone="info">{`Current Target: ${currentIds.length.toString()} Collection${currentIds.length !== 1 ? 's' : ''}`}</Badge>
                        </InlineStack>
                    );
                }
                return null;
            case 'products':
                if (currentIds.length > 0 && currentIds[0] !== "") {
                    return (
                        <InlineStack gap="200" blockAlign="center">
                            <Badge tone="info">{`Current Target: ${currentIds.length.toString()} Product${currentIds.length !== 1 ? 's' : ''}`}</Badge>
                        </InlineStack>
                    );
                }
                return null;
            case 'variants':
                if (currentIds.length > 0 && currentIds[0] !== "") {
                    return (
                        <InlineStack gap="200" blockAlign="center">
                            <Badge tone="info">{`Current Target: ${currentIds.length.toString()} Variant${currentIds.length !== 1 ? 's' : ''}`}</Badge>
                        </InlineStack>
                    );
                }
                return null;
            case 'tags':
                if (currentValues.length > 0 && currentValues[0] !== "") {
                    return (
                        <InlineStack gap="200" blockAlign="center">
                            <Badge tone="info">{`Current Target: ${currentValues.length.toString()} Tag${currentValues.length !== 1 ? 's' : ''}`}</Badge>
                        </InlineStack>
                    );
                }
                return null;
            default:
                return null;
        }
    };

    return (
        <Card>
            <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                    Step 1: Define Target Scope
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                    Choose where you want to generate SKUs. Select the scope of your operation.
                </Text>
                <fetcher.Form method="post">
                    <input type="hidden" name="scope" value="all" />
                    <Button submit fullWidth variant="primary">
                        Target All Products
                    </Button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="scope" value="collections" />
                    <Button submit fullWidth variant="secondary">
                        Target by Collections
                    </Button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="scope" value="products" />
                    <Button submit fullWidth variant="secondary">
                        Target by Products
                    </Button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="scope" value="variants" />
                    <Button submit fullWidth variant="secondary">
                        Target by Variants
                    </Button>
                </fetcher.Form>
                <fetcher.Form method="post">
                    <input type="hidden" name="scope" value="tags" />
                    <Button submit fullWidth variant="secondary">
                        Target by Tags
                    </Button>
                </fetcher.Form>
                {renderCurrentScopeIndicator()}
            </BlockStack>
        </Card>
    );
}