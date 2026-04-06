import { ReactElement, useEffect, useState } from "react"
import { Product, StoreChain, StoreLocationWithChain } from "@grocery/shared"
import { getStoreLocations, createStoreLocation } from "../../api/store-locations"
import { getStoreChains } from "../../api/store-chains"
import { getBrands, createPriceRecord } from "../../api/price-records"
import { SearchSelect } from "../../components/SearchSelect"

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

export function AddObservation(props: {
  product: Product
  onSuccess: () => void
  onCancel: () => void
}): ReactElement {
  const { product, onSuccess, onCancel } = props
  const [storeLocations, setStoreLocations] = useState<StoreLocationWithChain[]>([])
  const [chains, setChains] = useState<StoreChain[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [storeLocationId, setStoreLocationId] = useState("")
  const [brand, setBrand] = useState("")
  const [price, setPrice] = useState("")
  const [isSpecial, setIsSpecial] = useState(false)
  const [validUntil, setValidUntil] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateStore, setShowCreateStore] = useState(false)

  const reloadStores = async () => {
    const locs = await getStoreLocations()
    setStoreLocations(locs)
    return locs
  }

  useEffect(() => {
    reloadStores()
    getStoreChains().then(setChains)
    getBrands().then(setBrands)
  }, [])

  const handleStoreCreated = async (newLocation: StoreLocationWithChain) => {
    const locs = await reloadStores()
    const created = locs.find((l) => l.id === newLocation.id)
    if (created) setStoreLocationId(created.id)
    setShowCreateStore(false)
  }

  const handleSubmit = async () => {
    if (!storeLocationId) return setErrorMessage("Select a store")
    const parsedPrice = parseFloat(price)
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0)
      return setErrorMessage("Enter a valid price")

    setIsSubmitting(true)
    setErrorMessage("")
    try {
      await createPriceRecord({
        productId: product.id,
        storeLocationId,
        brand: brand.trim() || null,
        price: parsedPrice,
        isSpecial,
        validUntil: isSpecial && validUntil ? validUntil : null,
        source: "manual",
        productUrl: null,
      })
      onSuccess()
    } catch {
      setErrorMessage("Failed to save — please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  const storeOptions = storeLocations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} — ${loc.suburb}`,
  }))

  const brandOptions = brands.map((b) => ({ value: b, label: b }))

  return (
    <div>
      <h2>Add price for {product.name}</h2>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Store</label>
        {showCreateStore ? (
          <InlineCreateStore
            chains={chains}
            onSuccess={handleStoreCreated}
            onCancel={() => setShowCreateStore(false)}
          />
        ) : (
          <SearchSelect
            options={storeOptions}
            value={storeLocationId}
            onChange={setStoreLocationId}
            onCreateNew={() => setShowCreateStore(true)}
            createNewLabel={() => "+ Create new store"}
            placeholder="Search for a store..."
          />
        )}
      </div>

      {!showCreateStore && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Brand (optional)</label>
            <SearchSelect
              options={brandOptions}
              value={brand}
              onChange={setBrand}
              onCreateNew={(input) => {
                setBrand(input)
                if (!brands.includes(input)) setBrands([...brands, input].sort())
              }}
              createNewLabel={(input) => `+ Add "${input}" as new brand`}
              placeholder="Search or type a brand..."
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Price per {product.unitType} ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ padding: "8px", width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                style={{ marginRight: "8px" }}
              />
              This is a special / on sale
            </label>
          </div>

          {isSpecial && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Special valid until (optional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                style={{ padding: "8px" }}
              />
            </div>
          )}

          {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onCancel} disabled={isSubmitting}>Cancel</button>
            <button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function InlineCreateStore(props: {
  chains: StoreChain[]
  onSuccess: (location: StoreLocationWithChain) => void
  onCancel: () => void
}): ReactElement {
  const { chains, onSuccess, onCancel } = props
  const [name, setName] = useState("")
  const [chainId, setChainId] = useState("")
  const [suburb, setSuburb] = useState("")
  const [state, setState] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Name cannot be empty")
    if (!suburb.trim()) return setErrorMessage("Suburb cannot be empty")

    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const location = await createStoreLocation({
        name: name.trim(),
        chainId: chainId || null,
        suburb: suburb.trim(),
        state: state || null,
        address: null,
      })
      onSuccess(location)
    } catch {
      setErrorMessage("Failed to create store — it may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: "12px", border: "1px solid #ddd", borderRadius: "4px", backgroundColor: "#f9fafb" }}>
      <div style={{ fontWeight: "bold", marginBottom: "10px" }}>New store</div>

      <div style={{ marginBottom: "8px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coles Richmond Traders"
          style={{ width: "100%", padding: "6px" }}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: "8px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Chain (optional)</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(e.target.value)}
          style={{ width: "100%", padding: "6px" }}
        >
          <option value="">Independent store</option>
          {chains.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Suburb</label>
          <input
            type="text"
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            placeholder="e.g. Richmond"
            style={{ width: "100%", padding: "6px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={{ padding: "6px" }}>
            <option value="">—</option>
            {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {errorMessage && <p style={{ color: "#ef4444", fontSize: "14px" }}>{errorMessage}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create store"}
        </button>
      </div>
    </div>
  )
}
