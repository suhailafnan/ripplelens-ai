import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['wagmi', '@wagmi/connectors', '@rainbow-me/rainbowkit', '@base-org/account', 'viem', '@tanstack/react-query'],
};

export default nextConfig;
