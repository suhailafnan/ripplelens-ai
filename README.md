# 🌊 RippleLens AI: Intelligent DeFi on Flare

**A risk-aware lending & trading protocol powered by FTSO Oracle data and Generative AI.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Network](https://img.shields.io/badge/Network-Flare_Coston2-orange)
![AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-magenta)

---

## 🚀 The Problem
In decentralized finance (DeFi), users often fly blind. They borrow against volatile assets without understanding their real-time risk. Protocols allow users to take maximum leverage even when the market is crashing, leading to instant liquidations.

## 💡 The Solution: RippleLens AI
RippleLens acts as a **"Financial Bodyguard"**. It sits between the user and the smart contract, analyzing live market conditions to dynamically adjust risk parameters.

It is built on the **Flare Network** to leverage the native **FTSO (Flare Time Series Oracle)** for high-frequency, decentralized price feeds.

---

## 🛠️ Tech Stack

### Blockchain Layer
- **Network:** Flare Coston2 Testnet
- **Contracts:** Solidity (Custom `FxrpLendingPool.sol`, `FxrpToken.sol`)
- **Oracle:** Flare FTSO (Mock consumer for Testnet MVP)

### Application Layer
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Dark/Futuristic UI)
- **Web3 Hooks:** Wagmi / Viem / RainbowKit
- **State Management:** Zustand

### AI Layer
- **Model:** Google Gemini 1.5 Flash
- **SDK:** Vercel AI SDK (`ai` + `@ai-sdk/google`)
- **Technique:** RAG (Retrieval-Augmented Generation) via live context injection.



## ✨ Key Features

### 1. 🧠 Context-Aware AI Advisor
We don't just use a generic chatbot. We utilize **In-Context Learning (ICL)** to inject live blockchain state into **Google Gemini 1.5 Flash**.
- **Input:** User's Debt, Collateral, Health Factor, and live FTSO Price.
- **Output:** Tailored financial advice (e.g., *"Your health factor is 1.2. The market is volatile. Repay 50 FXRP immediately."*)

### 2. 🛡️ AI Risk Guardrails (The "Shield")
The most innovative feature. The AI analyzes market volatility over the last 50 blocks.
- **Low Risk:** User can borrow/trade up to **80%** of their limit.
- **High Risk:** If FTSO detects high variance, the AI **automatically restricts** the UI, capping trades at **20%** to prevent reckless behavior.

### 3. ⚡ Lightning Fast FTSO Integration
- We do not rely on centralized APIs (like CoinGecko) for contract logic.
- Price feeds are fetched directly from Flare's decentralized oracle for maximum security and uptime.

---
## 🛠️ Tech Stack & Flare Integration

This project is deeply integrated into the Flare Ecosystem, utilizing its core protocols to ensure decentralized, trustless, and data-driven operations.

### ☀️ Flare Network Native Protocols
*   **FTSO (Flare Time Series Oracle):**
    *   Used for: Real-time, decentralized price feeds (FXRP/USD) for the lending pool and AI analysis.
    *   Why: Ensures our liquidation logic and AI risk calculations are tamper-proof and not reliant on centralized APIs.
*   **FAssets (Flare Assets):**
    *   Used for: Bridging non-smart contract tokens (like XRP/FXRP) onto the Flare Network to be used as collateral.
    *   Why: Unlocks the liquidity of the XRP Ledger for DeFi use cases on Flare.
*   **FDC (Flare Data Connector):**
    *   Used for: Verifying off-chain state (attestation) to prove user creditworthiness or cross-chain interactions.
    *   Why: Allows the AI to trust data coming from external sources without needing a centralized bridge.

### ⛓️ Smart Contracts (Solidity)
*   **Custom Lending Protocol:** A bespoke lending pool contract (`FxrpLendingPool.sol`) optimized for the EVM.
*   **Risk Engine:** On-chain logic that interacts with the Oracle to calculate Health Factors and Liquidation Thresholds.
*   **Foundry / Hardhat:** Used for compiling, testing, and deploying contracts to the **Coston2 Testnet**.

### 🧠 AI & Data Layer
*   **Model:** Google Gemini 1.5 Flash (via Vercel AI SDK).
*   **In-Context Learning (ICL):** Dynamic injection of user wallet state (Debt, Collateral, Health) into the LLM context window.
*   **Risk Guardrails:** A deterministic logic layer that sits between the AI model and the UI to enforce safety limits based on FTSO volatility data.

### 💻 Frontend & Web3
*   **Next.js 14 (App Router):** High-performance React framework.
*   **Wagmi & Viem:** Type-safe Ethereum hooks for interacting with Flare smart contracts.
*   **RainbowKit:** Seamless wallet connection UI for Metamask and others.
*   **Tailwind CSS:** Responsive, dark-mode-first styling for a pro-trader interface.
*   **Recharts:** Visualization library for the live FTSO price chart.



---

## 📸 Screenshots

| Dashboard View | AI Risk Analysis |
|:---:|:---:|
| *(Add screenshot of your dashboard)* | *(Add screenshot of the chat/risk panel)* |

---

## 🏗️ Installation & Setup

1. **Clone the repository**


git clone https://github.com/suhailafnan/ripplelens-ai.git
cd ripplelens-ai



2. **Install Dependencies**


3. **Configure Environment**
Create a `.env.local` file:



4. **Run the Development Server**


## 🧠 How the AI Was "Trained"
*Note for Judges: We did not fine-tune a model, which introduces latency. We used System Prompt Engineering to create a deterministic reasoning engine.*

The AI operates on a strictly defined **Risk Matrix**:

| Metric | Condition | AI Action |
| :--- | :--- | :--- |
| **Volatility (σ)** | `< 0.5%` | Status: **LOW**. Allow aggressive leverage. |
| **Volatility (σ)** | `> 2.0%` | Status: **HIGH**. Restrict borrowing. |
| **Health Factor** | `< 1.5` | **WARN USER**. Advise repayment. |
| **Health Factor** | `< 1.1` | **CRITICAL**. AI suggests immediate close. |

---

## 📜 Smart Contracts

- **FXRP Token:** `0xa7234f78c1fBD8b7d048c8aFF132fbefB28D9672​` (Mock bridged token)
- **Lending Pool:** `0xf35dCC5855B2876473c10b244d4f1dBCeBA23092` (Handles Deposit/Borrow logic)
- **Oracle Consumer:** `0xa620010608330770b31abD5Df2A189B51725C2bC` (Reads FTSO prices)

---

## 🔮 Future Roadmap

- [ ] **Mainnet Launch:** Deploy on Flare Mainnet.
- [ ] **Automated De-Leveraging:** Allow the AI to sign transactions (with user intent) to auto-repay debt before liquidation.
- [ ] **Multi-Asset Support:** Add FLR, USDC, and WETH markets.

---

## 🏆 Hackathon Context
Built for the **Flare Hackathon**.
*Focus Area:* DeFi & AI Integration.

*RippleLens AI demonstrates that DeFi doesn't have to be dangerous. By combining the transparency of blockchain with the intelligence of AI, we make finance safer for everyone.*

ppt link : https://docs.google.com/presentation/d/1wbVSz61f4J6gW7bxt_q_GHdJKGxGie4giKNHdtxt2xI/edit?usp=sharing

demo video link : https://drive.google.com/file/d/1xFm4uIJ6My4-s--k8KxN8t8MWtPF2MMC/view?usp=sharing
