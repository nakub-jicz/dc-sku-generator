import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
    Layout,
    Card,
    BlockStack,
    Text,
    Badge,
    Button,
    InlineStack,
    EmptyState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    await authenticate.admin(request);
    return json({});
};

export default function AuditPage() {
    const { } = useLoaderData<typeof loader>();

    return (
        <Layout>
            <Layout.Section>
                <BlockStack gap="400">
                    {/* Nagłówek sekcji */}
                    <InlineStack align="space-between">
                        <Text variant="headingLg" as="h1">
                            SKU Audit Trail
                        </Text>
                        <Badge tone="info">PRO</Badge>
                    </InlineStack>

                    {/* Opis funkcji */}
                    <Text as="p" variant="bodyMd">
                        Track every SKU change with detailed history, user attribution, and rollback capabilities.
                    </Text>

                    {/* Placeholder dla funkcji PRO */}
                    <Card>
                        <EmptyState
                            heading="Advanced audit features coming soon"
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>
                                The COMMANDO package will include comprehensive audit trails,
                                detailed change history, and powerful rollback capabilities.
                            </p>
                            <Button variant="primary" disabled>
                                Upgrade to COMMANDO
                            </Button>
                        </EmptyState>
                    </Card>

                    {/* Przykładowe funkcje */}
                    <Layout>
                        <Layout.Section>
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">
                                        Change History
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        Complete log of all SKU modifications with timestamps and user attribution.
                                    </Text>
                                    <Button disabled size="medium">
                                        View history
                                    </Button>
                                </BlockStack>
                            </Card>
                        </Layout.Section>

                        <Layout.Section>
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">
                                        Rollback System
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        Revert SKU changes to any previous state with one click.
                                    </Text>
                                    <Button disabled size="medium">
                                        Rollback
                                    </Button>
                                </BlockStack>
                            </Card>
                        </Layout.Section>

                        <Layout.Section>
                            <Card>
                                <BlockStack gap="300">
                                    <Text variant="headingSm" as="h3">
                                        Analytics
                                    </Text>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        Detailed reports on SKU generation patterns and usage statistics.
                                    </Text>
                                    <Button disabled size="medium">
                                        View analytics
                                    </Button>
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </BlockStack>
            </Layout.Section>
        </Layout>
    );
} 