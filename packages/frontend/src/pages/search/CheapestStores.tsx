import { ReactElement } from "react"
import { CheapestStore, Product } from "@grocery/shared"
import { timeAgo, isStale } from "../../lib/time"

export function CheapestStores(props: {
  product: Product
  stores: CheapestStore[]
  onAddObservation: () => void
}): ReactElement {
  const { product, stores, onAddObservation } = props

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h2 style={{ margin: 0 }}>{product.name}</h2>
          {product.category && (
            <span style={{ color: "#666", fontSize: "14px" }}>{product.category}</span>
          )}
        </div>
        <button onClick={onAddObservation}>+ Add price</button>
      </div>

      {stores.length === 0 ? (
        <p>No prices recorded yet. Add one!</p>
      ) : (
        stores.map((entry, index) => (
          <div
            key={`${entry.storeLocation.id}:${entry.brand ?? ""}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: index === 0 ? "#f0fdf4" : "#fff",
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>{entry.storeLocation.name}</div>
              {entry.brand && (
                <div style={{ fontSize: "14px" }}>{entry.brand}</div>
              )}
              <div style={{ color: isStale(entry.recordedAt) ? "#f59e0b" : "#666", fontSize: "13px" }}>
                {isStale(entry.recordedAt) ? "⚠ " : ""}{timeAgo(entry.recordedAt)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: "bold", fontSize: "20px" }}>
                ${entry.price.toFixed(2)}/
                {product.packageDetail
                  ? `${product.packageDetail} ${product.unitType}`
                  : product.unitType}
              </div>
              {entry.isSpecial && (
                <span style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}>
                  SPECIAL
                </span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
