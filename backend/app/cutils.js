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

function getDateStr(theTime, needMiliSec) {
  //   let day_names = new Array("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT");

  //   let month_names = new Array(
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

  let theDate = new Date();
  if (theTime != null) theDate = new Date(theTime);
  let curr_date = theDate.getDate();
  let curr_month = theDate.getMonth() + 1;
  let curr_year = theDate.getFullYear();
  let cur_hour = theDate.getHours();
  let minutes = theDate.getMinutes();
  let seconds = theDate.getSeconds();
  let miliseconds = theDate.getMilliseconds();
  //   let AMorPM = cur_hour >= 12 ? (AMorPM = "PM") : (AMorPM = "AM");
  cur_hour = cur_hour > 12 ? (cur_hour -= 12) : cur_hour;

  if (cur_hour < 10) cur_hour = "0" + cur_hour;
  if (minutes < 10) minutes = "0" + minutes;

  let finalDate =
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

  if (needMiliSec) finalDate += "." + miliseconds;

  return finalDate;
}

module.exports = {
  breakDown,
  getRandomInt,
  getDateStr,
};
