import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import "./index.css"; // optional, your global styles
import "leaflet/dist/leaflet.css";
import "./App.css"; // optional, your global styles
import "./mobile.css";
const theme = createTheme({
  palette: { primary: { main: '#079b80' }, text: { primary: '#102640', secondary: '#81909e' } },
  typography: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', button: { textTransform: 'none', fontWeight: 650 } },
  components: { MuiButton: { styleOverrides: { root: { borderRadius: 12 } } } },
});
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider theme={theme}><BrowserRouter>
    <App />
  </BrowserRouter></ThemeProvider>
);