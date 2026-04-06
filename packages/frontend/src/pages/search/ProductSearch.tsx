import { ReactElement, useEffect, useState } from "react"
import { Category, categorySchema, Product, UNITS_WITH_PACKAGE_DETAIL, UnitType, unitTypeSchema } from "@grocery/shared"
import { searchProducts, createProduct } from "../../api/products"
import { getCheapestStores } from "../../api/price-records"
import { CheapestStore } from "@grocery/shared"
import { CheapestStores } from "./CheapestStores"
import { AddObservation } from "./AddObservation"

type View = "search" | "results" | "add-observation" | "create-product"

export function ProductSearch(): ReactElement {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cheapestStores, setCheapestStores] = useState<CheapestStore[]>([])
  const [view, setView] = useState<View>("search")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchProducts(query)
        setSearchResults(results)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product)
    setView("results")
    setIsLoadingPrices(true)
    try {
      const stores = await getCheapestStores(product.id)
      setCheapestStores(stores)
    } finally {
      setIsLoadingPrices(false)
    }
  }

  const handleObservationSuccess = async () => {
    if (!selectedProduct) return
    setView("results")
    setIsLoadingPrices(true)
    try {
      const stores = await getCheapestStores(selectedProduct.id)
      setCheapestStores(stores)
    } finally {
      setIsLoadingPrices(false)
    }
  }

  if (view === "add-observation" && selectedProduct) {
    return (
      <AddObservation
        product={selectedProduct}
        onSuccess={handleObservationSuccess}
        onCancel={() => setView("results")}
      />
    )
  }

  if (view === "create-product") {
    return (
      <CreateProduct
        initialName={query}
        onSuccess={(product) => handleSelectProduct(product)}
        onCancel={() => setView("search")}
      />
    )
  }

  if (view === "results" && selectedProduct) {
    return (
      <div>
        <button onClick={() => setView("search")} style={{ marginBottom: "16px" }}>
          ← Back to search
        </button>
        {isLoadingPrices ? (
          <p>Loading prices...</p>
        ) : (
          <CheapestStores
            product={selectedProduct}
            stores={cheapestStores}
            onAddObservation={() => setView("add-observation")}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a product (e.g. chicken thigh)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", padding: "12px", fontSize: "16px", boxSizing: "border-box" }}
        autoFocus
      />

      {isSearching && <p>Searching...</p>}

      {!isSearching && query.length >= 2 && (
        <div>
          {searchResults.map((product) => (
            <div
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{product.name}</span>
              <span style={{ color: "#666" }}>per {product.unitType}</span>
            </div>
          ))}

          <div
            onClick={() => setView("create-product")}
            style={{
              padding: "12px",
              cursor: "pointer",
              color: "#2563eb",
            }}
          >
            + Add "{query}" as a new product
          </div>
        </div>
      )}
    </div>
  )
}

function CreateProduct(props: {
  initialName: string
  onSuccess: (product: Product) => void
  onCancel: () => void
}): ReactElement {
  const { initialName, onSuccess, onCancel } = props
  const [name, setName] = useState(initialName)
  const [unitType, setUnitType] = useState<UnitType>("kg")
  const [packageDetail, setPackageDetail] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showPackageDetail = UNITS_WITH_PACKAGE_DETAIL.has(unitType)

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Product name cannot be empty")
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const product = await createProduct({
        name: name.trim(),
        unitType,
        category: category !== "" ? category : null,
        packageDetail: showPackageDetail && packageDetail.trim() ? packageDetail.trim() : null,
      })
      onSuccess(product)
    } catch {
      setErrorMessage("Failed to create product — it may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2>Add new product</h2>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Unit type</label>
        <select
          value={unitType}
          onChange={(e) => {
            setUnitType(e.target.value as UnitType)
            setPackageDetail("")
          }}
          style={{ padding: "8px" }}
        >
          {unitTypeSchema.options.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {showPackageDetail && (
        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px" }}>
            Package size (optional, e.g. 400g, 375mL, 1.25L)
          </label>
          <input
            type="text"
            placeholder="e.g. 400g"
            value={packageDetail}
            onChange={(e) => setPackageDetail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          style={{ padding: "8px", width: "100%" }}
        >
          <option value="">Select a category...</option>
          {categorySchema.options.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  )
}
