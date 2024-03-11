// test/myFunction.test.js (example)

const {
    doKeccak256,
    generate_m,
    get_root_by_a_prove,
    getProofByLeave,
    validateProof,
  } = require("../app/merkle-engine"); 

test("adds 1 and 2 to equal 3", () => {
  expect(generate_m(1, 2)).toBe(3);
});
