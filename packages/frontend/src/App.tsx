import { ReactElement } from "react"
import { authClient } from "./lib/auth-client"

function App(): ReactElement {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div>Loading...</div>
  }

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
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px" }}>
        <h1>Grocery Database</h1>
        <div>
          <span style={{ marginRight: "8px" }}>{session.user.email}</span>
          <button onClick={() => authClient.signOut()}>Sign out</button>
        </div>
      </div>
      <p>UI coming soon</p>
    </div>
  )
}

export default App
