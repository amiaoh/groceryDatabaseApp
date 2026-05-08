import { ReactElement, useEffect, useState } from "react"
import {
  Box, Flex, Text, Button, Input, Field,
  Skeleton, VStack,
} from "@chakra-ui/react"
import { useColorMode } from "../../lib/color-mode"
import { Category, categorySchema, Product, UNITS_WITH_PACKAGE_DETAIL, UnitType, unitTypeSchema } from "@grocery/shared"
import { searchProducts, createProduct } from "../../api/products"
import { getCheapestStores } from "../../api/price-records"
import { CheapestStoresResponse } from "@grocery/shared"
import { CheapestStores } from "./CheapestStores"
import { AddObservation } from "./AddObservation"

type View = "search" | "results" | "add-observation" | "create-product"

export function ProductSearch(): ReactElement {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cheapestResponse, setCheapestResponse] = useState<CheapestStoresResponse | null>(null)
  const [view, setView] = useState<View>("search")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"
  const borderColor = isDark ? "#2d3148" : "#e2e8f0"
  const hoverBg = isDark ? "#1a1d2e" : "#f8fafc"
  const addHoverBg = isDark ? "#0d2a10" : "#f0fdf4"
  const mutedText = isDark ? "#64748b" : "#94a3b8"

  useEffect(() => {
    if (query.length < 2) { setSearchResults([]); return }
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try { setSearchResults(await searchProducts(query)) }
      finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const loadPrices = async (product: Product, force = false) => {
    if (force) {
      setIsRefreshing(true)
      try { setCheapestResponse(await getCheapestStores(product.id, true)) }
      finally { setIsRefreshing(false) }
      return
    }

    // Phase 1: return existing DB prices immediately (no scraping)
    setIsLoadingPrices(true)
    const preview = await getCheapestStores(product.id, false, true)
    setCheapestResponse(preview)
    setIsLoadingPrices(false)

    // Phase 2: scrape stale chains in the background
    if (preview.scraperStatuses.some((s) => s.status === "loading")) {
      const full = await getCheapestStores(product.id, false, false)
      setCheapestResponse(full)
    }
  }

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product)
    setView("results")
    await loadPrices(product)
  }

  const handleObservationSuccess = async () => {
    if (!selectedProduct) return
    setView("results")
    await loadPrices(selectedProduct)
  }

  const handleRefresh = async () => {
    if (!selectedProduct) return
    await loadPrices(selectedProduct, true)
  }

  const handleProductUpdate = (updated: Product) => {
    setSelectedProduct(updated)
  }

  if (view === "add-observation" && selectedProduct) {
    return <AddObservation product={selectedProduct} onSuccess={handleObservationSuccess} onCancel={() => setView("results")} />
  }

  if (view === "create-product") {
    return <CreateProduct initialName={query} onSuccess={(p) => handleSelectProduct(p)} onCancel={() => setView("search")} isDark={isDark} />
  }

  if (view === "results" && selectedProduct) {
    return (
      <Box>
        <Button variant="ghost" size="sm" mb={5} px={0} color={mutedText} onClick={() => setView("search")}>
          ← Back to search
        </Button>
        {isLoadingPrices ? <PricesSkeleton /> : (
          <CheapestStores
            product={selectedProduct}
            stores={cheapestResponse?.stores ?? []}
            scraperStatuses={cheapestResponse?.scraperStatuses ?? []}
            onAddObservation={() => setView("add-observation")}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onProductUpdate={handleProductUpdate}
          />
        )}
      </Box>
    )
  }

  const resultListStyle: React.CSSProperties = {
    marginTop: 8,
    border: `1px solid ${borderColor}`,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
  }

  const resultRowBase: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderTop: "none",
    borderLeft: "none",
    borderRight: "none",
    borderBottom: `1px solid ${borderColor}`,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "none",
    fontFamily: "inherit",
    textAlign: "left",
    transition: "background-color 150ms",
    color: isDark ? "#f1f5f9" : "#0f172a",
  }

  return (
    <Box>
      <Box position="relative" mb={4}>
        <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" pointerEvents="none" color={mutedText}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </Box>
        <Input
          pl="42px"
          h="50px"
          fontSize="16px"
          placeholder="Search for a product (e.g. chicken thigh)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          color={isDark ? "#f1f5f9" : "#0f172a"}
          autoFocus
        />
      </Box>

      {isSearching && (
        <VStack gap={2} mt={3}>
          {[1, 2, 3].map((i) => <Skeleton key={i} height="52px" borderRadius="10px" w="full" />)}
        </VStack>
      )}

      {!isSearching && query.length >= 2 && (
        <Box style={resultListStyle}>
          {searchResults.length === 0 && (
            <Text px={4} py={3.5} color={mutedText} fontSize="14px">No products found</Text>
          )}
          {searchResults.map((product) => (
            <button
              key={product.id}
              style={resultRowBase}
              onClick={() => handleSelectProduct(product)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverBg)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              <Text fontWeight="500" fontSize="15px">{product.name}</Text>
              <Text color={mutedText} fontSize="13px">per {product.unitType}</Text>
            </button>
          ))}
          <button
            style={{ ...resultRowBase, borderBottom: "none" }}
            onClick={() => setView("create-product")}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = addHoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
          >
            <Text color="green.600" fontWeight="500" fontSize="15px">+ Add "{query}" as a new product</Text>
          </button>
        </Box>
      )}
    </Box>
  )
}

