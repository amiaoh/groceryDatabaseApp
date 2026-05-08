import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react"
import { ColorModeProvider } from "./lib/color-mode"
import "./index.css"
import App from "./App"

// Apply stored color mode before first render to avoid flash
try {
  const stored = localStorage.getItem("color-mode")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  document.documentElement.dataset.theme = stored ?? (prefersDark ? "dark" : "light")
} catch {}

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
        body: { value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <App />
      </ColorModeProvider>
    </ChakraProvider>
  </React.StrictMode>
)
