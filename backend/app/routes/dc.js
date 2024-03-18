const express = require("express");
const router = express.Router();

const { getRGCredit } = require("../entity/rg_balances");
const { generateRGCD, makeFullRGCD } = require("../modules/detailed-credits");

const {
  getRecordsProfileBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated_profile");

router.get("/getRGCredit", async (req, res) => {
  const { rowId, currentBalance } = await getRGCredit(
    req.query.creditor.toLowerCase()
  );

  res.status(200).json({
    data: { currentBalance },
    message: "RG Credit fetcehd successfully",
    success: rowId ? true : false,
  });
});

router.get("/makeFullRGCD", async (req, res) => {
  let serialNumber = req.query.serialNumber;
  let account = req.query.account;
  if (account) account = account.toLowerCase();
  const theRGCD = await makeFullRGCD(serialNumber, account);
  res.status(200).json({
    data: theRGCD,
    message: "theRGCD fetched ",
    success: true,
  });
});

router.get("/getLatestGuaranteeDC", async (req, res) => {
  const creditor = req.query.creditor.toLowerCase();
  const serialNumber = req.query.serialNumber;

  const fullDC = await makeFullRGCD(serialNumber, creditor);
  console.log(fullDC);
  let clearDC =
    "withdraw" +
    fullDC.records
      .map((obj) => [obj.clearRecord, obj.proofs].join("+"))
      .join("+");

  res.status(200).json({
    data: {
      encryotedDC: Buffer.from(clearDC).toString("base64"),
      clearDC: clearDC.replace(/\+/g, " +"),
    },
    message: "Guarantee DC generated successfully",
    success: true,
  });
});

router.get("/generateRGCD", async (req, res) => {
  let serialNumber = req.query.serialNumber;
  const publicRGCD = await generateRGCD(serialNumber);

  res.status(200).json({
    data: { publicRGCD },
    message: "RG Details Credit generated successfully",
    success: true,
  });
});

router.get("/getRecordsProfileBySerialNumber", async (req, res) => {
  let serialNumber = req.query.serialNumber;
  const obfProfile = await getRecordsProfileBySerialNumber(serialNumber);

  res.status(200).json({
    data: obfProfile,
    message: "RG Credit Details fetched successfully",
    success: true,
  });
});

module.exports = router;
