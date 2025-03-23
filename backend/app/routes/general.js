const express = require("express");
const router = express.Router();

const { doKeccak256 } = require("../merkle-engine");

router.get("/doKeccak256", async (req, res) => {
  console.log("do Keccak 256 inut:", req.query.str);
  const resData = doKeccak256(req.query.str);
  console.log("do Keccak 256 output:", resData);

  res.status(200).json({
    data: resData,
    message: "keccak done successfully",
    success: true,
  });
});

module.exports = router;
