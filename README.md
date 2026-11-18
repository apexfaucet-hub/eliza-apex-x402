# apex-x402

ElizaOS plugin for two public APEX routes. It does not hold a key and it does not pay.

- `APEX_TX_CHECK` checks one unsigned Base or Solana transaction and returns SAFE or RISKY. 0.001 USDC.
- `APEX_DELIVERY_SCORE` scores one https x402 URL from 0 to 100. It does not pay that URL. 0.003 USDC.

On HTTP 402 the action returns the payment terms. Pay them with your own wallet.

Install from this repository:

```bash
elizaos plugins add https://github.com/apexfaucet-hub/eliza-apex-x402
```

The elizaOS/eliza repository does not accept third-party plugin or registry submissions. This repo is the install path.

Free samples:

- https://apexfaucet.xyz/tx-check
- https://apexfaucet.xyz/delivery-score?url=https://apexfaucet.xyz/api/x402/page-markdown
