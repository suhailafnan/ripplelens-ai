import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

export const coston2 = defineChain({
  id: 114,
  name: 'Flare Testnet Coston2',
  nativeCurrency: { name: 'C2FLR', symbol: 'C2FLR', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
  },
});

export const wagmiConfig = createConfig({
  chains: [coston2],
  transports: {
    [coston2.id]: http('https://coston2-api.flare.network/ext/C/rpc'),
  },
});
