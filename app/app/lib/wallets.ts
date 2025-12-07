'use client';

import { ethers } from 'ethers';

const FLARE_RPC = process.env.NEXT_PUBLIC_FLARE_RPC || 'https://coston2-api.flare.network/ext/C/rpc';

export async function connectFlareWallet() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No EVM wallet (MetaMask) found in this browser');
    }

    const provider = new ethers.BrowserProvider((window as any).ethereum);

    // Request accounts from MetaMask
    const accounts = await provider.send('eth_requestAccounts', []);
    if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in wallet');
    }

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    // Optional: just log for now
    console.log('Connected to Flare-like network:', network);

    return {
        provider,
        signer,
        address,
        network,
        rpcUrl: FLARE_RPC,
    };
}
