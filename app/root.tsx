import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export function meta() {
  return [
    { title: "DC SKU Generator - Automate SKU Code Generation" },
    { name: "description", content: "Professional tool for automatically generating SKU codes for Shopify products. Save time and maintain consistent naming across your store." },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
    { name: "robots", content: "noindex, nofollow" }, // For Shopify apps
    { name: "theme-color", content: "#00848e" }, // Shopify brand color
    { name: "application-name", content: "DC SKU Generator" },
    { name: "apple-mobile-web-app-capable", content: "yes" },
    { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    { name: "apple-mobile-web-app-title", content: "DC SKU Generator" },
    { "http-equiv": "X-UA-Compatible", content: "IE=edge" }
  ];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
