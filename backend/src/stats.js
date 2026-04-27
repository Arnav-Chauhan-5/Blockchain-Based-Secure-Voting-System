import { Contract, JsonRpcProvider } from "ethers";

const ABI = [
  "function tallies(uint256) view returns (uint256)",
  "function maxCandidateId() view returns (uint256)",
];

/**
 * Sum tallies across all candidate slots (total verified reveals on-chain).
 */
export async function sumVerifiedReveals(rpcUrl, contractAddress) {
  if (!contractAddress) return 0;
  const provider = new JsonRpcProvider(rpcUrl);
  const c = new Contract(contractAddress, ABI, provider);
  const max = await c.maxCandidateId();
  const maxN = Number(max);
  let sum = 0n;
  for (let i = 1; i <= maxN; i++) {
    sum += await c.tallies(i);
  }
  return Number(sum);
}
