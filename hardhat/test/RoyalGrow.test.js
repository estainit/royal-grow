const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoyalGrow - doWithdraw", function () {
  let RoyalGrow;
  let royalGrow;
  let owner;
  let user;
  let user2;
  let amount;
  let message;
  let signature;

  beforeEach(async function () {
    // Get signers
    [owner, user, user2] = await ethers.getSigners();

    // Deploy contract
    RoyalGrow = await ethers.getContractFactory("RoyalGrow");
    royalGrow = await RoyalGrow.deploy();
    await royalGrow.deployed();

    // Setup test data
    amount = ethers.utils.parseEther("1.0"); // 1 ETH
    message = "test withdrawal";
  });

  describe("Successful withdrawal", function () {
    beforeEach(async function () {
      // Create signature
      const msgToBeSigned = "withdraw" + message;
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));
    });

    it("should process a valid withdrawal", async function () {
      // Send transaction
      const tx = await royalGrow.connect(user).doWithdraw(
        message,
        amount,
        user.address.toLowerCase(),
        signature
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Check if WithdrawAttempt event was emitted
      const event = receipt.events.find(e => e.event === "WithdrawAttempt");
      expect(event).to.not.be.undefined;
      expect(event.args.user).to.equal(user.address);
      expect(event.args.amount).to.equal(amount);
      expect(event.args.message).to.equal(message);
      expect(event.args.success).to.be.true;
    });

    it("should handle multiple withdrawals from same user", async function () {
      // First withdrawal
      await royalGrow.connect(user).doWithdraw(
        message,
        amount,
        user.address.toLowerCase(),
        signature
      );

      // Second withdrawal with different message
      const newMessage = "second withdrawal";
      const newMsgToBeSigned = "withdraw" + newMessage;
      const newMsgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(newMsgToBeSigned));
      const newSignature = await user.signMessage(ethers.utils.arrayify(newMsgHash));

      const tx = await royalGrow.connect(user).doWithdraw(
        newMessage,
        amount,
        user.address.toLowerCase(),
        newSignature
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WithdrawAttempt");
      expect(event.args.success).to.be.true;
    });
  });

  describe("Failed withdrawal attempts", function () {
    it("should reject withdrawal with invalid signature", async function () {
      const invalidSignature = "0x" + "1".repeat(130);

      await expect(
        royalGrow.connect(user).doWithdraw(
          message,
          amount,
          user.address.toLowerCase(),
          invalidSignature
        )
      ).to.be.revertedWith("Invalid signature");
    });

    it("should reject withdrawal with wrong signer address", async function () {
      const msgToBeSigned = "withdraw" + message;
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));

      await expect(
        royalGrow.connect(user2).doWithdraw(
          message,
          amount,
          user2.address.toLowerCase(),
          signature
        )
      ).to.be.revertedWith("Invalid signature");
    });

    it("should reject withdrawal with zero amount", async function () {
      const msgToBeSigned = "withdraw" + message;
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));

      await expect(
        royalGrow.connect(user).doWithdraw(
          message,
          0,
          user.address.toLowerCase(),
          signature
        )
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should reject withdrawal with empty message", async function () {
      const msgToBeSigned = "withdraw";
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));

      await expect(
        royalGrow.connect(user).doWithdraw(
          "",
          amount,
          user.address.toLowerCase(),
          signature
        )
      ).to.be.revertedWith("Message cannot be empty");
    });
  });

  describe("Edge cases", function () {
    it("should handle very large amounts", async function () {
      const largeAmount = ethers.utils.parseEther("1000000"); // 1M ETH
      const msgToBeSigned = "withdraw" + message;
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));

      const tx = await royalGrow.connect(user).doWithdraw(
        message,
        largeAmount,
        user.address.toLowerCase(),
        signature
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WithdrawAttempt");
      expect(event.args.success).to.be.true;
    });

    it("should handle very long messages", async function () {
      const longMessage = "a".repeat(1000); // 1000 character message
      const msgToBeSigned = "withdraw" + longMessage;
      const msgHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(msgToBeSigned));
      signature = await user.signMessage(ethers.utils.arrayify(msgHash));

      const tx = await royalGrow.connect(user).doWithdraw(
        longMessage,
        amount,
        user.address.toLowerCase(),
        signature
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "WithdrawAttempt");
      expect(event.args.success).to.be.true;
    });
  });
}); 