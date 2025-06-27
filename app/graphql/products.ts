export const GET_ALL_PRODUCTS = `#graphql
  query GetAllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        vendor
        productType
        media(first: 1) {
          nodes {
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
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

export const GET_SPECIFIC_PRODUCTS = `#graphql
  query GetSpecificProducts($query: String!, $first: Int!, $after: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        vendor
        productType
        media(first: 1) {
          nodes {
            ... on MediaImage {
              id
              image {
                url
                altText
              }
            }
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

export const UPDATE_PRODUCT_VARIANTS_SKU = `#graphql
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        variants(first: 50) {
          nodes {
            id
            sku
            title
          }
        }
      }
      userErrors {
        field 
        message
      }
    }
  }
`;

// Operacje masowe - zgodnie z najnowszą dokumentacją Shopify GraphQL
export const STAGED_UPLOADS_CREATE = `#graphql
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
`;

export const BULK_OPERATION_RUN_MUTATION = `#graphql
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_BULK_OPERATION = `#graphql
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
`;

export const GET_CURRENT_BULK_OPERATION = `#graphql
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
`;

// Mutacja productSet - synchroniczna (do 100 wariantów) - zgodna z API 2025-04
// UWAGA: ProductSetInput używa 'productOptions' (nie 'options') oraz
// VariantOptionValueInput używa 'name' i 'optionName' (nie 'name' i 'value')
export const UPDATE_PRODUCT_SET_SYNC = `#graphql
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
`;

// Mutacja productSet - asynchroniczna (do 2000 wariantów) - zgodna z API 2025-04  
// UWAGA: ProductSetInput używa 'productOptions' (nie 'options') oraz
// VariantOptionValueInput używa 'name' i 'optionName' (nie 'name' i 'value')
export const UPDATE_PRODUCT_SET_ASYNC = `#graphql
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
`;

// Mutacja dla operacji masowej - szablon synchroniczny dla produktów z mniej niż 100 wariantów
export const BULK_PRODUCT_SET_SYNC_TEMPLATE = `#graphql
  mutation call($input: ProductSetInput!) {
    productSet(synchronous: true, input: $input) {
      product {
        id
        title
        variants(first: 250) {
          edges {
            node {
              id
              sku
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutacja dla operacji masowej - szablon asynchroniczny dla produktów z więcej niż 100 wariantów
export const BULK_PRODUCT_SET_ASYNC_TEMPLATE = `#graphql
  mutation call($input: ProductSetInput!) {
    productSet(synchronous: false, input: $input) {
      product {
        id
        title
        variants(first: 250) {
          edges {
            node {
              id
              sku
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`; 