export const APP_METADATA = {
    name: "DC SKU Generator",
    version: "1.0.0",
    description: "Professional tool for automatically generating SKU codes for Shopify products. Save time and maintain consistent naming across your store.",
    author: "DC Development Team",
    supportEmail: "support@dcskugenerator.com",
    documentationUrl: "https://docs.dcskugenerator.com",
    privacyPolicyUrl: "https://dcskugenerator.com/privacy",
    termsOfServiceUrl: "https://dcskugenerator.com/terms",
    lastUpdated: "2025-06-26",
    features: [
        "Automatic SKU code generation",
        "Configurable naming rules",
        "Real-time preview of generated codes",
        "Support for multiple numbering formats",
        "Intuitive user interface built with Polaris Design System",
        "Full integration with Shopify Admin API",
        "Bulk operations for large catalogs",
        "Custom component support for product attributes"
    ],
    permissions: [
        "read_products",
        "write_products"
    ],
    categories: [
        "Inventory management",
        "Product organization",
        "Automation tools"
    ],
    // Built for Shopify 2025 compliance
    compliance: {
        builForShopify: true,
        polarisVersion: "2025-10RC",
        appBridgeVersion: "latest",
        accessibility: "WCAG 2.1 AA",
        performance: "Core Web Vitals optimized"
    }
} as const;

export const ONBOARDING_STEPS = [
    {
        id: "welcome",
        title: "Welcome to DC SKU Generator!",
        description: "Learn the basics of automatic SKU code generation"
    },
    {
        id: "setup",
        title: "Configure Rules",
        description: "Set up prefixes, suffixes, and numbering methods"
    },
    {
        id: "preview",
        title: "Preview & Testing",
        description: "See how your SKU codes will look"
    },
    {
        id: "generate",
        title: "Generate Codes",
        description: "Apply new SKU codes to selected products"
    }
] as const;

export const HELP_LINKS = {
    documentation: "https://help.shopify.com/en/manual/products/inventory/skus",
    support: "mailto:support@dcskugenerator.com",
    feedback: "https://forms.gle/feedback-form-link",
    changelog: "https://dcskugenerator.com/changelog"
} as const; 