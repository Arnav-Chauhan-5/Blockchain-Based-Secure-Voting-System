const { expect } = require("chai");
const hre = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BlindVoteElection", function () {
  async function deployFixture() {
    const [deployer, sponsor, voter] = await hre.ethers.getSigners();
    const now = await time.latest();
    const commitDeadline = now + 1000;
    const revealDeadline = commitDeadline + 2000;
    const Factory = await hre.ethers.getContractFactory("BlindVoteElection");
    const election = await Factory.deploy(sponsor.address, commitDeadline, revealDeadline, 10);
    await election.waitForDeployment();
    return { election, deployer, sponsor, voter, commitDeadline, revealDeadline };
  }

  it("submits commit via sponsor with valid EIP-712 signature", async function () {
    const { election, sponsor, voter, commitDeadline } = await deployFixture();
    const candidateId = 3n;
    const secret = hre.ethers.randomBytes(32);
    const commitment = hre.ethers.keccak256(
      hre.ethers.solidityPacked(["uint256", "bytes32"], [candidateId, secret])
    );

    const domain = {
      name: "BlindVote",
      version: "1",
      chainId: hre.network.config.chainId,
      verifyingContract: await election.getAddress(),
    };

    const types = {
      CommitVote: [
        { name: "commitment", type: "bytes32" },
        { name: "deadline", type: "uint256" },
        { name: "voter", type: "address" },
      ],
    };

    const deadline = BigInt(commitDeadline) - 10n;
    const value = { commitment, deadline, voter: voter.address };

    const signature = await voter.signTypedData(domain, types, value);

    await expect(
      election.connect(sponsor).submitCommit(voter.address, commitment, deadline, signature)
    ).to.emit(election, "CommitSubmitted");

    expect(await election.commitments(voter.address)).to.equal(commitment);
  });

  it("reveals and tallies after commit window", async function () {
    const { election, sponsor, voter, commitDeadline, revealDeadline } = await deployFixture();
    const candidateId = 2n;
    const secret = hre.ethers.randomBytes(32);
    const commitment = hre.ethers.keccak256(
      hre.ethers.solidityPacked(["uint256", "bytes32"], [candidateId, secret])
    );

    const domain = {
      name: "BlindVote",
      version: "1",
      chainId: hre.network.config.chainId,
      verifyingContract: await election.getAddress(),
    };
    const types = {
      CommitVote: [
        { name: "commitment", type: "bytes32" },
        { name: "deadline", type: "uint256" },
        { name: "voter", type: "address" },
      ],
    };
    const deadline = BigInt(commitDeadline) - 5n;
    const signature = await voter.signTypedData(domain, types, {
      commitment,
      deadline,
      voter: voter.address,
    });

    await election.connect(sponsor).submitCommit(voter.address, commitment, deadline, signature);

    await time.increaseTo(Number(commitDeadline) + 1);

    await expect(election.connect(voter).reveal(candidateId, secret))
      .to.emit(election, "VoteRevealed")
      .withArgs(voter.address, candidateId);

    expect(await election.tallies(candidateId)).to.equal(1n);
    expect(await election.commitments(voter.address)).to.equal(hre.ethers.ZeroHash);
  });
});
