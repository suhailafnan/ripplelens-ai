'use client';

import { Header } from './components/Header';
import { Footer } from './components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <Header />

      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl w-full px-4">
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2">
              Your AI DeFi Room
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Soon this space will show your FXRP collateral, health, and AI assistant chat.
            </p>
            <div className="h-40 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-sm">
              Coming next: Lending dashboard & AI assistant
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
