import { verifyTypedData } from "ethers";

export const DOMAIN_NAME = "BlindVote";
export const DOMAIN_VERSION = "1";

export const COMMIT_VOTE_TYPES = {
  CommitVote: [
    { name: "commitment", type: "bytes32" },
    { name: "deadline", type: "uint256" },
    { name: "voter", type: "address" },
  ],
};

export function buildDomain(chainId, verifyingContract) {
  return {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chainId,
    verifyingContract,
  };
}

/**
 * @param {import('ethers').AddressLike} expectedVoter
 */
export function verifyCommitSignature(domain, commitment, deadline, expectedVoter, signature) {
  const value = {
    commitment,
    deadline: BigInt(deadline),
    voter: expectedVoter,
  };
  const recovered = verifyTypedData(domain, COMMIT_VOTE_TYPES, value, signature);
  return recovered.toLowerCase() === String(expectedVoter).toLowerCase();
}
