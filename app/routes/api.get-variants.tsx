import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        await authenticate.admin(request);
        const { admin } = await authenticate.admin(request);
        const { productIds } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return json({ error: "Invalid product IDs" }, { status: 400 });
        }

        const query = `#graphql
            query GetSpecificProducts($ids: [ID!]!) {
                nodes(ids: $ids) {
                    ... on Product {
                        id
                        title
                        vendor
                        productType
                        images(first: 1) {
                            nodes {
                                id
                                url
                                altText
                            }
                        }
                        variants(first: 50) {
                            nodes {
                                id
                                title
                                sku
                                selectedOptions {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await admin.graphql(query, {
            variables: {
                ids: productIds
            }
        });

        const data = await response.json();

        if ((data as any).errors) {
            console.error("GraphQL errors:", (data as any).errors);
            return json({ error: "GraphQL query failed", details: (data as any).errors }, { status: 500 });
        }

        const products = data.data?.nodes?.filter((node: any) => node !== null) || [];
        return json(products);

    } catch (error) {
        console.error("API Error:", error);
        return json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}; 