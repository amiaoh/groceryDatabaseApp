import { ReactElement } from "react"
import { Box, Flex, Text, Button, Badge, Card, EmptyState, VStack } from "@chakra-ui/react"
import { CheapestStore, Product } from "@grocery/shared"
import { timeAgo, isStale } from "../../lib/time"

const styles = {
  priceCard: (isBest: boolean): React.CSSProperties => ({
    padding: "14px 16px",
    backgroundColor: isBest ? "#f0fdf4" : "#fff",
    borderColor: isBest ? "#bbf7d0" : "#e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  }),
  storeInfo: { flex: 1, minWidth: 0 } as React.CSSProperties,
  priceAmount: (isBest: boolean): React.CSSProperties => ({
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.5px",
    color: isBest ? "#16a34a" : "#0f172a",
  }),
}

export function CheapestStores(props: {
  product: Product
  stores: CheapestStore[]
  onAddObservation: () => void
}): ReactElement {
  const { product, stores, onAddObservation } = props

  return (
    <Box>
      <Flex justify="space-between" align="flex-start" mb={5}>
        <Box>
          <Text fontSize="20px" fontWeight="700" letterSpacing="-0.3px">{product.name}</Text>
          {product.category && (
            <Text color="gray.400" fontSize="13px" mt={0.5}>{product.category}</Text>
          )}
        </Box>
        <Button colorPalette="green" size="sm" onClick={onAddObservation}>+ Add price</Button>
      </Flex>

      {stores.length === 0 ? (
        <EmptyState.Root border="1.5px dashed" borderColor="gray.200" borderRadius="14px" py={10}>
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
              <Card.Root key={`${entry.storeLocation.id}:${entry.brand ?? ""}`} style={styles.priceCard(isBest)}>
                <Box style={styles.storeInfo}>
                  <Flex align="center" gap={1.5} mb={0.5}>
                    {isBest && <Text fontSize="14px">🏆</Text>}
                    <Text fontWeight="600" fontSize="15px">{entry.storeLocation.name}</Text>
                  </Flex>
                  {entry.brand && (
                    <Text fontSize="13px" color="gray.500" mb={0.5}>{entry.brand}</Text>
                  )}
                  <Text fontSize="12px" color={stale ? "orange.400" : "gray.400"}>
                    {stale ? "⚠ " : ""}{timeAgo(entry.recordedAt)}
                  </Text>
                </Box>
                <Box textAlign="right" flexShrink={0}>
                  <Text style={styles.priceAmount(isBest)}>
                    ${entry.price.toFixed(2)}
                    <Text as="span" fontSize="13px" fontWeight="400" color="gray.400">
                      /{product.packageDetail
                        ? `${product.packageDetail} ${product.unitType}`
                        : product.unitType}
                    </Text>
                  </Text>
                  {entry.isSpecial && (
                    <Badge colorPalette="red" mt={1} fontSize="11px">SPECIAL</Badge>
                  )}
                </Box>
              </Card.Root>
            )
          })}
        </Flex>
      )}
    </Box>
  )
}
