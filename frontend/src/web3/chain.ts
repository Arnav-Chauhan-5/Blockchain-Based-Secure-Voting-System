const envChainId = Number(import.meta.env.VITE_CHAIN_ID ?? 31337);
const envContract = String(import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim();

let chainId = envChainId;
let contractAddress = envContract;

let bootstrapPromise: Promise<void> | null = null;

/**
 * Pull contract address + chain id from the relayer (`/api/config`) so redeploys do not require
 * editing frontend .env or restarting Vite. Falls back to VITE_* env vars.
 */
export function bootstrapWeb3FromApi(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  const base = import.meta.env.VITE_API_URL ?? "";
  bootstrapPromise = (async () => {
    try {
      const r = await fetch(`${base}/api/config`);
      if (!r.ok) return;
      const j = (await r.json()) as {
        contractAddress?: string | null;
        chainId?: number;
      };
      if (j.contractAddress && j.contractAddress.startsWith("0x")) {
        contractAddress = j.contractAddress.trim();
      }
      if (typeof j.chainId === "number" && Number.isFinite(j.chainId)) {
        chainId = j.chainId;
      }
    } catch {
      /* keep VITE_* fallbacks */
    }
  })();
  return bootstrapPromise;
}

export function getChainId(): number {
  return chainId;
}

export function getContractAddress(): string {
  return contractAddress;
}

export const API_BASE = import.meta.env.VITE_API_URL ?? "";

export const RPC_URL = import.meta.env.VITE_RPC_URL ?? "http://127.0.0.1:8545";
