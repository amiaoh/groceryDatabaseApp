import { ReactElement, useEffect, useState } from "react"
import {
  Box, Flex, Text, Button, Input, Field,
  Card, Skeleton, VStack, Tabs, EmptyState,
} from "@chakra-ui/react"
import { StoreChain, StoreLocationWithChain, CreateStoreLocation, CreateStoreChain } from "@grocery/shared"
import { useColorMode } from "../../lib/color-mode"
import {
  getStoreLocations, createStoreLocation, updateStoreLocation, deleteStoreLocation,
} from "../../api/store-locations"
import { getStoreChains, createStoreChain, updateStoreChain } from "../../api/store-chains"

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

type Tab = "locations" | "chains"
type LocationFormMode = { type: "create" } | { type: "edit"; location: StoreLocationWithChain }
type ChainFormMode = { type: "create" } | { type: "edit"; chain: StoreChain }

const styles = {
  listCard: { padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 } as React.CSSProperties,
}

export function StoresPage(): ReactElement {
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const [tab, setTab] = useState<Tab>("locations")
  const [locations, setLocations] = useState<StoreLocationWithChain[]>([])
  const [chains, setChains] = useState<StoreChain[]>([])
  const [locationForm, setLocationForm] = useState<LocationFormMode | null>(null)
  const [chainForm, setChainForm] = useState<ChainFormMode | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = async () => {
    const [locs, chs] = await Promise.all([getStoreLocations(), getStoreChains()])
    setLocations(locs)
    setChains(chs)
  }

  useEffect(() => { reload().finally(() => setIsLoading(false)) }, [])

  if (isLoading) {
    return (
      <VStack gap={2.5}>
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} height="64px" borderRadius="14px" w="full" />)}
      </VStack>
    )
  }

  return (
    <Box>
      <Tabs.Root value={tab} onValueChange={(e) => { setTab(e.value as Tab); setLocationForm(null); setChainForm(null) }}>
        <Tabs.List mb={5}>
          <Tabs.Trigger value="locations" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Locations</Tabs.Trigger>
          <Tabs.Trigger value="chains" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>Chains</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="locations">
          {locationForm ? (
            <LocationForm mode={locationForm} chains={chains} onSuccess={() => { reload(); setLocationForm(null) }} onCancel={() => setLocationForm(null)} />
          ) : (
            <>
              <Button colorPalette="green" w="full" mb={4} onClick={() => setLocationForm({ type: "create" })}>
                + Add store
              </Button>
              <LocationList
                locations={locations}
                onEdit={(loc) => setLocationForm({ type: "edit", location: loc })}
                onDelete={async (id) => {
                  try { await deleteStoreLocation(id); reload() }
                  catch { alert("Cannot delete — this store has price records attached to it.") }
                }}
              />
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="chains">
          {chainForm ? (
            <ChainForm mode={chainForm} onSuccess={() => { reload(); setChainForm(null) }} onCancel={() => setChainForm(null)} />
          ) : (
            <>
              <Button colorPalette="green" w="full" mb={4} onClick={() => setChainForm({ type: "create" })}>
                + Add chain
              </Button>
              <ChainList chains={chains} onEdit={(chain) => setChainForm({ type: "edit", chain })} />
            </>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}

function LocationList(props: {
  locations: StoreLocationWithChain[]
  onEdit: (loc: StoreLocationWithChain) => void
  onDelete: (id: string) => void
}): ReactElement {
  const { locations, onEdit, onDelete } = props

  if (locations.length === 0) {
    return (
      <EmptyState.Root border="1.5px dashed" borderColor="gray.200" borderRadius="14px" py={10}>
        <EmptyState.Content>
          <EmptyState.Indicator fontSize="32px">🏪</EmptyState.Indicator>
          <VStack gap={1}>
            <EmptyState.Title>No stores yet</EmptyState.Title>
            <EmptyState.Description>Add your first store above</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <VStack gap={2} align="stretch">
      {locations.map((loc) => (
        <Card.Root key={loc.id} style={styles.listCard}>
          <Box flex={1} minWidth={0}>
            <Text fontWeight="600" fontSize="15px">{loc.name}</Text>
            <Text color="gray.500" fontSize="13px" mt={0.5}>
              {[loc.suburb, loc.state].filter(Boolean).join(", ")}
              {loc.chain && <Text as="span" color="gray.400"> · {loc.chain.name}</Text>}
            </Text>
          </Box>
          <Flex gap={1.5} flexShrink={0}>
            <Button size="sm" variant="outline" onClick={() => onEdit(loc)}>Edit</Button>
            <Button
              size="sm"
              variant="ghost"
              color="red.500"
              onClick={() => { if (confirm(`Delete ${loc.name}?`)) onDelete(loc.id) }}
            >
              Delete
            </Button>
          </Flex>
        </Card.Root>
      ))}
    </VStack>
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
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"

  const [name, setName] = useState(existing?.name ?? "")
  const [chainId, setChainId] = useState(existing?.chainId ?? "")
  const [suburb, setSuburb] = useState(existing?.suburb ?? "")
  const [state, setState] = useState(existing?.state ?? "")
  const [address, setAddress] = useState(existing?.address ?? "")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedChain = chains.find((c) => c.id === chainId) ?? null
  const isNational = selectedChain?.isNational ?? false

  const selectStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 12px",
    border: `1px solid ${isDark ? "#2d3148" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: "inherit",
    backgroundColor: isDark ? "#1e2030" : "#fff",
    color: isDark ? "#f1f5f9" : "#0f172a",
  }

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Name cannot be empty")
    if (!chainId) return setErrorMessage("Chain is required")
    if (!isNational && !suburb.trim()) return setErrorMessage("Suburb is required")
    const payload: CreateStoreLocation = {
      name: name.trim(),
      chainId,
      suburb: isNational ? null : suburb.trim(),
      state: state || null,
      address: address.trim() || null,
    }
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      if (mode.type === "create") await createStoreLocation(payload)
      else await updateStoreLocation(mode.location.id, payload)
      onSuccess()
    } catch {
      setErrorMessage("Failed to save — the store name may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" mb={5} px={0} color="gray.500" onClick={onCancel}>← Back</Button>
      <Text fontSize="18px" fontWeight="700" letterSpacing="-0.2px" mb={5} color={isDark ? "#f1f5f9" : "#0f172a"}>
        {mode.type === "create" ? "Add store" : "Edit store"}
      </Text>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Name</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coles Richmond Traders" color={isDark ? "#f1f5f9" : "#0f172a"} />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Chain</Field.Label>
        <select value={chainId} onChange={(e) => setChainId(e.target.value)} style={selectStyle}>
          <option value="">Select a chain…</option>
          {chains.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field.Root>

      {isNational ? (
        <Box mb={4} px={3} py={2.5} borderRadius="8px" backgroundColor="blue.50" border="1px solid" borderColor="blue.200">
          <Text fontSize="13px" color="blue.700">Prices apply nationally — no specific location needed</Text>
        </Box>
      ) : (
        <>
          <Field.Root mb={4}>
            <Field.Label fontWeight="500">Suburb</Field.Label>
            <Input value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Richmond" color={isDark ? "#f1f5f9" : "#0f172a"} />
          </Field.Root>

          <Field.Root mb={4}>
            <Field.Label fontWeight="500">State <Text as="span" color="gray.400" fontWeight="400">(optional)</Text></Field.Label>
            <select value={state} onChange={(e) => setState(e.target.value)} style={selectStyle}>
              <option value="">—</option>
              {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field.Root>

          <Field.Root mb={5}>
            <Field.Label fontWeight="500">Address <Text as="span" color="gray.400" fontWeight="400">(optional)</Text></Field.Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Bridge Rd" color={isDark ? "#f1f5f9" : "#0f172a"} />
          </Field.Root>
        </>
      )}

      {errorMessage && <Text color="red.500" fontSize="14px" mb={4}>{errorMessage}</Text>}

      <Flex gap={2.5}>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button colorPalette="green" flex={1} onClick={handleSubmit} loading={isSubmitting} loadingText="Saving…">
          {mode.type === "create" ? "Add store" : "Save changes"}
        </Button>
      </Flex>
    </Box>
  )
}

function ChainList(props: { chains: StoreChain[]; onEdit: (chain: StoreChain) => void }): ReactElement {
  const { chains, onEdit } = props

  if (chains.length === 0) {
    return (
      <EmptyState.Root border="1.5px dashed" borderColor="gray.200" borderRadius="14px" py={10}>
        <EmptyState.Content>
          <EmptyState.Indicator fontSize="32px">🔗</EmptyState.Indicator>
          <VStack gap={1}>
            <EmptyState.Title>No chains yet</EmptyState.Title>
            <EmptyState.Description>Add store chains like Coles or Woolworths</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    )
  }

  return (
    <VStack gap={2} align="stretch">
      {chains.map((chain) => (
        <Card.Root key={chain.id} style={styles.listCard}>
          <Box>
            <Text fontWeight="600" fontSize="15px">{chain.name}</Text>
            {chain.websiteUrl && <Text color="gray.400" fontSize="13px" mt={0.5}>{chain.websiteUrl}</Text>}
          </Box>
          <Button size="sm" variant="outline" onClick={() => onEdit(chain)}>Edit</Button>
        </Card.Root>
      ))}
    </VStack>
  )
}

function ChainForm(props: { mode: ChainFormMode; onSuccess: () => void; onCancel: () => void }): ReactElement {
  const { mode, onSuccess, onCancel } = props
  const existing = mode.type === "edit" ? mode.chain : null
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"

  const [name, setName] = useState(existing?.name ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(existing?.websiteUrl ?? "")
  const [isNational, setIsNational] = useState(existing?.isNational ?? false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return setErrorMessage("Name cannot be empty")
    const payload: CreateStoreChain = { name: name.trim(), websiteUrl: websiteUrl.trim() || null, isNational }
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      if (mode.type === "create") await createStoreChain(payload)
      else await updateStoreChain(mode.chain.id, payload)
      onSuccess()
    } catch {
      setErrorMessage("Failed to save — the chain name may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" mb={5} px={0} color="gray.500" onClick={onCancel}>← Back</Button>
      <Text fontSize="18px" fontWeight="700" letterSpacing="-0.2px" mb={5} color={isDark ? "#f1f5f9" : "#0f172a"}>
        {mode.type === "create" ? "Add chain" : "Edit chain"}
      </Text>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Name</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Woolworths" color={isDark ? "#f1f5f9" : "#0f172a"} autoFocus />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Website URL <Text as="span" color="gray.400" fontWeight="400">(optional)</Text></Field.Label>
        <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://www.woolworths.com.au" color={isDark ? "#f1f5f9" : "#0f172a"} />
      </Field.Root>

      <Field.Root mb={5}>
        <Flex align="center" gap={2}>
          <input
            type="checkbox"
            id="isNational"
            checked={isNational}
            onChange={(e) => setIsNational(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <Field.Label htmlFor="isNational" fontWeight="500" mb={0} cursor="pointer">
            Same prices nationally (e.g. ALDI)
          </Field.Label>
        </Flex>
        <Text fontSize="12px" color="gray.400" mt={1} ml={6}>
          When enabled, store locations for this chain won't require a suburb
        </Text>
      </Field.Root>

      {errorMessage && <Text color="red.500" fontSize="14px" mb={4}>{errorMessage}</Text>}

      <Flex gap={2.5}>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button colorPalette="green" flex={1} onClick={handleSubmit} loading={isSubmitting} loadingText="Saving…">
          {mode.type === "create" ? "Add chain" : "Save changes"}
        </Button>
      </Flex>
    </Box>
  )
}
