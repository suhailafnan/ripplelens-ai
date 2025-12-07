import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';

const coston2 = defineChain({
    id: 114,
    name: 'Flare Testnet Coston2',
    nativeCurrency: { name: 'C2FLR', symbol: 'C2FLR', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://coston2-api.flare.network/ext/C/rpc'] },
    },
});

// Oracle consumer ABI (only getFxrpPrice)
const oracleAbi = [
    {
        type: 'function',
        name: 'getFxrpPrice',
        stateMutability: 'view',
        inputs: [],
        outputs: [
            { name: 'price', type: 'uint256' },
            { name: 'decimals', type: 'uint8' },
            { name: 'timestamp', type: 'uint256' },
        ],
    },
];

const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_FXRP_ORACLE_CONSUMER as `0x${string}`;

const client = createPublicClient({
    chain: coston2,
    transport: http('https://coston2-api.flare.network/ext/C/rpc'),
});

export async function GET() {
    try {
        if (!ORACLE_ADDRESS) {
            return NextResponse.json(
                { error: 'Oracle address not configured' },
                { status: 500 }
            );
        }

        const [price, decimals, ts] = (await client.readContract({
            address: ORACLE_ADDRESS,
            abi: oracleAbi,
            functionName: 'getFxrpPrice',
            args: [],
        })) as [bigint, number, bigint];

        const p = Number(price) / 10 ** decimals;
        const timestamp = Number(ts);

        return NextResponse.json({
            price: p,
            decimals,
            timestamp,
        });
    } catch (e) {
        console.error('fxrp-price error', e);
        // Fallback for demo: 1.0 with timestamp
        return NextResponse.json(
            {
                price: 1.0,
                decimals: 18,
                timestamp: Math.floor(Date.now() / 1000),
            },
            { status: 200 }
        );
    }
}
