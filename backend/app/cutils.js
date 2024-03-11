function breakDown(amount) {}

function breakDown(amount) {
  const denominations = [
    1000000000000000000000000000000n,
    500000000000000000000000000000n,
    100000000000000000000000000000n,
    50000000000000000000000000000n,
    10000000000000000000000000000n,
    5000000000000000000000000000n,
    1000000000000000000000000000n,
    500000000000000000000000000n,
    100000000000000000000000000n,
    50000000000000000000000000n,
    10000000000000000000000000n,
    5000000000000000000000000n,
    1000000000000000000000000n,
    500000000000000000000000n,
    100000000000000000000000n,
    50000000000000000000000n,
    10000000000000000000000n,
    5000000000000000000000n,
    1000000000000000000000n,
    500000000000000000000n,
    100000000000000000000n,
    50000000000000000000n,
    10000000000000000000n,
    5000000000000000000n,
    1000000000000000000n,
    500000000000000000n,
    100000000000000000n,
    50000000000000000n,
    10000000000000000n,
    5000000000000000n,
    1000000000000000n,
    500000000000000n,
    100000000000000n,
    50000000000000n,
    10000000000000n,
    5000000000000n,
    1000000000000n,
    500000000000n,
    100000000000n,
    50000000000n,
    10000000000n,
    5000000000n,
    1000000000n,
    500000000n,
    100000000n,
    50000000n,
    10000000n,
    5000000n,
    1000000n,
    500000n,
    100000n,
    50000n,
    10000n,
    5000n,
    1000n,
    500n,
    100n,
    50n,
    10n,
    9n,
    8n,
    7n,
    6n,
    5n,
    4n,
    3n,
    2n,
    1n,
  ];
  const result = [];

  while (amount > 0n) {
    for (const denomination of denominations) {
      if (typeof denomination !== "bigint") {
        denomination = BigInt(denomination); // Convert to BigInt if necessary
      }

      if (amount >= denomination) {
        result.push(denomination);
        amount -= denomination;
        break; // Move to the next denomination after successful division
      }
    }
  }

  return result;
}

function getRandomInt(min, max) {
    min = Math.ceil(min); // Inclusive lower bound
    max = Math.floor(max); // Inclusive upper bound
  
    // Use Math.random() for simpler generation (consider security for production)
    const randomDecimal = Math.random();
    const scaled = randomDecimal * (max - min + 1) + min;
    return Math.floor(scaled);  // Ensure integer using Math.floor
  }
  
  

module.exports = {
  breakDown,
  getRandomInt
};
