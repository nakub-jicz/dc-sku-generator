/**
 * Defines how the main, numerical part of the SKU can be generated.
 * Each value represents a specific strategy.
 */
export enum BodyType {
    CONSECUTIVE = "consecutive",
    CONTINUE_FROM_LAST = "continue_from_last", // Paid
    DISABLE_BODY = "disable_body",
    PRODUCT_ID = "product_id",
    VARIANT_ID = "variant_id",
    RANDOM = "random",
}

/**
 * Defines the types of optional, additional parts that can be included in the SKU.
 * This is our arsenal of additional information.
 */
export enum AdditionalComponentType {
    PRODUCT_NAME = "product_name",
    VARIANT_NAME = "variant_name",
    VENDOR = "product_vendor",
    PRODUCT_TYPE = "product_type",
    OLD_SKU = "old_sku",
    OPTION_1 = "variant_option1",
    OPTION_2 = "variant_option2",
    OPTION_3 = "variant_option3",
    // In the future, we will also add support for metafields here.
}

/**
 * Represents a single, optional component added to the SKU.
 * The unique 'id' is crucial for React and list operations (e.g., drag-and-drop).
 */
export interface AdditionalComponent {
    id: string; // e.g., 'product_name_1678886400000'
    type: AdditionalComponentType;
}

/**
 * The central, parent interface for the ENTIRE generator configuration state.
 * This is the battle plan. Every field in the user interface is reflected here.
 */
export interface GeneratorRules {
    // Basic building blocks
    prefix: string;
    suffix: string;

    // Main numerical logic
    startingNumber: number;
    bodyType: BodyType;

    // Flexible separator
    separator: string;

    // Optional components (managed by the user)
    additionalComponents: AdditionalComponent[];

    // Order of battle - an array of component IDs defining the final SKU structure
    skuLayout: string[]; // e.g., ['prefix', 'body', 'product_name_123', 'suffix']
} 