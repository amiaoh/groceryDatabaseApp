import React from "react"
import ReactDOM from "react-dom/client"
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react"
import "./index.css"
import App from "./App"

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
      <App />
    </ChakraProvider>
  </React.StrictMode>
)
