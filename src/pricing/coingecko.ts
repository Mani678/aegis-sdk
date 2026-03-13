import axios from 'axios'
import { TokenPrice, PricingResult } from '../types/index'

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3'

export async function getTokenPrices(
  sellTokenAddress: string,
  buyTokenAddress: string,
  chainId: number = 1
): Promise<PricingResult> {

  const platform = 'ethereum'
  const addresses = `${sellTokenAddress},${buyTokenAddress}`.toLowerCase()

  const response = await axios.get(
    `${COINGECKO_BASE}/simple/token_price/${platform}`,
    {
      params: {
        contract_addresses: addresses,
        vs_currencies: 'usd',
        include_market_cap: false,
        include_24hr_vol: false
      },
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
      }
    }
  )

  const data = response.data

  const sellPrice = data[sellTokenAddress.toLowerCase()]?.usd
  const buyPrice = data[buyTokenAddress.toLowerCase()]?.usd

  if (!sellPrice || !buyPrice) {
    throw new Error(`Could not fetch price for one or both tokens`)
  }

  return {
    sellToken: {
      address: sellTokenAddress,
      symbol: 'SELL',
      priceUSD: sellPrice,
      lastUpdated: Date.now()
    },
    buyToken: {
      address: buyTokenAddress,
      symbol: 'BUY',
      priceUSD: buyPrice,
      lastUpdated: Date.now()
    },
    fetchedAt: Date.now()
  }
}