import dotenv from 'dotenv'
dotenv.config()

import { classifyOrder } from './classifier/OrderClassifier'

async function main() {
  console.log('=== AEGIS ORDER CLASSIFIER ===')
  console.log('Testing against the actual $50M transaction...\n')

  const result = await classifyOrder({
    sellTokenAddress: '0x23878914efe38d27c4d67ab83ed1b93a74d4086a', // aEthUSDT
    buyTokenAddress: '0xa700b4eb416be35b2911fd5dee80678ff64ff6c9',  // aEthAAVE
    sellAmountUSD: 50_432_688,
    chainId: 1
  })

  console.log('TIER:', result.tier)
  console.log('ORDER SIZE:', `$${result.orderSizeUSD.toLocaleString()}`)
  console.log('SLIPPAGE ESTIMATE:', `${(result.slippage.estimatedPercent * 100).toFixed(2)}%`)
  console.log('SLIPPAGE SEVERITY:', result.slippage.severity)
  console.log('POOL DEPTH:', `$${result.liquidity.totalDepthUSD.toLocaleString()}`)
  console.log('ORDER VS DEPTH:', `${result.liquidity.orderVsDepthPercent.toFixed(1)}%`)
  console.log('ESTIMATED OUTPUT (single swap):', `$${result.estimatedOutput.usdValue.toLocaleString(undefined, {maximumFractionDigits: 0})}`)
  console.log('ESTIMATED LOSS:', `$${result.estimatedOutput.lossToSlippageUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}`)
  console.log('\nRECOMMENDATION:', result.recommendation.method)
  console.log('REASON:', result.recommendation.reason)
  console.log('SUGGESTED TRANCHES:', result.recommendation.suggestedTranches)
  console.log('SUGGESTED WINDOW:', `${result.recommendation.suggestedWindowHours} hours`)
  console.log('ESTIMATED OUTPUT VIA TWAP:', `$${result.recommendation.estimatedOutputViaTWAP?.toLocaleString(undefined, {maximumFractionDigits: 0})}`)
}

main().catch(console.error)