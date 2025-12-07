'use client';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import {
  FXRP_TOKEN_ADDRESS,
  LENDING_POOL_ADDRESS,
} from './lib/contracts';
import fxrpAbiJson from './lib/abiFxrp.json';
import lendingAbiJson from './lib/abiLending.json';
import type { Abi } from 'viem';
import { useState, useMemo, useEffect } from 'react';

const fxrpAbi = fxrpAbiJson as Abi;
const lendingAbi = lendingAbiJson as Abi;

// collateral, debt, score, price, health
type UserStateTuple = readonly [bigint, bigint, number, bigint, bigint];

// price history for chart
type PricePoint = { t: number; p: number };

export default function Home() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  // --- 1. On-Chain Data Hooks ---
  const {
    data: fxrpBalance,
    status: balanceStatus,
  } = useReadContract({
    address: FXRP_TOKEN_ADDRESS as `0x${string}`,
    abi: fxrpAbi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  });

  const {
    data: userState,
    status: userStateStatus,
  } = useReadContract({
    address: LENDING_POOL_ADDRESS as `0x${string}`,
    abi: lendingAbi,
    functionName: 'getUserState',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  }) as {
    data: UserStateTuple | undefined;
    status: 'idle' | 'pending' | 'success' | 'error';
  };

  const collateral = userState?.[0] ?? 0n;
  const debt = userState?.[1] ?? 0n;
  const score = userState?.[2] ?? 0;
  const health = userState?.[4] ?? 0n;

  // --- 2. Action Functions ---
  function approve(amount: bigint) {
    if (!address) return;
    writeContract({
      address: FXRP_TOKEN_ADDRESS as `0x${string}`,
      abi: fxrpAbi,
      functionName: 'approve',
      args: [LENDING_POOL_ADDRESS, amount],
    });
  }

  function deposit(amount: bigint) {
    if (!address) return;
    writeContract({
      address: LENDING_POOL_ADDRESS as `0x${string}`,
      abi: lendingAbi,
      functionName: 'depositCollateral',
      args: [amount],
    });
  }

  function borrow(amount: bigint) {
    if (!address) return;
    writeContract({
      address: LENDING_POOL_ADDRESS as `0x${string}`,
      abi: lendingAbi,
      functionName: 'borrow',
      args: [amount],
    });
  }

  function repay(amount: bigint) {
    if (!address) return;
    writeContract({
      address: LENDING_POOL_ADDRESS as `0x${string}`,
      abi: lendingAbi,
      functionName: 'repay',
      args: [amount],
    });
  }

  const oneFxrp = 10n ** 18n;
  const format = (v: bigint) => Number(v) / Number(oneFxrp);

  const fxrpPrice = useMemo(() => {
    if (!userState) return 1.0;
    const raw = userState[3];
    if (raw === 0n) return 1.0;
    return Number(raw) / 1e18;
  }, [userState]);

  // --- 3. Chart & Risk State ---
  const [showChart, setShowChart] = useState(false);
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

  useEffect(() => {
    if (!showChart) return;
    let interval: NodeJS.Timeout;

    const fetchPrice = async () => {
      try {
        const res = await fetch('/api/fxrp-price');
        const data = await res.json();
        // Convert timestamp (seconds) to ms
        const point: PricePoint = {
          t: data.timestamp * 1000,
          p: data.price as number,
        };

        setPrices((prev) => {
          const next = [...prev, point].slice(-50);
          if (next.length >= 5) {
            const ps = next.map((x) => x.p);
            const min = Math.min(...ps);
            const max = Math.max(...ps);
            const mid = (min + max) / 2 || 1;
            const vol = (max - min) / mid;
            if (vol < 0.005) setRiskLevel('LOW');
            else if (vol < 0.02) setRiskLevel('MEDIUM');
            else setRiskLevel('HIGH');
          }
          return next;
        });
      } catch (e) {
        console.error('price fetch error', e);
      }
    };

    fetchPrice();
    interval = setInterval(fetchPrice, 5000);

    return () => clearInterval(interval);
  }, [showChart]);

  // --- 4. Trading Sim State ---
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [sizeInput, setSizeInput] = useState('0');
  const [entryPrice, setEntryPrice] = useState<number | null>(null);

  const currentPrice = fxrpPrice;

  const canOpen =
    !!address &&
    !isPending &&
    Number(sizeInput) > 0 &&
    entryPrice === null &&
    riskLevel !== 'HIGH';

  const canClose = entryPrice !== null && !!address && !isPending;

  const currentPnl = useMemo(() => {
    if (entryPrice === null) return 0;
    const size = Number(sizeInput) || 0;
    const diff =
      side === 'long'
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
    return diff * size;
  }, [entryPrice, currentPrice, sizeInput, side]);

  function handleOpen() {
    if (!canOpen) return;
    setEntryPrice(currentPrice);
  }

  function handleClose() {
    if (!canClose) return;
    setEntryPrice(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-start py-8">
        <div className="max-w-5xl w-full px-4 grid md:grid-cols-2 gap-6">

          {/* LEFT: User State Panel */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              Your FXRP position
            </h2>
            {!address && (
              <p className="text-sm text-slate-400">
                Connect your wallet on C2FLR to see your position.
              </p>
            )}
            {address && (
              <div className="space-y-3 text-sm">
                <p className="text-slate-400 break-all text-xs">
                  Address: <span className="text-slate-200">{address}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Wallet Balance</p>
                    <p className="text-sky-300 font-mono text-lg">
                      {balanceStatus === 'pending'
                        ? '...'
                        : fxrpBalance !== undefined
                          ? format(fxrpBalance as bigint).toFixed(2)
                          : '0.00'}{' '}
                      <span className="text-sm">FXRP</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Collateral</p>
                    <p className="text-emerald-300 font-mono text-lg">
                      {userStateStatus === 'pending'
                        ? '...'
                        : format(collateral).toFixed(2)}{' '}
                      <span className="text-sm">FXRP</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Debt</p>
                    <p className="text-rose-300 font-mono text-lg">
                      {userStateStatus === 'pending'
                        ? '...'
                        : format(debt).toFixed(2)}{' '}
                      <span className="text-sm">FXRP</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Health Factor</p>
                    <p className={`font-mono text-lg ${health > 1500000000000000000n ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {health === 0n
                        ? '∞'
                        : (Number(health) / 1e18).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-500 mr-2">Reputation:</span>
                    <span className="text-amber-300 font-bold">
                      {userStateStatus === 'pending' ? '...' : Number(score)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mr-2">On-chain Price:</span>
                    <span className="text-slate-200 font-mono">
                      ${fxrpPrice.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Quick Actions Panel */}
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              Lending Pool
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Interact with FxrpLendingPool on Coston2.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Increased to 1000 FXRP for convenience as requested */}
              <button
                onClick={() => approve(1000n * oneFxrp)}
                disabled={!address || isPending}
                className="col-span-2 rounded-lg bg-slate-800 hover:bg-slate-700 py-3 font-medium disabled:opacity-50 transition-colors text-slate-200"
              >
                1. Approve 1000 FXRP
              </button>
              <button
                onClick={() => deposit(100n * oneFxrp)}
                disabled={!address || isPending}
                className="rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800 py-3 font-medium disabled:opacity-50 transition-colors"
              >
                2. Deposit 100
              </button>
              <button
                onClick={() => borrow(30n * oneFxrp)}
                disabled={!address || isPending}
                className="rounded-lg bg-sky-900/30 hover:bg-sky-900/50 text-sky-400 border border-sky-800 py-3 font-medium disabled:opacity-50 transition-colors"
              >
                3. Borrow 30
              </button>
              <button
                onClick={() => repay(10n * oneFxrp)}
                disabled={!address || isPending}
                className="col-span-2 rounded-lg bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-800 py-3 font-medium disabled:opacity-50 transition-colors"
              >
                4. Repay 10 FXRP
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM: Trading Panel (Black) */}
        <div className="max-w-5xl w-full px-4 mt-8 mb-12">
          <div className="bg-black border border-slate-800 text-white rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                RippleLens A – Active Trading
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChart((v) => !v)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  {showChart ? 'Hide Chart' : 'Show Chart'}
                </button>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${riskLevel === 'LOW'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${riskLevel === 'LOW' ? 'bg-emerald-400' : riskLevel === 'MEDIUM' ? 'bg-amber-400' : 'bg-rose-400'
                    }`}></div>
                  Risk: {riskLevel}
                </div>
              </div>
            </div>

            {/* Enhanced Chart with Time & Min/Max */}
            {showChart && (
              <div className="mb-4 border border-slate-800 rounded-xl p-4 bg-slate-900/30">
                {prices.length < 2 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                    <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading FXRP oracle feed...
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-2 px-1 font-mono">
                      <span>HIGH: {Math.max(...prices.map((p) => p.p)).toFixed(4)}</span>
                      <span>LOW: {Math.min(...prices.map((p) => p.p)).toFixed(4)}</span>
                    </div>

                    <svg viewBox="0 0 300 100" className="w-full h-40 mb-2 touch-none">
                      <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 2" />
                      <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 2" />
                      <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 2" />
                      {(() => {
                        const ps = prices;
                        const min = Math.min(...ps.map((x) => x.p));
                        const max = Math.max(...ps.map((x) => x.p));
                        const range = max - min || 0.0001;
                        const path = ps
                          .map((pt, i) => {
                            const x = (i / (ps.length - 1)) * 300;
                            const y = 90 - ((pt.p - min) / range) * 80;
                            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                          })
                          .join(' ');
                        return (
                          <path
                            d={path}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            className="drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                          />
                        );
                      })()}
                    </svg>

                    <div className="flex justify-between text-[10px] text-gray-500 px-1 font-mono">
                      <span>
                        {new Date(prices[0].t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-400">Live: ${prices[prices.length - 1].p.toFixed(4)}</span>
                      </div>
                      <span>
                        {new Date(prices[prices.length - 1].t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-xs text-gray-400 block mb-1">Market Pair</span>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-white">mockFXRP / USD</span>
                    <span className="text-xs text-gray-400 font-mono">
                      Oracle Price: {fxrpPrice.toFixed(4)} USD
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSide('long')}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${side === 'long'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setSide('short')}
                    className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${side === 'short'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'
                        : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    SHORT
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 ml-1">
                    Position Size (mockFXRP)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-white outline-none focus:border-sky-500 transition-colors placeholder-slate-600"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-3 text-xs text-slate-500">FXRP</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleOpen}
                    disabled={!canOpen}
                    className="flex-1 rounded-lg bg-sky-600 hover:bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-sky-900/20"
                  >
                    Open Trade
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={!canClose}
                    className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Close Trade
                  </button>
                </div>
              </div>

              <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 pb-2 border-b border-slate-800">
                    Position Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-mono font-semibold px-2 py-0.5 rounded ${entryPrice !== null ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                        {entryPrice === null ? 'CLOSED' : 'OPEN'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Entry Price</span>
                      <span className="font-mono text-slate-200">
                        {entryPrice === null
                          ? '-'
                          : entryPrice.toFixed(4) + ' USD'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Mark Price</span>
                      <span className="font-mono text-slate-200">{currentPrice.toFixed(4)} USD</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-800/50">
                      <span className="text-gray-400">Unrealized PnL</span>
                      <span
                        className={`font-mono font-bold ${currentPnl > 0
                            ? 'text-emerald-400'
                            : currentPnl < 0
                              ? 'text-rose-400'
                              : 'text-slate-500'
                          }`}
                      >
                        {currentPnl > 0 ? '+' : ''}{currentPnl.toFixed(4)} FXRP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-900/10 rounded-lg p-3 mt-4 border border-sky-900/20">
                  <p className="text-[10px] text-sky-400/80 leading-relaxed text-center">
                    <span className="font-bold">AI Risk Guard:</span> Trading disabled if volatility exceeds 2.0% (Risk: HIGH).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
