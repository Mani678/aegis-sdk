import { getTokenPrices } from '../pricing/coingecko'
import { getPoolLiquidity } from '../liquidity/uniswapV3'

export interface OrderInput {
  sellTokenAddress: string
  buyTokenAddress: string
  sellAmountUSD: number
  chainId?: number
}

export interface OrderAssessment {
  tier: 1 | 2 | 3
  orderSizeUSD: number

  estimatedOutput: {
    usdValue: number
    lossToSlippageUSD: number
  }

  slippage: {
    estimatedPercent: number
    severity: 'low' | 'moderate' | 'severe' | 'catastrophic'
  }

  liquidity: {
    totalDepthUSD: number
    orderVsDepthPercent: number
  }

  recommendation: {
    method: 'single_swap' | 'split_recommended' | 'twap_required'
    reason: string
    suggestedTranches?: number
    suggestedWindowHours?: number
    estimatedOutputViaTWAP?: number
  }
}

function estimatePriceImpact(orderSizeUSD: number, poolDepthUSD: number): number {
  const ratio = orderSizeUSD / poolDepthUSD
  if (ratio < 0.01) return ratio * 0.5
  if (ratio < 0.05) return ratio * 1.2
  if (ratio < 0.20) return ratio * 2.5
  return Math.min(ratio * 4.0, 0.9999) // cap at 99.99%
}

function getSlippageSeverity(percent: number): 'low' | 'moderate' | 'severe' | 'catastrophic' {
  if (percent < 0.01) return 'low'
  if (percent < 0.05) return 'moderate'
  if (percent < 0.20) return 'severe'
  return 'catastrophic'
}

function assignTier(
  orderSizeUSD: number,
  slippagePercent: number,
  orderVsDepthRatio: number
): 1 | 2 | 3 {
  if (orderSizeUSD > 5_000_000) return 3
  if (orderSizeUSD > 100_000) return 2
  if (slippagePercent > 0.05) return 3
  if (slippagePercent > 0.01) return 2
  if (orderVsDepthRatio > 0.15) return 3
  if (orderVsDepthRatio > 0.03) return 2
  return 1
}

export async function classifyOrder(input: OrderInput): Promise<OrderAssessment> {

  // Step 1: Get live prices
  const prices = await getTokenPrices(
    input.sellTokenAddress,
    input.buyTokenAddress,
    input.chainId ?? 1
  )

  // Step 2: Get pool liquidity for both hops
  // For simplicity we use the buy token pool depth as the bottleneck
  const pool = await getPoolLiquidity(
    input.sellTokenAddress,
    input.buyTokenAddress
  )

  const poolDepthUSD = pool?.totalValueLockedUSD ?? 5_000_000

  // Step 3: Calculate impact
  const slippagePercent = estimatePriceImpact(input.sellAmountUSD, poolDepthUSD)
  const orderVsDepthRatio = input.sellAmountUSD / poolDepthUSD
  const estimatedOutputUSD = input.sellAmountUSD * (1 - slippagePercent)
  const lossUSD = input.sellAmountUSD - estimatedOutputUSD

  // Step 4: Assign tier
  const tier = assignTier(input.sellAmountUSD, slippagePercent, orderVsDepthRatio)

  // Step 5: Build recommendation
  const tranches = Math.ceil(input.sellAmountUSD / 2_000_000)
  const windowHours = Math.ceil(tranches / 6)
  const twapOutputUSD = input.sellAmountUSD * 0.997 // ~0.3% slippage per tranche

  const recommendation =
    tier === 1
      ? { method: 'single_swap' as const, reason: 'Order size is within safe liquidity depth' }
      : tier === 2
      ? {
          method: 'split_recommended' as const,
          reason: `Order may cause ${(slippagePercent * 100).toFixed(1)}% slippage`,
          suggestedTranches: tranches,
          suggestedWindowHours: windowHours,
          estimatedOutputViaTWAP: twapOutputUSD
        }
      : {
          method: 'twap_required' as const,
          reason: `Order is ${(orderVsDepthRatio * 100).toFixed(0)}% of available pool depth — single swap will cause catastrophic slippage`,
          suggestedTranches: tranches,
          suggestedWindowHours: windowHours,
          estimatedOutputViaTWAP: twapOutputUSD
        }

  return {
    tier,
    orderSizeUSD: input.sellAmountUSD,
    estimatedOutput: {
      usdValue: estimatedOutputUSD,
      lossToSlippageUSD: lossUSD
    },
    slippage: {
      estimatedPercent: slippagePercent,
      severity: getSlippageSeverity(slippagePercent)
    },
    liquidity: {
      totalDepthUSD: poolDepthUSD,
      orderVsDepthPercent: orderVsDepthRatio * 100
    },
    recommendation
  }
}