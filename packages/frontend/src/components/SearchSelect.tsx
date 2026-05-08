import { ReactElement, useEffect, useRef, useState } from "react"
import { useColorMode } from "../lib/color-mode"

export type SearchSelectOption = { value: string; label: string }

type Props = {
  options: SearchSelectOption[]
  value: string
  onChange: (value: string) => void
  onCreateNew?: (inputValue: string) => void
  createNewLabel?: (inputValue: string) => string
  placeholder?: string
  disabled?: boolean
}

export function SearchSelect({
  options,
  value,
  onChange,
  onCreateNew,
  createNewLabel,
  placeholder = "Search...",
  disabled = false,
}: Props): ReactElement {
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)
  // Fall back to value itself so free-text values (e.g. brand strings) display correctly
  const displayLabel = selectedOption?.label ?? value

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const showCreateOption =
    !!onCreateNew &&
    inputValue.trim().length > 0 &&
    !options.some((o) => o.label.toLowerCase() === inputValue.trim().toLowerCase())

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setInputValue("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpen = () => {
    if (!disabled) setIsOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setInputValue("")
  }

  const handleCreate = () => {
    if (onCreateNew) {
      onCreateNew(inputValue.trim())
      setIsOpen(false)
      setInputValue("")
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setInputValue("")
  }

  const border = `1px solid ${isDark ? "#2d3148" : "#ccc"}`
  const bg = isDark ? "#1e2030" : "#fff"
  const disabledBg = isDark ? "#13151f" : "#f3f4f6"
  const textColor = isDark ? "#f1f5f9" : "#111"
  const mutedColor = isDark ? "#64748b" : "#999"
  const hoverBg = isDark ? "#1a1d2e" : "#f3f4f6"
  const dropdownBg = isDark ? "#1e2030" : "#fff"
  const dropdownBorder = `1px solid ${isDark ? "#2d3148" : "#ccc"}`
  const dividerColor = isDark ? "#2d3148" : "#eee"

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        onClick={handleOpen}
        style={{
          display: "flex",
          border,
          borderRadius: "4px",
          overflow: "hidden",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: disabled ? disabledBg : bg,
        }}
      >
        {isOpen ? (
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            style={{ flex: 1, padding: "8px", border: "none", outline: "none", background: "transparent", color: textColor }}
          />
        ) : (
          <div style={{ flex: 1, padding: "8px", color: value ? textColor : mutedColor, userSelect: "none" }}>
            {value ? displayLabel : placeholder}
          </div>
        )}
        {value && !disabled && (
          <button
            onClick={handleClear}
            style={{ padding: "0 10px", border: "none", background: "none", cursor: "pointer", color: mutedColor, fontSize: "16px" }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          border: dropdownBorder,
          borderTop: "none",
          backgroundColor: dropdownBg,
          zIndex: 10,
          maxHeight: "200px",
          overflowY: "auto",
          borderRadius: "0 0 4px 4px",
          boxShadow: isDark ? "0 4px 6px rgba(0,0,0,0.3)" : "0 4px 6px rgba(0,0,0,0.07)",
        }}>
          {filtered.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{ padding: "8px 12px", cursor: "pointer", color: textColor }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {option.label}
            </div>
          ))}

          {filtered.length === 0 && !showCreateOption && (
            <div style={{ padding: "8px 12px", color: mutedColor }}>No matches</div>
          )}

          {showCreateOption && (
            <div
              onClick={handleCreate}
              style={{ padding: "8px 12px", cursor: "pointer", color: isDark ? "#60a5fa" : "#2563eb", borderTop: filtered.length > 0 ? `1px solid ${dividerColor}` : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? "#1a2a3a" : "#eff6ff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {createNewLabel ? createNewLabel(inputValue.trim()) : `+ Create "${inputValue.trim()}"`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
