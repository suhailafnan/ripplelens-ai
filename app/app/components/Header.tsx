'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
    return (
        <header className="w-full border-b border-slate-800 bg-slate-900/80">
            <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">RippleLens AI</span>
                    <span className="text-xs text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                        FXRP Lending on Flare
                    </span>
                </div>
                <ConnectButton />
            </div>
        </header>
    );
}
