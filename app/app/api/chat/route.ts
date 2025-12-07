import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, data } = await req.json();

    const context = data || {};

    const systemPrompt = `
    You are RippleLens AI, an expert DeFi assistant on the Flare Network.
    
    User Stats:
    - Collateral: ${context.collateral} FXRP
    - Debt: ${context.debt} FXRP
    - Risk: ${context.risk}
    - Health: ${context.health}
    - Price: ${context.price} USD

    Guidelines:
    1. Keep answers short (max 2 sentences).
    2. Be helpful but warn if Risk is HIGH.
  `;

    const result = await streamText({
        model: google('gemini-1.5-flash'), // Free and fast model
        system: systemPrompt,
        messages,
    });

    return result.toTextStreamResponse();

}
