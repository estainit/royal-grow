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
  return Math.floor(scaled); // Ensure integer using Math.floor
}

function getNow() {
  //   var day_names = new Array("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT");

  //   var month_names = new Array(
  //     "JAN",
  //     "FEB",
  //     "MAR",
  //     "APR",
  //     "MAY",
  //     "JUN",
  //     "JUL",
  //     "AUG",
  //     "SEP",
  //     "OCT",
  //     "NOV",
  //     "DEC"
  //   );

  var date = new Date();
  var curr_date = date.getDate();
  var curr_month = date.getMonth() + 1;
  var curr_year = date.getFullYear();
  var cur_hour = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  var miliseconds = date.getMilliseconds();
  //   var AMorPM = cur_hour >= 12 ? (AMorPM = "PM") : (AMorPM = "AM");
  cur_hour = cur_hour > 12 ? (cur_hour -= 12) : cur_hour;

  if (cur_hour < 10) cur_hour = "0" + cur_hour;
  if (minutes < 10) minutes = "0" + minutes;

  var finalDate =
    curr_year +
    "-" +
    curr_month +
    "-" +
    curr_date +
    " " +
    cur_hour +
    ":" +
    minutes +
    ":" +
    seconds;

  return finalDate;
}

module.exports = {
  breakDown,
  getRandomInt,
  getNow,
};
