import { ReactElement, useEffect, useState } from "react"
import { StoreChain, StoreLocationWithChain, CreateStoreLocation, CreateStoreChain } from "@grocery/shared"
import {
  getStoreLocations,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
} from "../../api/store-locations"
import { getStoreChains, createStoreChain, updateStoreChain } from "../../api/store-chains"

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

type Tab = "locations" | "chains"
type LocationFormMode = { type: "create" } | { type: "edit"; location: StoreLocationWithChain }
type ChainFormMode = { type: "create" } | { type: "edit"; chain: StoreChain }

export function StoresPage(): ReactElement {
  const [tab, setTab] = useState<Tab>("locations")
  const [locations, setLocations] = useState<StoreLocationWithChain[]>([])
  const [chains, setChains] = useState<StoreChain[]>([])
  const [locationForm, setLocationForm] = useState<LocationFormMode | null>(null)
  const [chainForm, setChainForm] = useState<ChainFormMode | null>(null)

  const reload = async () => {
    const [locs, chs] = await Promise.all([getStoreLocations(), getStoreChains()])
    setLocations(locs)
    setChains(chs)
  }

  useEffect(() => { reload() }, [])

  return (
    <div>
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", borderBottom: "1px solid #ddd" }}>
        {(["locations", "chains"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setLocationForm(null); setChainForm(null) }}
            style={{
              padding: "8px 0",
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid #111" : "2px solid transparent",
              fontWeight: tab === t ? "bold" : "normal",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "locations" && (
        <div>
          {locationForm ? (
            <LocationForm
              mode={locationForm}
              chains={chains}
              onSuccess={() => { reload(); setLocationForm(null) }}
              onCancel={() => setLocationForm(null)}
            />
          ) : (
            <>
              <button
                onClick={() => setLocationForm({ type: "create" })}
                style={{ marginBottom: "12px" }}
              >
                + Add store
              </button>
              <LocationList
                locations={locations}
                onEdit={(loc) => setLocationForm({ type: "edit", location: loc })}
                onDelete={async (id) => {
                  try {
                    await deleteStoreLocation(id)
                    reload()
                  } catch {
                    alert("Cannot delete — this store has price records attached to it.")
                  }
                }}
              />
            </>
          )}
        </div>
      )}

      {tab === "chains" && (
        <div>
          {chainForm ? (
            <ChainForm
              mode={chainForm}
              onSuccess={() => { reload(); setChainForm(null) }}
              onCancel={() => setChainForm(null)}
            />
          ) : (
            <>
              <button
                onClick={() => setChainForm({ type: "create" })}
                style={{ marginBottom: "12px" }}
              >
                + Add chain
              </button>
              <ChainList
                chains={chains}
                onEdit={(chain) => setChainForm({ type: "edit", chain })}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function LocationList(props: {
  locations: StoreLocationWithChain[]
  onEdit: (loc: StoreLocationWithChain) => void
  onDelete: (id: string) => void
}): ReactElement {
  const { locations, onEdit, onDelete } = props

  if (locations.length === 0) return <p>No stores yet.</p>

  return (
    <div>
      {locations.map((loc) => (
        <div
          key={loc.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            marginBottom: "6px",
            border: "1px solid #eee",
            borderRadius: "4px",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold" }}>{loc.name}</div>
            <div style={{ color: "#666", fontSize: "13px" }}>
              {[loc.suburb, loc.state].filter(Boolean).join(", ")}
              {loc.chain && ` · ${loc.chain.name}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => onEdit(loc)}>Edit</button>
            <button
              onClick={() => {
                if (confirm(`Delete ${loc.name}?`)) onDelete(loc.id)
              }}
              style={{ color: "#ef4444" }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function LocationForm(props: {
  mode: LocationFormMode
  chains: StoreChain[]
  onSuccess: () => void
  onCancel: () => void
}): ReactElement {
  const { mode, chains, onSuccess, onCancel } = props
  const existing = mode.type === "edit" ? mode.location : null

  const [name, setName] = useState(existing?.name ?? "")
  const [chainId, setChainId] = useState(existing?.chainId ?? "")
  const [suburb, setSuburb] = useState(existing?.suburb ?? "")
  const [state, setState] = useState(existing?.state ?? "")
  const [address, setAddress] = useState(existing?.address ?? "")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Name cannot be empty")
    if (!suburb.trim()) return setErrorMessage("Suburb cannot be empty")

    const payload: CreateStoreLocation = {
      name: name.trim(),
      chainId: chainId || null,
      suburb: suburb.trim(),
      state: state || null,
      address: address.trim() || null,
    }

    setIsSubmitting(true)
    setErrorMessage("")
    try {
      if (mode.type === "create") {
        await createStoreLocation(payload)
      } else {
        await updateStoreLocation(mode.location.id, payload)
      }
      onSuccess()
    } catch {
      setErrorMessage("Failed to save — the store name may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3>{mode.type === "create" ? "Add store" : "Edit store"}</h3>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Coles Richmond Traders"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Chain (optional)</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="">Independent store</option>
          {chains.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Suburb</label>
        <input
          type="text"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          placeholder="e.g. Richmond"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>State (optional)</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          style={{ padding: "8px" }}
        >
          <option value="">—</option>
          {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Address (optional)</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 123 Bridge Rd"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode.type === "create" ? "Add store" : "Save changes"}
        </button>
      </div>
    </div>
  )
}

function ChainList(props: {
  chains: StoreChain[]
  onEdit: (chain: StoreChain) => void
}): ReactElement {
  const { chains, onEdit } = props

  if (chains.length === 0) return <p>No chains yet.</p>

  return (
    <div>
      {chains.map((chain) => (
        <div
          key={chain.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 12px",
            marginBottom: "6px",
            border: "1px solid #eee",
            borderRadius: "4px",
          }}
        >
          <div>
            <div style={{ fontWeight: "bold" }}>{chain.name}</div>
            {chain.websiteUrl && (
              <div style={{ color: "#666", fontSize: "13px" }}>{chain.websiteUrl}</div>
            )}
          </div>
          <button onClick={() => onEdit(chain)}>Edit</button>
        </div>
      ))}
    </div>
  )
}

function ChainForm(props: {
  mode: ChainFormMode
  onSuccess: () => void
  onCancel: () => void
}): ReactElement {
  const { mode, onSuccess, onCancel } = props
  const existing = mode.type === "edit" ? mode.chain : null

  const [name, setName] = useState(existing?.name ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(existing?.websiteUrl ?? "")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Name cannot be empty")

    const payload: CreateStoreChain = {
      name: name.trim(),
      websiteUrl: websiteUrl.trim() || null,
    }

    setIsSubmitting(true)
    setErrorMessage("")
    try {
      if (mode.type === "create") {
        await createStoreChain(payload)
      } else {
        await updateStoreChain(mode.chain.id, payload)
      }
      onSuccess()
    } catch {
      setErrorMessage("Failed to save — the chain name may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3>{mode.type === "create" ? "Add chain" : "Edit chain"}</h3>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Woolworths"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", marginBottom: "4px" }}>Website URL (optional)</label>
        <input
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://www.woolworths.com.au"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      {errorMessage && <p style={{ color: "#ef4444" }}>{errorMessage}</p>}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onCancel} disabled={isSubmitting}>Cancel</button>
        <button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode.type === "create" ? "Add chain" : "Save changes"}
        </button>
      </div>
    </div>
  )
}
