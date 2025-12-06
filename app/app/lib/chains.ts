import { defineChain } from 'viem';

export const c2flr = defineChain({
    id: 114, // actual C2FLR chain ID here
    name: 'C2FLR Testnet',
    network: 'c2flr',
    nativeCurrency: {
        name: 'Flare Testnet',
        symbol: 'C2FLR',
        decimals: 18,
    },
    rpcUrls: {
        default: { http: ['https://c2.flare.network'] },
        public: { http: ['https://c2.flare.network'] },
    },
    blockExplorers: {
        default: {
            name: 'C2FLR Explorer',
            url: 'https://c2-testnet-explorer.flare.network', // use actual URL if different
        },
    },
});
