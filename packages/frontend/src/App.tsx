import { ReactElement, useState } from "react"
import { authClient } from "./lib/auth-client"
import { ProductSearch } from "./pages/search/ProductSearch"
import { StoresPage } from "./pages/stores/StoresPage"

type Page = "search" | "stores"

function App(): ReactElement {
  const { data: session, isPending } = authClient.useSession()
  const [page, setPage] = useState<Page>("search")

  if (isPending) return <div>Loading...</div>

  if (!session) {
    return (
      <div>
        <h1>Grocery Database</h1>
        <button
          onClick={() =>
            authClient.signIn.social({
              provider: "google",
              callbackURL: window.location.origin,
            })
          }
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <h1 style={{ margin: 0, fontSize: "18px" }}>Grocery Database</h1>
          {(["search", "stores"] as Page[]).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                background: "none",
                border: "none",
                borderBottom: page === p ? "2px solid #111" : "2px solid transparent",
                padding: "4px 0",
                fontWeight: page === p ? "bold" : "normal",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>{session.user.email}</span>
          <button onClick={() => authClient.signOut()}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        {page === "search" && <ProductSearch />}
        {page === "stores" && <StoresPage />}
      </div>
    </div>
  )
}

export default App
