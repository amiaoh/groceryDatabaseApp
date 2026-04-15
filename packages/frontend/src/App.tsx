import { ReactElement, useState } from "react"
import {
  Box, Flex, Text, Button, VStack,
  Drawer,
} from "@chakra-ui/react"
import { authClient } from "./lib/auth-client"
import { ProductSearch } from "./pages/search/ProductSearch"
import { StoresPage } from "./pages/stores/StoresPage"

type Page = "search" | "stores"

const styles = {
  appShell: { maxWidth: "600px", margin: "0 auto", minHeight: "100vh" },
  header: { position: "sticky" as const, top: 0, backgroundColor: "white", borderBottom: "1px solid", borderColor: "gray.200", zIndex: 100 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px 0" },
  nav: { display: "flex", padding: "0 4px" },
  main: { padding: "20px 16px" },
  signInPage: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "32px 24px", gap: "12px" },
  logoBox: { width: 64, height: 64, borderRadius: 16, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  drawerEmailBox: { padding: "14px 16px", backgroundColor: "gray.50", borderRadius: "10px", marginBottom: 12, border: "1px solid", borderColor: "gray.200" },
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function App(): ReactElement {
  const { data: session, isPending } = authClient.useSession()
  const [page, setPage] = useState<Page>("search")
  const [settingsOpen, setSettingsOpen] = useState(false)

  if (isPending) {
    return (
      <Flex justify="center" p={12} color="gray.400">
        Loading...
      </Flex>
    )
  }

  if (!session) {
    return (
      <Box style={styles.signInPage}>
        <Box style={styles.logoBox}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="21" r="1" fill="#16a34a"/>
            <circle cx="20" cy="21" r="1" fill="#16a34a"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
              stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        <Text fontSize="2xl" fontWeight="700" letterSpacing="-0.3px">Grocery Database</Text>
        <Text color="gray.500" textAlign="center" fontSize="15px">
          Track and compare grocery prices across stores
        </Text>
        <Button
          colorPalette="green"
          size="lg"
          mt={3}
          px={8}
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: window.location.origin })}
        >
          Sign in with Google
        </Button>
      </Box>
    )
  }

  return (
    <Box style={styles.appShell}>
      {/* Header */}
      <Box style={styles.header}>
        <Box style={styles.headerRow}>
          <Text fontSize="17px" fontWeight="700" letterSpacing="-0.2px">Grocery Database</Text>
          <Button variant="ghost" size="sm" px={2} onClick={() => setSettingsOpen(true)} aria-label="Open settings">
            <SettingsIcon />
          </Button>
        </Box>
        <Box style={styles.nav}>
          {(["search", "stores"] as Page[]).map((p) => (
            <Box
              key={p}
              as="button"
              flex={1}
              py="10px"
              px={2}
              bg="transparent"
              border="none"
              borderBottom={page === p ? "2px solid" : "2px solid transparent"}
              borderColor={page === p ? "gray.900" : "transparent"}
              fontWeight={page === p ? 600 : 400}
              color={page === p ? "gray.900" : "gray.500"}
              cursor="pointer"
              textTransform="capitalize"
              fontSize="15px"
              fontFamily="body"
              onClick={() => setPage(p)}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {p}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Content */}
      <Box style={styles.main}>
        {page === "search" && <ProductSearch />}
        {page === "stores" && <StoresPage />}
      </Box>

      {/* Settings drawer */}
      <Drawer.Root open={settingsOpen} onOpenChange={(e) => setSettingsOpen(e.open)} placement="end" size="sm">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Settings</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3}>×</Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="stretch" gap={3}>
                <Box style={styles.drawerEmailBox}>
                  <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing="0.6px" mb={1} fontWeight="600">
                    Signed in as
                  </Text>
                  <Text fontSize="14px" fontWeight="500" wordBreak="break-all">
                    {session.user.email}
                  </Text>
                </Box>
                <Button
                  colorPalette="red"
                  variant="outline"
                  justifyContent="flex-start"
                  onClick={() => authClient.signOut()}
                >
                  Sign out
                </Button>
              </VStack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </Box>
  )
}

export default App
