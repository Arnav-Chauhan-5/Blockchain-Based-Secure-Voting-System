import { keccak256, solidityPacked, randomBytes, hexlify } from "ethers";

export function computeCommitment(candidateId: bigint, secret: string): string {
  const s = secret.startsWith("0x") ? secret : `0x${secret}`;
  return keccak256(solidityPacked(["uint256", "bytes32"], [candidateId, s]));
}

export function generateSecretHex(): string {
  return hexlify(randomBytes(32));
}
