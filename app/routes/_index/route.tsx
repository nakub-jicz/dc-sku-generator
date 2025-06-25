import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>DC SKU Generator</h1>
        <p className={styles.text}>
          Automate SKU code generation for Shopify products.
          Save time and maintain consistent naming across your entire store.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Automatic SKU code generation</strong>. Create consistent
            and unique SKU codes for all product variants without manual
            work on each product.
          </li>
          <li>
            <strong>Configurable naming rules</strong>. Set custom
            prefixes, suffixes, and numbering methods to match
            your product organization strategy.
          </li>
          <li>
            <strong>Real-time preview</strong>. See how generated
            SKU codes will look before applying them to your store,
            eliminating the risk of errors.
          </li>
          <li>
            <strong>Multiple format support</strong>. Choose between
            sequential or random numbering, customize separators, and add
            components describing product attributes.
          </li>
          <li>
            <strong>Built for Shopify 2025</strong>. Optimized for performance
            with the latest Polaris design system and following UX best practices
            for seamless integration with Shopify Admin.
          </li>
        </ul>
      </div>
    </div>
  );
}
