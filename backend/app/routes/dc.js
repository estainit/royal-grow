const express = require("express");
const router = express.Router();

const { getRGCredit } = require("../entity/rg_balances");
const { generateRGCD, makeFullRGCD } = require("../modules/detailed-credits");

const {
  getRecordsProfileBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated_profile");

router.get("/getRGCredit", async (req, res) => {
  const rgCredit = await getRGCredit(req.query.creditor);

  res.status(200).json({
    data: { rgCredit },
    message: "RG Credit fetcehd successfully",
    success: true,
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

router.get("/generateRGCD", async (req, res) => {
  let serialNumber = req.query.serialNumber;
  const publicRGCD = await generateRGCD(serialNumber);

  res.status(200).json({
    data: { publicRGCD },
    message: "RG Credit Details generated successfully",
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
