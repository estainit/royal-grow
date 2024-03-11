const express = require("express");
const router = express.Router();

const { getRGCredit } = require("../entity/rg_balances");
const { generateRGCD, printRGCD } = require("../modules/detailed-credits");

router.get("/getRGCredit", async (req, res) => {
    const rgCredit = await getRGCredit(req.query.creditor);
  
    res.status(200).json({
      data: { rgCredit },
      message: "RG Credit fetcehd successfully",
      success: true,
    });
  });
  
  router.get("/printRGCD", async (req, res) => {
    let serialNumber = req.query.serialNumber;
    const theRGCD = await printRGCD(serialNumber);
    res.status(200).json({
      data: { theRGCD },
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

  module.exports = router;