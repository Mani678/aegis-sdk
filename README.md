# Aegis SDK

**Large order execution protection for DeFi interfaces.**

Aegis is a TypeScript SDK that classifies trade orders by risk tier before execution, preventing catastrophic slippage on large DeFi trades.

---

## Why Aegis Exists

On March 12, 2026, a user swapped $50,432,688 USDT for AAVE through the Aave interface via CoW Protocol.

They received 327 AAVE in return — worth approximately $36,009.

**$50.4M in. $36K out.**

The CoW Protocol solvers worked correctly. The interface showed a slippage warning. The user confirmed a checkbox on mobile and proceeded.

The problem was not the protocol. The problem was that no system existed to classify the order size against available liquidity depth and enforce a safer execution path before the trade was submitted.

Aegis is that system.

Transaction: `0x9fa9feab3c1989a33424728c23e6de07a40a26a98ff7ff5139f3492ce430801f`

---

## What Aegis Does

Aegis classifies any trade order into one of three tiers:

| Tier | Size | Action |
|------|------|--------|
| 1 | < $100K | Single swap — proceed normally |
| 2 | $100K – $5M | Split recommended — warn with concrete dollar impact |
| 3 | > $5M | TWAP required — block single swap, enforce batched execution |

---

## The $50M Test

Running Aegis against the actual transaction:
```
=== AEGIS ORDER CLASSIFIER ===

TIER:                3
ORDER SIZE:          $50,432,688
SLIPPAGE ESTIMATE:   99.99%
SLIPPAGE SEVERITY:   catastrophic
POOL DEPTH:          $8,000,000
ORDER VS DEPTH:      630%
ESTIMATED OUTPUT:    $5,043  (single swap)
ESTIMATED LOSS:      $50,427,645

RECOMMENDATION:      twap_required
REASON:              Order is 630% of available pool depth
SUGGESTED TRANCHES:  26
SUGGESTED WINDOW:    5 hours
ESTIMATED OUTPUT VIA TWAP: $50,281,390
```

Aegis would have blocked the single swap and routed to TWAP execution — saving an estimated **$50.24M**.

---

## Modules

- **PricingModule** — live token prices via CoinGecko
- **LiquidityModule** — pool depth lookup for token pairs
- **OrderClassifier** — tier assignment, slippage estimation, execution recommendation

---

## Quick Start
```bash
git clone https://github.com/Mani678/aegis-sdk.git
cd aegis-sdk
npm install
```

Create a `.env` file:
```
COINGECKO_API_KEY=your_key_here
```

Run the classifier against the $50M transaction:
```bash
npx tsx src/test.ts
```

---

## Roadmap

- [x] OrderClassifier — tier assignment and slippage estimation
- [ ] SafeSwapUI — drop-in React component replacing checkbox warnings
- [ ] TWAPExecutor — wraps CoW Protocol ComposableCoW for batched execution
- [ ] Protocol SDK — embeddable package for DeFi interfaces

---

## For Protocol Teams

If you're building a DeFi interface and want to integrate large-order protection, reach out.

This is an open problem and Aegis is being built to solve it.

**Built by [@Mani_chukk](https://x.com/Mani_chukk)**

---

## License

MIT