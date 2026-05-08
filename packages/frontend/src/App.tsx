import { ReactElement, useState, useEffect, useCallback } from "react"
import {
  Box, Flex, Text, Button, VStack,
  Drawer, Separator,
} from "@chakra-ui/react"
import { authClient } from "./lib/auth-client"
import { useColorMode } from "./lib/color-mode"
import { ProductSearch } from "./pages/search/ProductSearch"
import { StoresPage } from "./pages/stores/StoresPage"
import type { UserDefaultStoreTarget, StoreLocationWithChain } from "@grocery/shared"
import { getDefaultStores, updateDefaultStore } from "./api/user-settings"
import { getStoreLocations } from "./api/store-locations"

type Page = "search" | "stores"

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function App(): ReactElement {
  const { data: session, isPending } = authClient.useSession()
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === "dark"

  const [page, setPage] = useState<Page>("search")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [defaultStores, setDefaultStores] = useState<UserDefaultStoreTarget[]>([])
  const [allLocations, setAllLocations] = useState<StoreLocationWithChain[]>([])
  const [editingChainId, setEditingChainId] = useState<string | null>(null)

  const headerBg = isDark ? "#111318" : "white"
  const headerBorder = isDark ? "#1e2030" : "#e2e8f0"
  const mainBg = isDark ? "#0d0f14" : "white"
  const drawerBg = isDark ? "#111318" : "white"
  const drawerEmailBg = isDark ? "#1e2030" : "#f8fafc"
  const drawerEmailBorder = isDark ? "#2d3148" : "#e2e8f0"
  const activeNavColor = isDark ? "#f1f5f9" : "#0f172a"
  const inactiveNavColor = isDark ? "#64748b" : "#6b7280"
  const settingsCardBorder = isDark ? "#2d3148" : "#e2e8f0"
  const settingsSelectBg = isDark ? "#1e2030" : "#fff"
  const settingsSelectColor = isDark ? "#f1f5f9" : "#0f172a"

  const loadSettings = useCallback(async () => {
    const [stores, locations] = await Promise.all([getDefaultStores(), getStoreLocations()])
    setDefaultStores(stores)
    setAllLocations(locations)
  }, [])

  useEffect(() => {
    if (session && settingsOpen) loadSettings()
  }, [session, settingsOpen, loadSettings])

  if (isPending) {
    return (
      <Flex justify="center" p={12} color="gray.400" bg={mainBg} minH="100vh">
        Loading...
      </Flex>
    )
  }

  if (!session) {
    return (
      <Flex direction="column" align="center" justify="center" minH="100vh" p={8} gap={3} bg={mainBg} position="relative">
        <Button
          variant="ghost"
          size="sm"
          position="absolute"
          top={4}
          right={4}
          onClick={toggleColorMode}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </Button>
        <Box
          w={16} h={16} borderRadius={16}
          bg={isDark ? "#0d2a10" : "#f0fdf4"}
          display="flex" alignItems="center" justifyContent="center"
          mb={2}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="21" r="1" fill="#16a34a"/>
            <circle cx="20" cy="21" r="1" fill="#16a34a"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
              stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Box>
        <Text fontSize="2xl" fontWeight="700" letterSpacing="-0.3px" color={isDark ? "#f1f5f9" : "#0f172a"}>Grocery Database</Text>
        <Text color={isDark ? "#94a3b8" : "gray.500"} textAlign="center" fontSize="15px">
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
      </Flex>
    )
  }

  return (
    <Box maxW="600px" mx="auto" minH="100vh" bg={mainBg}>
      {/* Header */}
      <Box
        position="sticky"
        top={0}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorder}
        zIndex={100}
      >
        <Flex justify="space-between" align="center" px={4} pt="12px">
          <Text fontSize="17px" fontWeight="700" letterSpacing="-0.2px" color={isDark ? "#f1f5f9" : "#0f172a"}>Grocery Database</Text>
          <Button
            variant="ghost"
            size="sm"
            px={2}
            color={isDark ? "#94a3b8" : "#475569"}
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
          >
            <SettingsIcon />
          </Button>
        </Flex>
        <Flex px={1}>
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
              borderColor={page === p ? activeNavColor : "transparent"}
              fontWeight={page === p ? 600 : 400}
              color={page === p ? activeNavColor : inactiveNavColor}
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
        </Flex>
      </Box>

      {/* Content */}
      <Box px={4} py={5}>
        {page === "search" && <ProductSearch />}
        {page === "stores" && <StoresPage />}
      </Box>

      {/* Settings drawer */}
      <Drawer.Root open={settingsOpen} onOpenChange={(e) => setSettingsOpen(e.open)} placement="end" size="sm">
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content bg={drawerBg}>
            <Drawer.Header>
              <Drawer.Title color={isDark ? "#f1f5f9" : "#0f172a"}>Settings</Drawer.Title>
              <Drawer.CloseTrigger asChild>
                <Button variant="ghost" size="sm" position="absolute" top={3} right={3} color={isDark ? "#94a3b8" : "#475569"}>×</Button>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body>
              <VStack align="stretch" gap={3}>
                <Flex
                  justify="space-between"
                  align="center"
                  p={3}
                  borderRadius="10px"
                  border="1px solid"
                  borderColor={settingsCardBorder}
                >
                  <Text fontSize="14px" fontWeight="500" color={isDark ? "#f1f5f9" : "#0f172a"}>Dark mode</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    color={isDark ? "#94a3b8" : "#475569"}
                    onClick={toggleColorMode}
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDark ? <SunIcon /> : <MoonIcon />}
                  </Button>
                </Flex>

                <Separator />

                <Box
                  padding="14px 16px"
                  bg={drawerEmailBg}
                  borderRadius="10px"
                  mb={3}
                  border="1px solid"
                  borderColor={drawerEmailBorder}
                >
                  <Text fontSize="11px" color="gray.400" textTransform="uppercase" letterSpacing="0.6px" mb={1} fontWeight="600">
                    Signed in as
                  </Text>
                  <Text fontSize="14px" fontWeight="500" wordBreak="break-all" color={isDark ? "#f1f5f9" : "#0f172a"}>
                    {session.user.email}
                  </Text>
                </Box>

                <Separator />

                <Box>
                  <Text fontSize="12px" color="gray.400" textTransform="uppercase" letterSpacing="0.6px" mb={3} fontWeight="600">
                    Default store locations
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {defaultStores.map((target) => {
                      const isNational = target.chain.isNational
                      const isEditing = editingChainId === target.chainId
                      const chainLocations = allLocations.filter((l) => l.chainId === target.chainId)

                      return (
                        <Box key={target.chainId} p={3} borderRadius="10px" border="1px solid" borderColor={settingsCardBorder}>
                          <Flex justify="space-between" align="center" mb={isEditing ? 2 : 0}>
                            <Box>
                              <Text fontSize="13px" fontWeight="600" color={isDark ? "#f1f5f9" : "#0f172a"}>{target.chain.name}</Text>
                              <Text fontSize="12px" color="gray.400" mt={0.5}>
                                {isNational
                                  ? "Prices apply nationally"
                                  : (target.storeLocation?.name ?? "No location set")}
                              </Text>
                            </Box>
                            {!isNational && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setEditingChainId(isEditing ? null : target.chainId)}
                              >
                                {isEditing ? "Cancel" : "Change"}
                              </Button>
                            )}
                          </Flex>

                          {isEditing && (
                            <select
                              style={{
                                width: "100%",
                                height: 36,
                                padding: "0 10px",
                                border: `1px solid ${settingsCardBorder}`,
                                borderRadius: 8,
                                fontSize: 14,
                                fontFamily: "inherit",
                                backgroundColor: settingsSelectBg,
                                color: settingsSelectColor,
                              }}
                              value={target.storeLocationId ?? ""}
                              onChange={async (e) => {
                                const val = e.target.value || null
                                const updated = await updateDefaultStore(target.chainId, val)
                                setDefaultStores(updated)
                                setEditingChainId(null)
                              }}
                            >
                              <option value="">— No preference —</option>
                              {chainLocations.map((loc) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                              ))}
                            </select>
                          )}
                        </Box>
                      )
                    })}
                  </VStack>
                </Box>

                <Separator />

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
