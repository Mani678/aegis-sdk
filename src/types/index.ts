export interface TokenPrice {
  address: string
  symbol: string
  priceUSD: number
  lastUpdated: number
}

export interface PricingResult {
  sellToken: TokenPrice
  buyToken: TokenPrice
  fetchedAt: number
}