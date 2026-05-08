import { ReactElement, useEffect, useState } from "react"
import {
  Box, Flex, Text, Button, Input, Field,
  Skeleton, VStack, Checkbox,
} from "@chakra-ui/react"
import { Product, StoreChain, StoreLocationWithChain } from "@grocery/shared"
import { getStoreLocations, createStoreLocation } from "../../api/store-locations"
import { getStoreChains } from "../../api/store-chains"
import { getBrands, createPriceRecord } from "../../api/price-records"
import { SearchSelect } from "../../components/SearchSelect"
import { useColorMode } from "../../lib/color-mode"

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]

function makeStyles(isDark: boolean) {
  return {
    inlineStoreBox: {
      padding: "16px",
      border: `1.5px solid ${isDark ? "#2d3148" : "#e2e8f0"}`,
      borderRadius: "14px",
      backgroundColor: isDark ? "#1a1d2e" : "#f8fafc",
    } as React.CSSProperties,
    selectNative: {
      width: "100%",
      height: 40,
      padding: "0 12px",
      border: `1px solid ${isDark ? "#2d3148" : "#e2e8f0"}`,
      borderRadius: 8,
      fontSize: 16,
      fontFamily: "inherit",
      backgroundColor: isDark ? "#1e2030" : "#fff",
      color: isDark ? "#f1f5f9" : "#0f172a",
    } as React.CSSProperties,
    selectNativeSmall: {
      height: 36,
      padding: "0 10px",
      border: `1px solid ${isDark ? "#2d3148" : "#e2e8f0"}`,
      borderRadius: 8,
      fontSize: 15,
      fontFamily: "inherit",
      backgroundColor: isDark ? "#1e2030" : "#fff",
      color: isDark ? "#f1f5f9" : "#0f172a",
    } as React.CSSProperties,
  }
}

