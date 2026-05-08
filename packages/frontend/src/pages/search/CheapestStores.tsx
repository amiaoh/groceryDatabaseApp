import { Badge, Box, Button, EmptyState, Flex, Input, Skeleton, Text, VStack } from "@chakra-ui/react"
import { CheapestStore, Product, ScraperStatus } from "@grocery/shared"
import { ReactElement, useState } from "react"
import { isStale, timeAgo } from "../../lib/time"
import { updateProduct } from "../../api/products"
import { useColorMode } from "../../lib/color-mode"

export function CheapestStores(props: {
  product: Product
  stores: CheapestStore[]
  scraperStatuses: ScraperStatus[]
  onAddObservation: () => void
  onRefresh: () => void
  isRefreshing: boolean
  onProductUpdate: (updated: Product) => void
}): ReactElement {
  const { product, stores, scraperStatuses, onAddObservation, onRefresh, isRefreshing, onProductUpdate } = props
  const failedChains = scraperStatuses.filter((s) => s.status === "failed").map((s) => s.chainName)
  const loadingChains = scraperStatuses.filter((s) => s.status === "loading").map((s) => s.chainName)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(product.name)
  const [isSavingName, setIsSavingName] = useState(false)

  const { colorMode } = useColorMode()
  const isDark = colorMode === "dark"

  const cardBg = isDark ? "#1e2030" : "#fff"
  const bestCardBg = isDark ? "#0d2a10" : "#f0fdf4"
  const borderColor = isDark ? "#2d3148" : "#e2e8f0"
  const bestBorderColor = isDark ? "#1a4a1a" : "#bbf7d0"
  const mutedColor = isDark ? "#64748b" : "#94a3b8"
  const priceColorNormal = isDark ? "#f1f5f9" : "#0f172a"

  const handleSaveName = async () => {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === product.name) {
      setIsEditingName(false)
      setEditName(product.name)
      return
    }
    setIsSavingName(true)
    try {
      const updated = await updateProduct(product.id, { name: trimmed })
      onProductUpdate(updated)
      setIsEditingName(false)
    } catch { /* ignore */ } finally {
      setIsSavingName(false)
    }
  }

  return (
    <Box>
      <Flex justify="space-between" align="flex-start" mb={5} gap={3}>
        <Box flex={1} minWidth={0}>
          {isEditingName ? (
            <Flex gap={2} align="center">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                fontSize="18px"
                fontWeight="700"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName()
                  if (e.key === "Escape") { setIsEditingName(false); setEditName(product.name) }
                }}
              />
              <Button size="sm" colorPalette="green" onClick={handleSaveName} loading={isSavingName}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditingName(false); setEditName(product.name) }}>✕</Button>
            </Flex>
          ) : (
            <Flex align="center" gap={1.5} flexWrap="wrap">
              <Text fontSize="20px" fontWeight="700" letterSpacing="-0.3px">{product.name}</Text>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => { setIsEditingName(true); setEditName(product.name) }}
                color={mutedColor}
                px={1}
                aria-label="Edit product name"
              >
                ✎
              </Button>
            </Flex>
          )}
          {product.category && (
            <Text color={mutedColor} fontSize="13px" mt={0.5}>{product.category}</Text>
          )}
        </Box>

        <Flex gap={2} flexShrink={0}>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            loading={isRefreshing}
            loadingText="Refreshing…"
            disabled={isRefreshing}
          >
            ↻ Refresh
          </Button>
          <Button colorPalette="green" size="sm" onClick={onAddObservation}>+ Add price</Button>
        </Flex>
      </Flex>

      {failedChains.length > 0 && (
        <Box
          mb={4} px={3} py={2.5} borderRadius="10px"
          bg={isDark ? "rgba(251,146,60,0.08)" : "orange.50"}
          border="1px solid"
          borderColor={isDark ? "#7c3a0a" : "orange.200"}
        >
          <Text fontSize="13px" color={isDark ? "orange.300" : "orange.700"}>
            ⚠ Couldn't fetch live prices from: {failedChains.join(", ")}
          </Text>
        </Box>
      )}

      {stores.length === 0 && loadingChains.length === 0 ? (
        <EmptyState.Root
          border="1.5px dashed"
          borderColor={isDark ? "#2d3148" : "gray.200"}
          borderRadius="14px"
          py={10}
        >
          <EmptyState.Content>
            <EmptyState.Indicator fontSize="32px">🏷️</EmptyState.Indicator>
            <VStack gap={1}>
              <EmptyState.Title>No prices recorded yet</EmptyState.Title>
              <EmptyState.Description>Be the first to add one!</EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Flex direction="column" gap={2.5}>
          {stores.map((entry, index) => {
            const stale = isStale(entry.recordedAt)
            const isBest = index === 0
            return (
              <Box
                key={`${entry.storeLocation.chain?.id ?? entry.storeLocation.id}:${entry.brand ?? ""}`}
                p="14px 16px"
                bg={isBest ? bestCardBg : cardBg}
                border="1px solid"
                borderColor={isBest ? bestBorderColor : borderColor}
                borderRadius="14px"
              >
                <Flex justify="space-between" align="center" gap={3}>
                  <Box flex={1} minWidth={0}>
                    <Flex align="center" gap={1.5} mb={0.5} flexWrap="wrap">
                      {isBest && <Text fontSize="14px">🏆</Text>}
                      <Text fontWeight="600" fontSize="15px">{entry.storeLocation.name}</Text>
                      {entry.source === "scraped"
                        ? <Badge colorPalette="green" variant="subtle" fontSize="10px" px={1.5}>live</Badge>
                        : <Badge colorPalette="gray" variant="subtle" fontSize="10px" px={1.5}>manual</Badge>
                      }
                    </Flex>
                    {entry.brand && (
                      <Text fontSize="13px" color={mutedColor} mb={0.5}>{entry.brand}</Text>
                    )}
                    <Flex align="center" gap={2.5} flexWrap="wrap">
                      <Text fontSize="12px" color={stale ? "orange.400" : mutedColor}>
                        {stale ? "⚠ " : ""}{timeAgo(entry.recordedAt)}
                      </Text>
                      {entry.productUrl && (
                        <a
                          href={entry.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12, color: "#16a34a", textDecoration: "none" }}
                        >
                          View ↗
                        </a>
                      )}
                    </Flex>
                  </Box>
                  <Box textAlign="right" flexShrink={0}>
                    <Text style={{
                      fontWeight: 700,
                      fontSize: 20,
                      letterSpacing: "-0.5px",
                      color: isBest ? "#16a34a" : priceColorNormal,
                    }}>
                      ${entry.price.toFixed(2)}
                      <Text as="span" fontSize="13px" fontWeight="400" color={mutedColor}>
                        /{product.packageDetail
                          ? `${product.packageDetail} ${product.unitType}`
                          : product.unitType}
                      </Text>
                    </Text>
                    {entry.isSpecial && (
                      <Badge colorPalette="red" mt={1} fontSize="11px">SPECIAL</Badge>
                    )}
                  </Box>
                </Flex>
              </Box>
            )
          })}

          {loadingChains.map((chainName) => (
            <Box
              key={chainName}
              p="14px 16px"
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="14px"
            >
              <Flex justify="space-between" align="center" gap={3}>
                <Box>
                  <Text fontWeight="600" fontSize="15px" color={mutedColor}>{chainName}</Text>
                  <Skeleton height="12px" width="80px" mt={1.5} borderRadius="4px" />
                </Box>
                <Skeleton height="26px" width="72px" borderRadius="6px" />
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  )
}
