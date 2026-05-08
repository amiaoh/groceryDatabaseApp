import { useState, useEffect, createContext, useContext, createElement, type ReactNode } from "react"

type ColorMode = "light" | "dark"
type ColorModeContextType = { colorMode: ColorMode; toggleColorMode: () => void }

export const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: "light",
  toggleColorMode: () => {},
})

function getInitialColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem("color-mode")
    if (stored === "dark" || stored === "light") return stored
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode)

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode
    try { localStorage.setItem("color-mode", colorMode) } catch {}
  }, [colorMode])

  const toggleColorMode = () => setColorMode((prev) => (prev === "light" ? "dark" : "light"))

  return createElement(ColorModeContext.Provider, { value: { colorMode, toggleColorMode } }, children)
}

export function useColorMode(): ColorModeContextType {
  return useContext(ColorModeContext)
}