function PricesSkeleton(): ReactElement {
  return (
    <Box>
      <Flex justify="space-between" align="center" mb={5}>
        <Box>
          <Skeleton height="26px" width="180px" mb={1.5} />
          <Skeleton height="14px" width="100px" />
        </Box>
        <Skeleton height="36px" width="90px" borderRadius="10px" />
      </Flex>
      <VStack gap={2.5}>
        {[1, 2, 3].map((i) => <Skeleton key={i} height="76px" borderRadius="14px" w="full" />)}
      </VStack>
    </Box>
  )
}

function CreateProduct(props: {
  initialName: string
  onSuccess: (product: Product) => void
  onCancel: () => void
  isDark: boolean
}): ReactElement {
  const { initialName, onSuccess, isDark } = props
  const [name, setName] = useState(initialName)
  const [unitType, setUnitType] = useState<UnitType>("kg")
  const [packageDetail, setPackageDetail] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showPackageDetail = UNITS_WITH_PACKAGE_DETAIL.has(unitType)

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
    if (!name.trim()) return setErrorMessage("Product name is required")
    if (!category) return setErrorMessage("Category is required")
    if (showPackageDetail && !packageDetail.trim()) return setErrorMessage("Package size is required")
    setIsSubmitting(true)
    setErrorMessage("")
    try {
      const product = await createProduct({
        name: name.trim(),
        unitType,
        category: category as Category,
        packageDetail: showPackageDetail ? packageDetail.trim() : null,
      })
      onSuccess(product)
    } catch {
      setErrorMessage("Failed to create product — it may already exist")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box>
      <Button variant="ghost" size="sm" mb={5} px={0} color="gray.500" onClick={props.onCancel}>← Back</Button>
      <Text fontSize="20px" fontWeight="700" letterSpacing="-0.3px" mb={5}>Add new product</Text>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Name</Field.Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field.Root>

      <Field.Root mb={4}>
        <Field.Label fontWeight="500">Unit type</Field.Label>
        <select
          value={unitType}
          onChange={(e) => { setUnitType(e.target.value as UnitType); setPackageDetail("") }}
          style={selectStyle}
        >
          {unitTypeSchema.options.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </Field.Root>

      {showPackageDetail && (
        <Field.Root mb={4}>
          <Field.Label fontWeight="500">Package size (e.g. 400g, 375mL)</Field.Label>
          <Input placeholder="e.g. 400g" value={packageDetail} onChange={(e) => setPackageDetail(e.target.value)} />
        </Field.Root>
      )}

      <Field.Root mb={5}>
        <Field.Label fontWeight="500">Category</Field.Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category | "")}
          style={selectStyle}
        >
          <option value="">Select a category…</option>
          {categorySchema.options.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field.Root>

      {errorMessage && <Text color="red.500" fontSize="14px" mb={4}>{errorMessage}</Text>}

      <Flex gap={2.5}>
        <Button variant="outline" onClick={props.onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button colorPalette="green" flex={1} onClick={handleSubmit} loading={isSubmitting} loadingText="Creating…">
          Create product
        </Button>
      </Flex>
    </Box>
  )
}
