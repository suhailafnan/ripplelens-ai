// app/lib/chains.ts
import { defineChain } from 'viem';

export const c2flr = defineChain({
    id: 114, // <-- replace with actual C2FLR chainId
    name: 'C2FLR Testnet',
    network: 'c2flr',
    nativeCurrency: {
        name: 'Flare Testnet',
        symbol: 'C2FLR',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://c2.flare.network'] }, // use real RPC
        public: { http: ['https://c2.flare.network'] },
    },
    blockExplorers: {
        default: {
            name: 'C2FLR Explorer',
            url: 'https://c2-explorer.flare.network', // use real explorer URL
        },
    },
});
