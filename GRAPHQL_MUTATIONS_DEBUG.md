# DOKADNY PRZEGLD MUTACJI WYSYANYCH DO GRAPHQL

## 🔹 1. BULK OPERATIONS - Sekwencja mutacji

### A) Pierwsza mutacja - stagedUploadsCreate
**Cel:** Utworzenie staged upload URL dla pliku JSONL

`graphql
mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
        stagedTargets {
            url
            resourceUrl
            parameters {
                name
                value
            }
        }
        userErrors {
            field
            message
        }
    }
}
`

**Variables:**
`json
{
  "input": [{
    "filename": "bulk-sku-update.jsonl",
    "mimeType": "text/jsonl", 
    "httpMethod": "POST",
    "resource": "BULK_MUTATION_VARIABLES"
  }]
}
`

### B) Druga mutacja - bulkOperationRunMutation
**Cel:** Uruchomienie bulk operation z szablonem mutacji

`graphql
mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
    bulkOperationRunMutation(
        mutation: $mutation,
        stagedUploadPath: $stagedUploadPath
    ) {
        bulkOperation {
            id
            status
            createdAt
            completedAt
            objectCount
            fileSize
            url
            partialDataUrl
            type
        }
        userErrors {
            field
            message
        }
    }
}
`

**Variables:**
`json
{
  "mutation": "mutation productSet($id: ID!, $options: [ProductOptionInput!]!, $variants: [ProductVariantInput!]!) { productSet(synchronous: true, input: {id: $id, options: $options, variants: $variants}) { product { id title variants(first: 250) { edges { node { id sku title } } } } userErrors { field message code } } }",
  "stagedUploadPath": "staged-uploads://shopify/temp/bulk-sku-update.jsonl"
}
`

### C) Szablon mutacji wysyany w bulk operation

**Synchroniczny (≤100 wariantów):**
`graphql
mutation productSet($id: ID!, $options: [ProductOptionInput!]!, $variants: [ProductVariantInput!]!) {
    productSet(synchronous: true, input: {id: $id, options: $options, variants: $variants}) {
        product {
            id
            title
            variants(first: 250) {
                edges {
                    node {
                        id
                        sku
                        title
                    }
                }
            }
        }
        userErrors {
            field
            message
            code
        }
    }
}
`

**Asynchroniczny (>100 wariantów):**
`graphql
mutation productSet($id: ID!, $options: [ProductOptionInput!]!, $variants: [ProductVariantInput!]!) {
    productSet(synchronous: false, input: {id: $id, options: $options, variants: $variants}) {
        product {
            id
            title
            variants(first: 250) {
                edges {
                    node {
                        id
                        sku
                        title
                    }
                }
            }
        }
        productSetOperation {
            id
            status
            userErrors {
                field
                message
                code
            }
        }
        userErrors {
            field
            message
            code
        }
    }
}
`

### D) Plik JSONL - przykadowa zawarto
**Kada linia = jeden produkt z opcjami i wariantami**

`json
{"id":"gid://shopify/Product/123","options":[{"name":"Color","values":["Red","Blue"]},{"name":"Size","values":["M","L"]}],"variants":[{"id":"gid://shopify/ProductVariant/456","sku":"NEW-SKU-001","optionValues":[{"name":"Color","value":"Red"},{"name":"Size","value":"M"}]},{"id":"gid://shopify/ProductVariant/789","sku":"NEW-SKU-002","optionValues":[{"name":"Color","value":"Blue"},{"name":"Size","value":"L"}]}]}
{"id":"gid://shopify/Product/456","options":[{"name":"Title","values":["Default Title"]}],"variants":[{"id":"gid://shopify/ProductVariant/999","sku":"SIMPLE-SKU-001","optionValues":[{"name":"Title","value":"Default Title"}]}]}
`

**Sformatowana wersja dla czytelnoci:**
`json
{
  "id": "gid://shopify/Product/123",
  "options": [
    {
      "name": "Color",
      "values": ["Red", "Blue"]
    },
    {
      "name": "Size",
      "values": ["M", "L"]
    }
  ],
  "variants": [
    {
      "id": "gid://shopify/ProductVariant/456",
      "sku": "NEW-SKU-001",
      "optionValues": [
        {"name": "Color", "value": "Red"},
        {"name": "Size", "value": "M"}
      ]
    },
    {
      "id": "gid://shopify/ProductVariant/789",
      "sku": "NEW-SKU-002", 
      "optionValues": [
        {"name": "Color", "value": "Blue"},
        {"name": "Size", "value": "L"}
      ]
    }
  ]
}
`

## 🔹 2. STANDARDOWE API - Bezporednie mutacje

