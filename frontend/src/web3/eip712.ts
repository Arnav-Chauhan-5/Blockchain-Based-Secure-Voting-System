import type { TypedDataDomain, TypedDataField } from "ethers";
import { getChainId, getContractAddress } from "./chain";

export const COMMIT_VOTE_TYPES: Record<string, TypedDataField[]> = {
  CommitVote: [
    { name: "commitment", type: "bytes32" },
    { name: "deadline", type: "uint256" },
    { name: "voter", type: "address" },
  ],
};

export function buildCommitDomain(): TypedDataDomain {
  const verifyingContract = getContractAddress();
  if (!verifyingContract) {
    throw new Error("Contract address not set (start backend + deploy, or set VITE_CONTRACT_ADDRESS)");
  }
  return {
    name: "BlindVote",
    version: "1",
    chainId: getChainId(),
    verifyingContract,
  };
}

export function commitDeadlineSeconds(fromNowSec: number): number {
  return Math.floor(Date.now() / 1000) + fromNowSec;
}
