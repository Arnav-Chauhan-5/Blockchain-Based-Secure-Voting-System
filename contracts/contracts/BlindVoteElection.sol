// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title BlindVoteElection
 * @notice Commit–reveal voting where only a designated sponsor may submit commitments
 *         on-chain; commitments bind keccak256(abi.encodePacked(candidateId, secret)).
 */
contract BlindVoteElection is EIP712 {
    using ECDSA for bytes32;

    bytes32 private constant COMMIT_VOTE_TYPEHASH =
        keccak256("CommitVote(bytes32 commitment,uint256 deadline,address voter)");

    address public immutable sponsor;
    uint256 public immutable commitDeadline;
    uint256 public immutable revealDeadline;
    uint256 public immutable maxCandidateId;

    mapping(address voter => bytes32 commitment) public commitments;
    mapping(uint256 candidateId => uint256 tally) public tallies;

    event CommitSubmitted(address indexed voter, bytes32 commitment);
    event VoteRevealed(address indexed voter, uint256 candidateId);

    error OnlySponsor();
    error CommitWindowClosed();
    error RevealWindowClosed();
    error RevealNotOpen();
    error AlreadyCommitted();
    error NoCommitment();
    error InvalidCandidate();
    error CommitmentMismatch();
    error BadSignature();
    error SignatureExpired();

    modifier onlySponsor() {
        if (msg.sender != sponsor) revert OnlySponsor();
        _;
    }

    constructor(
        address sponsor_,
        uint256 commitDeadline_,
        uint256 revealDeadline_,
        uint256 maxCandidateId_
    ) EIP712("BlindVote", "1") {
        require(sponsor_ != address(0), "BlindVote: zero sponsor");
        require(commitDeadline_ < revealDeadline_, "BlindVote: bad windows");
        require(maxCandidateId_ > 0, "BlindVote: zero max");
        sponsor = sponsor_;
        commitDeadline = commitDeadline_;
        revealDeadline = revealDeadline_;
        maxCandidateId = maxCandidateId_;
    }

    function submitCommit(
        address voter,
        bytes32 commitment,
        uint256 deadline,
        bytes calldata signature
    ) external onlySponsor {
        if (block.timestamp > commitDeadline) revert CommitWindowClosed();
        if (block.timestamp > deadline) revert SignatureExpired();
        if (commitments[voter] != bytes32(0)) revert AlreadyCommitted();

        bytes32 structHash = keccak256(abi.encode(COMMIT_VOTE_TYPEHASH, commitment, deadline, voter));
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        if (recovered != voter) revert BadSignature();

        commitments[voter] = commitment;
        emit CommitSubmitted(voter, commitment);
    }

    function reveal(uint256 candidateId, bytes32 secret) external {
        if (block.timestamp <= commitDeadline) revert RevealNotOpen();
        if (block.timestamp > revealDeadline) revert RevealWindowClosed();

        bytes32 stored = commitments[msg.sender];
        if (stored == bytes32(0)) revert NoCommitment();
        if (candidateId == 0 || candidateId > maxCandidateId) revert InvalidCandidate();

        bytes32 check = keccak256(abi.encodePacked(candidateId, secret));
        if (check != stored) revert CommitmentMismatch();

        commitments[msg.sender] = bytes32(0);
        tallies[candidateId] += 1;
        emit VoteRevealed(msg.sender, candidateId);
    }

    function commitmentDigest(bytes32 commitment, uint256 deadline, address voter) external view returns (bytes32) {
        bytes32 structHash = keccak256(abi.encode(COMMIT_VOTE_TYPEHASH, commitment, deadline, voter));
        return _hashTypedDataV4(structHash);
    }
}