### A) Mutacja synchroniczna (≤100 wariantów)
`graphql
mutation productSetSync($input: ProductSetInput!) {
    productSet(synchronous: true, input: $input) {
        product {
            id
            title
            variants(first: 250) {
                edges {
                    node {
                        id
                        sku
                        title
                    }
                }
            }
        }
        userErrors {
            field
            message
            code
        }
    }
}
`

### B) Mutacja asynchroniczna (>100 wariantów)
`graphql
mutation productSetAsync($input: ProductSetInput!) {
    productSet(synchronous: false, input: $input) {
        product {
            id
            title
            variants(first: 250) {
                edges {
                    node {
                        id
                        sku
                        title
                    }
                }
            }
        }
        productSetOperation {
            id
            status
            userErrors {
                field
                message
                code
            }
        }
        userErrors {
            field
            message
            code
        }
    }
}
`

### C) Variables dla standardowego API
`json
{
  "input": {
    "id": "gid://shopify/Product/123",
    "options": [
      {
        "name": "Color",
        "values": ["Red", "Blue"]
      },
      {
        "name": "Size", 
        "values": ["M", "L"]
      }
    ],
    "variants": [
      {
        "id": "gid://shopify/ProductVariant/456",
        "sku": "NEW-SKU-001",
        "optionValues": [
          {"name": "Color", "value": "Red"},
          {"name": "Size", "value": "M"}
        ]
      },
      {
        "id": "gid://shopify/ProductVariant/789", 
        "sku": "NEW-SKU-002",
        "optionValues": [
          {"name": "Color", "value": "Blue"},
          {"name": "Size", "value": "L"}
        ]
      }
    ]
  }
}
`

## 🔹 3. MONITORING QUERIES

### A) Sprawdzanie statusu bulk operation
`graphql
query getBulkOperation($id: ID!) {
    node(id: $id) {
        ... on BulkOperation {
            id
            status
            createdAt
            completedAt
            objectCount
            fileSize
            url
            partialDataUrl
            errorCode
            type
        }
    }
}
`

**Variables:**
`json
{
  "id": "gid://shopify/BulkOperation/123456789"
}
`

### B) Sprawdzanie aktualnej bulk operation
`graphql
query getCurrentBulkOperation {
    currentBulkOperation {
        id
        status
        createdAt
        completedAt
        objectCount
        fileSize
        url
        partialDataUrl
        errorCode
        type
    }
}
`

**Variables:** {}

## 🔹 4. STRUKTURA DANYCH - ProductSetInput

### TypeScript Interface
`	ypescript
interface ProductSetInput {
  id: string;                    // ID produktu
  options: ProductOptionInput[]; // WYMAGANE - opcje produktu
  variants: ProductVariantInput[]; // Warianty do zaktualizowania
}

interface ProductOptionInput {
  name: string;      // Nazwa opcji (np. "Color", "Size")
  values: string[];  // Moliwe wartoci (np. ["Red", "Blue"])
}

interface ProductVariantInput {
  id: string;                        // ID wariantu
  sku: string;                       // Nowe SKU
  optionValues: VariantOptionValueInput[]; // WYMAGANE - wartoci opcji
}

interface VariantOptionValueInput {
  name: string;   // Nazwa opcji (np. "Color")
  value: string;  // Warto opcji (np. "Red")
}
`

## 🔹 5. PRZYKADY RÓNYCH TYPÓW PRODUKTÓW

### Produkt z wieloma opcjami:
`json
{
  "id": "gid://shopify/Product/123",
  "options": [
    {"name": "Color", "values": ["Red", "Blue", "Green"]},
    {"name": "Size", "values": ["S", "M", "L", "XL"]},
    {"name": "Material", "values": ["Cotton", "Polyester"]}
  ],
  "variants": [
    {
      "id": "gid://shopify/ProductVariant/456",
      "sku": "SHIRT-RED-M-COTTON",
      "optionValues": [
        {"name": "Color", "value": "Red"},
        {"name": "Size", "value": "M"},
        {"name": "Material", "value": "Cotton"}
      ]
    }
  ]
}
`

### Produkt z jedn opcj (Default Title):
`json
{
  "id": "gid://shopify/Product/789",
  "options": [
    {"name": "Title", "values": ["Default Title"]}
  ],
  "variants": [
    {
      "id": "gid://shopify/ProductVariant/999",
      "sku": "SIMPLE-PRODUCT-001",
      "optionValues": [
        {"name": "Title", "value": "Default Title"}
      ]
    }
  ]
}
`

## 🔹 6. KLUCZOWE RÓNICE MIDZY BULK I STANDARDOWYM API

