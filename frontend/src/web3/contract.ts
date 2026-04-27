import { Contract, JsonRpcProvider, type Signer } from "ethers";
import { getChainId, getContractAddress, RPC_URL } from "./chain";

const ABI = [
  "function commitments(address) view returns (bytes32)",
  "function tallies(uint256) view returns (uint256)",
  "function commitDeadline() view returns (uint256)",
  "function revealDeadline() view returns (uint256)",
  "function maxCandidateId() view returns (uint256)",
  "function reveal(uint256 candidateId, bytes32 secret) external",
] as const;

export function readProvider() {
  return new JsonRpcProvider(RPC_URL, getChainId());
}

export function electionContract(signerOrProvider: Signer | JsonRpcProvider) {
  const addr = getContractAddress();
  if (!addr) throw new Error("Contract address not configured");
  return new Contract(addr, ABI, signerOrProvider);
}

export async function readCommitRevealWindows(): Promise<{
  commitDeadline: bigint;
  revealDeadline: bigint;
} | null> {
  if (!getContractAddress()) return null;
  const provider = readProvider();
  const c = electionContract(provider);
  const [commitDeadline, revealDeadline] = await Promise.all([
    c.commitDeadline(),
    c.revealDeadline(),
  ]);
  return {
    commitDeadline: commitDeadline as bigint,
    revealDeadline: revealDeadline as bigint,
  };
}

export async function latestChainTimestamp(): Promise<number> {
  const provider = readProvider();
  const block = await provider.getBlock("latest");
  return Number(block?.timestamp ?? 0n);
}