export function AddObservation(props: {
  product: Product
  onSuccess: () => void
  onCancel: () => void
}): ReactElement {
  const { product, onSuccess, onCancel } = props
  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const [storeLocations, setStoreLocations] = useState<StoreLocationWithChain[]>([])
  const [chains, setChains] = useState<StoreChain[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [storeLocationId, setStoreLocationId] = useState("")
  const [brand, setBrand] = useState("")
  const [price, setPrice] = useState("")
  const [isSpecial, setIsSpecial] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateStore, setShowCreateStore] = useState(false)

  const reloadStores = async () => {
    const locs = await getStoreLocations()
    setStoreLocations(locs)
    return locs
  }

  useEffect(() => {
    Promise.all([reloadStores(), getStoreChains(), getBrands()])
      .then(([, fetchedChains, fetchedBrands]) => {
        setChains(fetchedChains)
        setBrands(fetchedBrands)
      })
      .finally(() => setIsLoading(false))
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
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) return setErrorMessage("Enter a valid price")
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      await createPriceRecord({
        productId: product.id,
        storeLocationId,
        brand: brand.trim() || null,
        price: parsedPrice,
        isSpecial,
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

  const storeOptions = storeLocations.map((loc) => ({ value: loc.id, label: `${loc.name} — ${loc.suburb}` }))
  const brandOptions = brands.map((b) => ({ value: b, label: b }))

  return (
    <Box>
      <Button variant="ghost" size="sm" mb={5} px={0} color="gray.500" onClick={onCancel}>← Back</Button>
      <Text fontSize="20px" fontWeight="700" letterSpacing="-0.3px" mb={5}>
        Add price for <Text as="span" color="green.600">{product.name}</Text>
      </Text>

      {isLoading ? (
        <ObservationFormSkeleton />
      ) : (
        <>
          <Field.Root mb={4}>
            <Field.Label fontWeight="500">Store</Field.Label>
            {showCreateStore ? (
              <InlineCreateStore chains={chains} isDark={isDark} onSuccess={handleStoreCreated} onCancel={() => setShowCreateStore(false)} />
            ) : (
              <SearchSelect
                options={storeOptions}
                value={storeLocationId}
                onChange={setStoreLocationId}
                onCreateNew={() => setShowCreateStore(true)}
                createNewLabel={() => "+ Create new store"}
                placeholder="Search for a store…"
              />
            )}
          </Field.Root>

          {!showCreateStore && (
            <>
              <Field.Root mb={4}>
                <Field.Label fontWeight="500">
                  Brand <Text as="span" color="gray.400" fontWeight="400">(optional)</Text>
                </Field.Label>
                <SearchSelect
                  options={brandOptions}
                  value={brand}
                  onChange={setBrand}
                  onCreateNew={(input) => {
                    setBrand(input)
                    if (!brands.includes(input)) setBrands([...brands, input].sort())
                  }}
                  createNewLabel={(input) => `+ Add "${input}" as new brand`}
                  placeholder="Search or type a brand…"
                />
              </Field.Root>

              <Field.Root mb={4}>
                <Field.Label fontWeight="500">Price per {product.unitType} ($)</Field.Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  color={isDark ? "#f1f5f9" : "#0f172a"}
                />
              </Field.Root>

              <Box mb={5}>
                <Checkbox.Root
                  colorPalette="green"
                  checked={isSpecial}
                  onCheckedChange={(e) => setIsSpecial(!!e.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>This is a special / on sale</Checkbox.Label>
                </Checkbox.Root>
              </Box>

              {errorMessage && <Text color="red.500" fontSize="14px" mb={4}>{errorMessage}</Text>}

              <Flex gap={2.5}>
                <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
                <Button colorPalette="green" flex={1} onClick={handleSubmit} loading={isSubmitting} loadingText="Saving…">
                  Save price
                </Button>
              </Flex>
            </>
          )}
        </>
      )}
    </Box>
  )
}

function ObservationFormSkeleton(): ReactElement {
  return (
    <VStack gap={4} align="stretch">
      {[1, 2, 3].map((i) => (
        <Box key={i}>
          <Skeleton height="14px" width="80px" mb={2} />
          <Skeleton height="40px" borderRadius="8px" />
        </Box>
      ))}
    </VStack>
  )
}

function InlineCreateStore(props: {
  chains: StoreChain[]
  isDark: boolean
  onSuccess: (location: StoreLocationWithChain) => void
  onCancel: () => void
}): ReactElement {
  const { chains, isDark, onSuccess, onCancel } = props
  const styles = makeStyles(isDark)
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
    <Box style={styles.inlineStoreBox}>
      <Text fontWeight="600" fontSize="15px" mb={3.5} color={isDark ? "#f1f5f9" : "#0f172a"}>New store</Text>

      <Field.Root mb={3}>
        <Field.Label fontSize="13px" fontWeight="500">Name</Field.Label>
        <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coles Richmond Traders" color={isDark ? "#f1f5f9" : "#0f172a"} autoFocus />
      </Field.Root>

      <Field.Root mb={3}>
        <Field.Label fontSize="13px" fontWeight="500">
          Chain <Text as="span" color="gray.400" fontWeight="400">(optional)</Text>
        </Field.Label>
        <select value={chainId} onChange={(e) => setChainId(e.target.value)} style={styles.selectNativeSmall}>
          <option value="">Independent store</option>
          {chains.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field.Root>

      <Flex gap={2.5} mb={3}>
        <Field.Root flex={1}>
          <Field.Label fontSize="13px" fontWeight="500">Suburb</Field.Label>
          <Input size="sm" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Richmond" color={isDark ? "#f1f5f9" : "#0f172a"} />
        </Field.Root>
        <Field.Root w="90px">
          <Field.Label fontSize="13px" fontWeight="500">State</Field.Label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={styles.selectNativeSmall}>
            <option value="">—</option>
            {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field.Root>
      </Flex>

      {errorMessage && <Text color="red.500" fontSize="13px" mb={3}>{errorMessage}</Text>}

      <Flex gap={2}>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button size="sm" colorPalette="green" flex={1} onClick={handleSubmit} loading={isSubmitting} loadingText="Creating…">
          Create store
        </Button>
      </Flex>
    </Box>
  )
}