| Aspekt | Bulk Operations | Standardowe API |
|--------|----------------|-----------------|
| **Sposób wysyania** | Szablon mutacji jako string | Bezporednia mutacja |
| **Dane** | Plik JSONL (jedna linia = produkt) | Variables w JSON |
| **Przetwarzanie** | Asynchroniczne przez Shopify | Sync/Async w zalenoci od parametru |
| **Limity** | Brak limitów API | Standardowe limity API |
| **Monitoring** | Queries dla bulk operation | Bezporednia odpowied |
| **Uycie** | Due operacje (>100 produktów) | Mae/rednie operacje |

## 🔹 7. DEBUG LOGI

**W konsoli zobaczysz:**
`
[BULK DEBUG] Product gid://shopify/Product/123: {
  "id": "gid://shopify/Product/123",
  "options": [...],
  "variants": [...]
}

[API DEBUG] Product gid://shopify/Product/123 (Product Name): {
  "id": "gid://shopify/Product/123", 
  "options": [...],
  "variants": [...]
}
`

## 🔹 8. TYPOWE BDY I ROZWIZANIA

**Bd:** Product options input is required when updating variants
**Rozwizanie:** Dodaj pole options do input

**Bd:** Field is not defined on VariantOptionValueInput
**Rozwizanie:** Uyj 
ame i alue w optionValues

**Bd:** Every variant must have a non-null optionValues array
**Rozwizanie:** Kady wariant musi mie optionValues

**Bd:** Expected "Default Title" to be a key-value object
**Rozwizanie:** Uyj obiektów {name: "Title", value: "Default Title"} zamiast stringów

## 🔹 9. GOTOWE PRZYKŁADY DO SKOPIOWANIA

### 📋 Synchroniczna mutacja productSet (≤100 wariantów)

```graphql
mutation productSetSync($input: ProductSetInput!) {
  productSet(synchronous: true, input: $input) {
    product {
      id
      title
      variants(first: 250) {
        edges {
          node {
            id
            sku
            title
          }
        }
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
```

### 📋 Asynchroniczna mutacja productSet (>100 wariantów)

```graphql
mutation productSetAsync($input: ProductSetInput!) {
  productSet(synchronous: false, input: $input) {
    product {
      id
      title
      variants(first: 250) {
        edges {
          node {
            id
            sku
            title
          }
        }
      }
    }
    productSetOperation {
      id
      status
      userErrors {
        field
        message
        code
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
```

### 📋 Variables dla produktu z jedną opcją (Default Title)

```json
{
  "input": {
    "id": "gid://shopify/Product/1234567890",
    "options": [
      { "name": "Title", "values": ["Default Title"] }
    ],
    "variants": [
      {
        "id": "gid://shopify/ProductVariant/111",
        "sku": "SKU-NEW-001",
        "optionValues": [{ "name": "Title", "value": "Default Title" }]
      }
    ]
  }
}
```

### 📋 Variables dla produktu z wieloma opcjami

```json
{
  "input": {
    "id": "gid://shopify/Product/1234567890",
    "options": [
      { "name": "Color", "values": ["Red", "Blue"] },
      { "name": "Size", "values": ["S", "M", "L"] }
    ],
    "variants": [
      {
        "id": "gid://shopify/ProductVariant/111",
        "sku": "SKU-RED-S",
        "optionValues": [
          { "name": "Color", "value": "Red" },
          { "name": "Size", "value": "S" }
        ]
      },
      {
        "id": "gid://shopify/ProductVariant/112",
        "sku": "SKU-BLUE-M",
        "optionValues": [
          { "name": "Color", "value": "Blue" },
          { "name": "Size", "value": "M" }
        ]
      }
    ]
  }
}
```

### 📋 Sprawdzenie statusu operacji asynchronicznej

```graphql
query checkProductSetOperation($id: ID!) {
  node(id: $id) {
    ... on ProductSetOperation {
      id
      status
      userErrors {
        field
        message
        code
      }
    }
  }
}
```

**Variables:**
```json
{
  "id": "gid://shopify/ProductSetOperation/123456789"
}
```

### 🔑 Kluczowe punkty:

1. **Zawsze dołączaj tablicę `options`** opisującą wszystkie opcje produktu i ich możliwe wartości
2. **Każdy wariant musi mieć `optionValues`** pasujące do opcji produktu według nazwy i wartości
3. **Dla produktów z jedną opcją** użyj `"Title"` i `"Default Title"`
4. **Dla produktów z wieloma opcjami** podaj wszystkie pary nazwa/wartość opcji w poprawnej kolejności
5. **Po wysłaniu operacji asynchronicznej** sprawdzaj status `productSetOperation` aż do `COMPLETED`

### 🎯 Gotowe do użycia w Cursor AI lub dowolnym kliencie GraphQL!
