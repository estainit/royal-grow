const express = require("express");
const router = express.Router();

const { doTransferFund } = require("../modules/contract-pay");
const { getRGCredit, upsertCredit } = require("../entity/rg_balances");

const {
  payToContract,
  getTotalPaymentsToContract,
} = require("../entity/rg_payments_to_contract");

router.post("/payToContract", async (req, res) => {
  console.log("payToContract", req.body);
  const creditor = req.body.sender.toLowerCase();;
  const amount = req.body.amount;
  const insertRes = await payToContract(creditor, amount, req.body.uniqueId);

  let upsRes = false;
  if (insertRes && insertRes.rows) {
    // update rg_balances
    const {_, currentBalance} = await getRGCredit(creditor);
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
  const totalPayment = await getTotalPaymentsToContract(req.query.payer.toLowerCase());

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

module.exports = router;
