const { ethers } = require("ethers");

const { doKeccak256 } = require("../merkle-engine");
const { insertTxLog } = require("../entity/rg_transaction_log");

const {
  getRGCredit,
  updateCredit,
  upsertCredit,
} = require("../entity/rg_balances");

async function doTransferFund(
  timestamp,
  signerAddress,
  amount,
  recipientAddress,
  textMessage,
  signature
) {
  try {
    console.log(" ......... signature:", signature);

    if (amount < 1)
      return {
        stat: false,
        msg: "Invalid Amount!",
      };

    let toBeSignedMessage =
      timestamp +
      "," +
      signerAddress.toLowerCase() +
      "," +
      recipientAddress.toLowerCase() +
      "," +
      amount +
      "," +
      textMessage;
    console.log(" ......... toBeSignedMessage:", toBeSignedMessage);

    //const messageBytes = ethers.toUtf8Bytes(toBeSignedMessage);
    const hashedMessage = doKeccak256(toBeSignedMessage);
    console.log(" ......... hashedMessage:", hashedMessage);

    try {
      const recoveredAddress = ethers.verifyMessage(toBeSignedMessage, signature);
      console.log("Signer address_A:", recoveredAddress);
      if (recoveredAddress.toLowerCase() === signerAddress.toLowerCase()) {
        console.log("Signature is valid.");
      } else {
        console.log(
          "Signature is not valid.",
          recoveredAddress.toLowerCase(),
          signerAddress.toLowerCase()
        );
        return {
          stat: false,
          msg: "Invalid Signature!",
        };
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      return {
        stat: false,
        msg: "Error verifying signature: " + error.message,
      };
    }

    // if sender has enough fund
    const { _, currentBalance } = await getRGCredit(signerAddress);
    console.log(" ......... signer current Credit:", currentBalance);
    if (!currentBalance || currentBalance < 1 || currentBalance < amount) {
      return {
        stat: false,
        msg: "Insuficient fund!",
      };
    }

    // decrease signer/sender credit
    await updateCredit(signerAddress, currentBalance - amount);

    // increase/create reciever credit
    console.log("+++++++++ xxxxxx address", recipientAddress.toLowerCase());
    const { __, creditorCurrentBalance } = await getRGCredit(recipientAddress.toLowerCase());
    const safeCurrentBalance = creditorCurrentBalance ? BigInt(creditorCurrentBalance) : BigInt(0);
    const safeAmount = amount ? BigInt(amount) : BigInt(0);
    const newBalance = (safeCurrentBalance + safeAmount).toString();
    await upsertCredit(recipientAddress, newBalance);

    // log transaction
    await insertTxLog(
      signerAddress,
      recipientAddress,
      amount,
      toBeSignedMessage,
      signature
    );

    return {
      stat: true,
      msg: "Transaction done.",
    };
  } catch (err) {
    console.error("Error in internal transfering fund:", err);
    return false;
  }
}

module.exports = {
  doTransferFund,
};
