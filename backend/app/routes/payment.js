const express = require("express");
const router = express.Router();

const { ethers } = require("ethers");

const keccak256 = require("keccak256"); // Assuming you're using keccak256 library

const { doTransferFund } = require("../modules/contract-pay");
const { getRGCredit, upsertCredit, getAllCreditors, getSumAllCreditors } = require("../entity/rg_balances");

const {
  payToContract,
  getTotalPaymentsToContract,
} = require("../entity/rg_payments_to_contract");

const { logWithdraw } = require("../entity/rg_withdraw_logs");
const { getTransactionHistory } = require("../entity/rg_transaction_log");

router.post("/payToContract", async (req, res) => {
  console.log("payToContract", req.body);
  const creditor = req.body.sender.toLowerCase();
  const amount = req.body.amount;
  const insertRes = await payToContract(creditor, amount, req.body.uniqueId);

  let upsRes = false;
  if (insertRes && insertRes.rows) {
    // update rg_balances
    const { _, currentBalance } = await getRGCredit(creditor);
    console.log("...currentCredit", currentBalance);
    const newCredit = BigInt(currentBalance) + BigInt(amount);
    console.log("...newCredit", newCredit);
    upsRes = await upsertCredit(creditor, newCredit);
  }
  const msg = upsRes
    ? "Payment received successfully"
    : "Something went rong on update your balance!";
  res.status(200).json({
    data: insertRes,
    message: msg,
    success: upsRes,
  });
});

router.post("/logWithdraw", async (req, res) => {
  console.log("log Withdraw", req.body);
  const withdrawer = req.body.withdrawer.toLowerCase();
  const amount = req.body.amount;
  const withdrawMsg = req.body.withdrawMsg;
  const signature = req.body.signature;
  const timestamp = req.body.timestamp;

  // control signature
  let toBeSignedMessage = "withdraw" + withdrawMsg;
  const hashedMessage = keccak256(toBeSignedMessage);
  console.log(" ......... hashedMessage:", hashedMessage);
  const recoveredAddress = ethers.verifyMessage(hashedMessage, signature);
  console.log("Signer address_B:", recoveredAddress);
  if (recoveredAddress.toLowerCase() === withdrawer.toLowerCase()) {
    console.log("Signature is valid.");
  } else {
    console.log(
      "Signature is not valid.",
      recoveredAddress.toLowerCase(),
      withdrawer.toLowerCase()
    );
    return {
      stat: false,
      msg: "Invalid Signature!",
    };
  }

  const insertRes = await logWithdraw(
    withdrawer,
    amount,
    withdrawMsg,
    signature,
    timestamp
  );

  let upsRes = false;
  if (insertRes && insertRes.rows) {
    // update rg_balances
    const { _, currentBalance } = await getRGCredit(creditor);
    console.log("...currentCredit", currentBalance);
    const newCredit = BigInt(currentBalance) + BigInt(amount);
    console.log("...newCredit", newCredit);
    upsRes = await upsertCredit(creditor, newCredit);
  }
  const msg = upsRes
    ? "Payment received successfully"
    : "Something went rong on update your balance!";
  res.status(200).json({
    data: insertRes,
    message: msg,
    success: upsRes,
  });
});

router.get("/getTotalPaymentsToContract", async (req, res) => {
  const totalPayment = await getTotalPaymentsToContract(
    req.query.payer.toLowerCase()
  );

  res.status(200).json({
    data: { totalPayment },
    message: "Total fetcehd successfully",
    success: true,
  });
});

router.post("/doTransferFund", async (req, res) => {
  const data = await doTransferFund(
    req.body.timestamp,
    req.body.sender.toLowerCase(),
    req.body.amount,
    req.body.recipientAddress.toLowerCase(),
    req.body.textMessage,
    req.body.signature
  );

  res.status(200).json({
    data,
    message: data.msg,
    success: data.stat,
  });
});

router.get("/transaction/history", async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({
        data: null,
        message: "Address is required",
        success: false,
      });
    }

    const transactions = await getTransactionHistory(address);
    
    res.status(200).json({
      data: transactions,
      message: "Transaction history fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    res.status(500).json({
      data: null,
      message: "Failed to fetch transaction history",
      success: false,
    });
  }
});

router.get("/getOfflineBalances", async (req, res) => {
  try {
    const creditors = await getAllCreditors();
    const total = await getSumAllCreditors();
    
    // Always return a valid response object
    return res.status(200).json({
      stat: true,
      balances: Array.isArray(creditors) ? creditors : [],
      total: total.toString()
    });
  } catch (error) {
    console.error("Error getting offline balances:", error);
    return res.status(500).json({
      stat: false,
      msg: "Error getting offline balances",
      balances: [],
      total: "0"
    });
  }
});

module.exports = router;
