import type { GraphQLProduct, ProductVariant } from './types';

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