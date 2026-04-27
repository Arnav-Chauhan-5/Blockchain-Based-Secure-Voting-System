import { BrowserProvider } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { getChainId } from "@/web3/chain";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.ethereum) {
      setError("No injected wallet");
      setAddress(null);
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[];
      setAddress(accounts[0] ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const eth = window.ethereum;
    if (!eth?.on) return;
    const handler = () => void refresh();
    eth.on("accountsChanged", handler);
    eth.on("chainChanged", handler);
    return () => {
      eth.removeListener?.("accountsChanged", handler);
      eth.removeListener?.("chainChanged", handler);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No injected wallet");
      return null;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${getChainId().toString(16)}` }],
      });
    } catch {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${getChainId().toString(16)}`,
              chainName: "Hardhat Local",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
      } catch {
        /* ignore */
      }
    }
    const accounts = (await window.ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];
    const addr = accounts[0] ?? null;
    setAddress(addr);
    setError(null);
    return addr;
  }, []);

  return { address, error, connect, refresh };
}

export async function getSigner() {
  if (!window.ethereum) throw new Error("No wallet");
  const provider = new BrowserProvider(window.ethereum);
  return provider.getSigner();
}
