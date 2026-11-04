# Lesson 1: From browser to dashboard

## Goal

Understand the first path that runs before you see any dashboard.

## In easy words

A React app starts as a normal HTML page. The page gives React one empty element. React fills that element with components. The router then looks at the URL and chooses the page.

The first path in this project is:

~~~text
HTML root
  -> React root
  -> BrowserRouter
  -> App
  -> Route
  -> Login or FiruappDashboard
~~~

## Small example

~~~jsx
import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return <h1>Hello FiruApp</h1>;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);
~~~

The browser finds root. React renders App. App returns an h1.

## The FiruApp version

Open:

- public/index.html
- src/index.js
- src/App.js

The important pieces are:

~~~jsx
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
~~~

and:

~~~jsx
<Route path="/owner-dashboard" element={<FiruappDashboard />} />
~~~

The login code then stores a token and sends the browser to owner-dashboard.

## Key concepts

- **Mount point:** the HTML element where React starts.
- **Component:** a function that returns UI.
- **Router:** a URL-to-page decision maker.
- **Route:** one rule inside the router.
- **Redirect:** a route that sends the user to another URL.
- **Single-page app:** the browser keeps one page loaded while React changes the visible component.

## Practice

1. Draw the file path from public/index.html to FiruappDashboard.
2. Temporarily change the root route to send users to register instead of login.
3. Add a new route named /hello that renders a small component.
4. Explain why BrowserRouter is placed above App.
5. Explain what happens when the user types a URL that is not declared.

## Mini challenge

Write this in your own words:

> The browser does not know FiruappDashboard. React imports it, App connects it to a route, and the router renders it only when the URL matches.

## Check your work

You are ready when you can answer:

- Where does React mount?
- Which file renders App?
- Which route renders the dashboard?
- What happens at the catch-all route?

