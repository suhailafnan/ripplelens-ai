// app/lib/chains.ts
import { defineChain } from 'viem';

export const c2flr = defineChain({
    id: 114,
    name: 'Flare Testnet Coston2',
    network: 'coston2',
    nativeCurrency: {
        name: 'C2FLR',
        symbol: 'C2FLR',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://coston2-api.flare.network/ext/C/rpc'],
        },
        public: {
            http: ['https://coston2-api.flare.network/ext/C/rpc'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Coston2 Explorer',
            url: 'https://coston2-explorer.flare.network',
        },
    },
});
