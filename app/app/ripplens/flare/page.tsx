'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { connectFlareWallet } from '../../lib/wallets';

export default function RippleLensFlarePage() {
    const {
        flareConnected,
        flareAddress,
        setFlareConnected,
        setFlareAddress,
    } = useGameStore();

    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('flareAddress');
        if (stored && !flareAddress) {
            setFlareConnected(true);
            setFlareAddress(stored);
        }
    }, [flareAddress, setFlareAddress, setFlareConnected]);

    const handleConnect = async () => {
        setError(null);
        setConnecting(true);
        try {
            const { address } = await connectFlareWallet();
            setFlareConnected(true);
            setFlareAddress(address);
            if (typeof window !== 'undefined') {
                localStorage.setItem('flareAddress', address);
            }
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to connect Flare wallet');
        } finally {
            setConnecting(false);
        }
    };

    const shortAddress =
        flareAddress && flareAddress.length > 10
            ? `${flareAddress.slice(0, 6)}...${flareAddress.slice(-4)}`
            : flareAddress || '';

    return (
        <div className="min-h-screen bg-white text-black">
            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold">
                            RippleLens A – Flare Trading
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Risk-aware trading simulator on Flare&apos;s Coston2 testnet.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        {flareConnected && flareAddress ? (
                            <>
                                <span className="text-xs text-gray-500">
                                    Connected to Flare Coston2
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs bg-gray-900 text-white">
                                    {shortAddress}
                                </span>
                            </>
                        ) : (
                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-black text-white hover:bg-gray-900 disabled:opacity-60"
                            >
                                {connecting ? 'Connecting…' : 'Connect Flare Wallet'}
                            </button>
                        )}
                        {error && (
                            <span className="text-xs text-red-500 max-w-xs text-right">
                                {error}
                            </span>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)] gap-6">
                    <div className="bg-black text-white rounded-xl p-4 md:p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-semibold">Trading & Risk Panel</h2>
                            <span className="text-xs text-gray-400">
                                MVP – prices & logic simulated, Flare-oracle ready
                            </span>
                        </div>

                        <div className="border border-gray-700 rounded-lg h-48 flex items-center justify-center text-sm text-gray-400">
                            Price chart & risk meter will appear here (Phase 2)
                        </div>

                        <div className="mt-4">
                            <div className="flex gap-3 text-xs mb-3">
                                <span className="px-3 py-1 rounded-full bg-white text-black">
                                    Trade
                                </span>
                                <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                                    Lend
                                </span>
                                <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                                    Borrow
                                </span>
                                <span className="px-3 py-1 rounded-full bg-gray-800 text-gray-300">
                                    Profile
                                </span>
                            </div>

                            <div className="border border-gray-700 rounded-lg p-4 text-sm text-gray-300">
                                <p>
                                    Trading, lending, and borrowing controls will be wired here in the next phases.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 flex flex-col">
                        <h2 className="text-base font-semibold mb-2">RippleLens AI</h2>
                        <p className="text-xs text-gray-600 mb-3">
                            Ask about the market, risk level, or your positions. This panel will connect to Gemini / ChatGPT in a later phase.
                        </p>
                        <div className="flex-1 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
                            Chat UI will appear here (Phase 5)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}