const express = require("express");
const router = express.Router();

const {
  payToContract,
  getTotalPaymentsToContract,
} = require("../entity/rg_payments_to_contract");



const RGDetailedCreditRouter = require('./dc');
router.use('/dc', RGDetailedCreditRouter);

const {
  doKeccak256,
  generate_m,
  get_root_by_a_prove,
  getProofByLeave,
  validateProof,
} = require("../merkle-engine");

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
  let doMerkleTests = false;
  if (doMerkleTests) {
    // Sample data for 5 people (replace with actual data)

    if (true) {
      const { root, proofs, version, levels, leaves } = generate_m(
        ["a", "b", "c", "d"],
        "hashed",
        "noHash"
      );
      console.log("root: ", root);
      console.log("proofs: ", proofs);
      console.log("version: ", version);
      console.log("levels: ", levels);
      console.log("leaves: ", leaves);
    }
    if (false) {
      const peopleData = [
        "Alice: 100 ETH",
        "Bob: 200 ETH",
        "Charlie: 300 ETH",
        "Diana: 400 ETH",
        "Eve: 500 ETH",
      ];
      const { root, proofs, version, levels, leaves } = generate_m(peopleData);
      console.log("root: ", root);
      console.log("proofs: ", proofs);
      console.log("version: ", version);
      console.log("levels: ", levels);
      console.log("leaves: ", leaves);

      let proof_hashes = getProofByLeave(proofs, "Diana: 400 ETH");
      console.log("Final Proof: ", proof_hashes);

      let proved = validateProof(
        root,
        "Diana: 400 ETH",
        proof_hashes,
        "string"
      );
      console.log("Final proved: ", proved);
    }
  }

  const totalPayment = await getTotalPaymentsToContract(req.query.payer);

  res.status(200).json({
    data: { totalPayment },
    message: "Total fetcehd successfully",
    success: true,
  });
});

router.get("/test", async (req, res) => {
  res.status(200).json({
    data: { doTest: "isOk" },
    message: "is working!",
    success: true,
  });
});

module.exports = router; // Export the router object
