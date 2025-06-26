import type { GraphQLProduct, ProductVariant, GetAllProductsResponse, GetSpecificProductsResponse } from './types';

/**
 * Przekształca dane produktu z GraphQL na format używany w aplikacji
 */
export function transformProductsToVariants(products: GraphQLProduct[]): ProductVariant[] {
    return products.flatMap((product) =>
        product.variants.nodes.map((variant) => ({
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
            product: {
                id: product.id,
                title: product.title,
                vendor: product.vendor,
                productType: product.productType,
                images: product.media.nodes.map(node => ({
                    id: node.id,
                    url: node.image.url,
                    altText: node.image.altText,
                })),
            },
            selectedOptions: variant.selectedOptions,
        }))
    );
}

/**
 * Tworzy query string dla wyszukiwania konkretnych produktów po ID
 */
export function buildProductIdsQuery(ids: string[]): string {
    return `id:(${ids.join(' OR id:')})`;
}

/**
 * Pobiera wszystkie produkty używając paginacji
 */
export async function fetchAllProductsPaginated(
    admin: any,
    query: string,
    variables: { query?: string } = {}
): Promise<ProductVariant[]> {
    let allProducts: ProductVariant[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 250;

    while (hasNextPage) {
        const response = await admin.graphql(query, {
            variables: {
                first: pageSize,
                after: cursor,
                ...variables,
            },
        });

        const data = await response.json() as GetAllProductsResponse | GetSpecificProductsResponse;
        const products = transformProductsToVariants(data.data.products.nodes);

        allProducts = [...allProducts, ...products];
        hasNextPage = data.data.products.pageInfo.hasNextPage;
        cursor = data.data.products.pageInfo.endCursor;
    }

    return allProducts;
} 