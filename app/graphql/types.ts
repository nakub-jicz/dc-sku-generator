// Typy dla danych produktów
export interface ProductVariant {
    id: string;
    title: string;
    sku: string | null;
    product: {
        id: string;
        title: string;
        vendor: string;
        productType: string;
        images: Array<{
            id: string;
            url: string;
            altText: string;
        }>;
    };
    selectedOptions: Array<{
        name: string;
        value: string;
    }>;
}

export interface LoaderData {
    products: ProductVariant[];
    scope: string;
    ids?: string[];
}

// Typy dla odpowiedzi GraphQL
export interface GraphQLProduct {
    id: string;
    title: string;
    vendor: string;
    productType: string;
    images: {
        nodes: Array<{
            id: string;
            url: string;
            altText: string;
        }>;
    };
    variants: {
        nodes: Array<{
            id: string;
            title: string;
            sku: string | null;
            selectedOptions: Array<{
                name: string;
                value: string;
            }>;
        }>;
    };
}

export interface GetAllProductsResponse {
    data: {
        products: {
            nodes: GraphQLProduct[];
        };
    };
}

export interface GetSpecificProductsResponse {
    data: {
        products: {
            nodes: GraphQLProduct[];
        };
    };
} 