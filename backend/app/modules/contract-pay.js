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
      signerAddress +
      "," +
      recipientAddress +
      "," +
      amount +
      "," +
      textMessage;
    console.log(" ......... toBeSignedMessage:", toBeSignedMessage);

    const hashedMessage = doKeccak256(toBeSignedMessage);
    console.log(" ......... hashedMessage:", hashedMessage);

    const recoveredAddress = ethers.verifyMessage(hashedMessage, signature);
    console.log("Signer address_:", recoveredAddress);
    if (recoveredAddress.toLowerCase() === signerAddress.toLowerCase()) {
      console.log("Signature is valid.");
    } else {
      console.log("Signature is not valid.");
      return {
        stat: false,
        msg: "Invalid Signature!",
      };
    }

    // if sender has enough fund
    const signerCredit = await getRGCredit(signerAddress);
    console.log(" ......... signer current Credit:", signerCredit);
    if (!signerCredit || signerCredit < 1 || signerCredit < amount) {
      return {
        stat: false,
        msg: "Insuficient fund!",
      };
    }

    // decrease signer/sender credit
    await updateCredit(signerAddress, signerCredit - amount);

    // increase/create reciever cradit
    await upsertCredit(recipientAddress, amount);   // test address 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

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
