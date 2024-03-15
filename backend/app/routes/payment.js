const express = require("express");
const router = express.Router();

const { doTransferFund } = require("../modules/contract-pay");

const {
  payToContract,
  getTotalPaymentsToContract,
} = require("../entity/rg_payments_to_contract");

router.post("/payToContract", async (req, res) => {
  console.log("payToContract", req.body);
  const resData = await payToContract(
    req.body.sender,
    req.body.amount,
    req.body.uniqueId
  );

  res.status(200).json({
    data: resData,
    message: "Payment received successfully",
    success: true,
  });
});

router.get("/getTotalPaymentsToContract", async (req, res) => {
  const totalPayment = await getTotalPaymentsToContract(req.query.payer);

  res.status(200).json({
    data: { totalPayment },
    message: "Total fetcehd successfully",
    success: true,
  });
});

router.post("/doTransferFund", async (req, res) => {
  const data = await doTransferFund(
    req.body.timestamp,
    req.body.sender,
    req.body.amount,
    req.body.recipientAddress,
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
