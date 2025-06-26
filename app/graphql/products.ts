export const GET_ALL_PRODUCTS = `#graphql
  query GetAllProducts {
    products(first: 10) {
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
  query GetSpecificProducts($query: String!) {
    products(first: 10, query: $query) {
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