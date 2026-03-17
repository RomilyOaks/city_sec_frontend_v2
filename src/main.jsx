import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import ThemeApplier from "./components/common/ThemeApplier.jsx";
import "./index.css";
import App from "./App.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Log build-time env only when debug is enabled to verify production variables
if (
  import.meta.env.VITE_DEBUG === "true" ||
  import.meta.env.VITE_DEBUG === true
) {
   
  console.log("import.meta.env:", import.meta.env);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeApplier />
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              marginTop: "72px",
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
