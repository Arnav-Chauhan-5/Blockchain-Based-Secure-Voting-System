import { Contract, JsonRpcProvider, Wallet } from "ethers";

const ABI = [
  "function submitCommit(address voter, bytes32 commitment, uint256 deadline, bytes signature) external",
  "function commitments(address) view returns (bytes32)",
];

export function createRelayer(rpcUrl, sponsorPk, contractAddress) {
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(sponsorPk, provider);
  const contract = new Contract(contractAddress, ABI, wallet);
  return { provider, wallet, contract };
}
