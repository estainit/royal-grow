const express = require("express");
const router = express.Router();



router.use("/general", require("./general"));
router.use("/dc", require("./dc")); //Detailed Credit
router.use("/payment", require("./payment"));

router.get("/test", async (req, res) => {
  res.status(200).json({
    data: { doTest: "isOk" },
    message: "is working!",
    success: true,
  });
});

module.exports = router; // Export the router object
