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

export default function Home() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();

  const {
    data: fxrpBalance,
    status: balanceStatus,
    error: balanceError,
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
    error: userStateError,
  } = useReadContract({
    address: LENDING_POOL_ADDRESS as `0x${string}`,
    abi: lendingAbi,
    functionName: 'getUserState',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  }) as {
    data: UserStateTuple | undefined;
    status: 'idle' | 'pending' | 'success' | 'error';
    error: any;
  };

  useEffect(() => {
    console.log('FXRP read:', { balanceStatus, fxrpBalance, balanceError });
    console.log('UserState read:', { userStateStatus, userState, userStateError });
  }, [balanceStatus, fxrpBalance, balanceError, userStateStatus, userState, userStateError]);

  const collateral = userState?.[0] ?? 0n;
  const debt = userState?.[1] ?? 0n;
  const score = userState?.[2] ?? 0;
  const price = userState?.[3] ?? 0n;
  const health = userState?.[4] ?? 0n;

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

  const [side, setSide] = useState<'long' | 'short'>('long');
  const [sizeInput, setSizeInput] = useState('0');
  const [entryPrice, setEntryPrice] = useState<number | null>(null);

  const currentPrice = fxrpPrice;

  const canOpen =
    !!address &&
    !isPending &&
    Number(sizeInput) > 0 &&
    entryPrice === null;

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
          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2">
              Your FXRP position
            </h2>
            {!address && (
              <p className="text-sm text-slate-400">
                Connect your wallet on C2FLR to see your position.
              </p>
            )}
            {address && (
              <div className="space-y-2 text-sm">
                <p className="text-slate-400 break-all">
                  Address:{' '}
                  <span className="text-slate-200">{address}</span>
                </p>
                <p>
                  FXRP wallet balance:{' '}
                  <span className="text-sky-300">
                    {balanceStatus === 'pending'
                      ? '...'
                      : fxrpBalance !== undefined
                        ? format(fxrpBalance as bigint).toFixed(4)
                        : '0.0000'}{' '}
                    FXRP
                  </span>
                </p>
                <p>
                  Collateral in pool:{' '}
                  <span className="text-emerald-300">
                    {userStateStatus === 'pending'
                      ? '...'
                      : format(collateral).toFixed(4)}{' '}
                    FXRP
                  </span>
                </p>
                <p>
                  Debt:{' '}
                  <span className="text-rose-300">
                    {userStateStatus === 'pending'
                      ? '...'
                      : format(debt).toFixed(4)}{' '}
                    FXRP
                  </span>
                </p>
                <p>
                  Reputation score:{' '}
                  <span className="text-amber-300">
                    {userStateStatus === 'pending'
                      ? '...'
                      : Number(score)}
                  </span>
                </p>
                <p>
                  Health factor:{' '}
                  <span className="text-sky-300">
                    {health === 0n
                      ? '∞'
                      : (Number(health) / 1e18).toFixed(2)}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Price (FXRP/USD):{' '}
                  {userStateStatus === 'pending'
                    ? '...'
                    : fxrpPrice.toFixed(4)}{' '}
                  (on-chain)
                </p>
              </div>
            )}
          </div>

          <div className="border border-slate-800 bg-slate-900/70 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-2">
              Quick actions
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              These buttons call the on-chain lending pool. In the full
              RippleLens A version this panel will be AI-guided.
            </p>
            <div className="space-y-3 text-sm">
              <button
                onClick={() => approve(100n * oneFxrp)}
                disabled={!address || isPending}
                className="w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 disabled:opacity-50"
              >
                Approve 100 FXRP to pool
              </button>
              <button
                onClick={() => deposit(100n * oneFxrp)}
                disabled={!address || isPending}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 disabled:opacity-50"
              >
                Deposit 100 FXRP
              </button>
              <button
                onClick={() => borrow(30n * oneFxrp)}
                disabled={!address || isPending}
                className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 py-2 disabled:opacity-50"
              >
                Borrow 30 FXRP
              </button>
              <button
                onClick={() => repay(10n * oneFxrp)}
                disabled={!address || isPending}
                className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2 disabled:opacity-50"
              >
                Repay 10 FXRP
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl w-full px-4 mt-8">
          <div className="bg-black text-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                RippleLens A – Trading (MVP)
              </h2>
              <span className="text-xs text-gray-400">
                Simulated mockFXRP trades with on-chain price
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400">
                    Market
                  </span>
                  <div className="text-base font-medium">
                    mockFXRP / FXRP
                  </div>
                  <div className="text-xs text-gray-400">
                    Current price: {fxrpPrice.toFixed(4)} USD
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setSide('long')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${side === 'long'
                        ? 'bg-emerald-500 text-black'
                        : 'bg-slate-800 text-slate-200'
                      }`}
                  >
                    Long
                  </button>
                  <button
                    onClick={() => setSide('short')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${side === 'short'
                        ? 'bg-rose-500 text-black'
                        : 'bg-slate-800 text-slate-200'
                      }`}
                  >
                    Short
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    Position size (mockFXRP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleOpen}
                    disabled={!canOpen}
                    className="flex-1 rounded-lg bg-sky-600 hover:bg-sky-500 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Open position
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={!canClose}
                    className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Close position
                  </button>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status</span>
                  <span className="font-semibold">
                    {entryPrice === null ? 'No open position' : 'Open'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Entry price</span>
                  <span>
                    {entryPrice === null
                      ? '-'
                      : entryPrice.toFixed(4) + ' USD'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Current price</span>
                  <span>{currentPrice.toFixed(4)} USD</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Unrealized PnL</span>
                  <span
                    className={
                      currentPnl > 0
                        ? 'text-emerald-400'
                        : currentPnl < 0
                          ? 'text-rose-400'
                          : 'text-slate-100'
                    }
                  >
                    {currentPnl.toFixed(4)} FXRP
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  In the full version, this panel will add AI-based risk checks
                  before opening trades and display lender/protocol profit share.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
