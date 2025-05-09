import axios from "axios";
import { ethers } from "ethers";
import { BACKEND_API_URL } from '../config';

export const postToBE = async (cmd, data) => {
  try {
    const response = await axios.post(BACKEND_API_URL + "/" + cmd, data);
    console.log("Data sent successfully:", response.data);
  } catch (error) {
    console.error(`Error in post to BE: ${cmd}`, data, error);
  }
};

export const getFromBE = async (cmd, params) => {
  console.log(`getFromBE: ${BACKEND_API_URL} ${cmd}`, params);

  try {
    const response = await axios.get(BACKEND_API_URL + "/" + cmd, {
      params, // Pass params object for query string parameters
    });
    console.log("Data retrieved successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error in get From BE: ${cmd}`, params, error);
    return null; // Or throw an error or handle it differently
  }
};

export const etherToWei = (ethAmount) => {
  // Conversion factor: 1 ETH = 10^18 WEI
  const weiConversionFactor = 1e18;
  return ethAmount * weiConversionFactor;
};

export const weiToEther = (weiAmount) => {
  const etherValue = parseInt(weiAmount) / 1e18; // Divide by 1e18 (1 followed by 18 zeros)
  return etherValue.toFixed(4); // Format to 4 decimal places (adjust as needed)
};

export const getWalletSelectedAccount = async (globData) => {
  const accounts = await globData.provider.listAccounts();
  return accounts[0]; // Assuming the first account is selected in MetaMask
};

export const getWalletSelectedAccountByWalletSigner = async (globData) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  console.log("wallet selected account/signer:", signer);
  return signer;
};

export async function hashMessage(message) {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(message);

  const buffer = await crypto.subtle.digest("SHA-256", data);
  const array = Array.from(new Uint8Array(buffer));
  const hash = array.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hash;
}

export function getNow() {
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

export function bytesToString(hexString) {
  // Remove optional "0x" prefix
  const cleanHexString = hexString.startsWith("0x")
    ? hexString.slice(2)
    : hexString;

  // Split into segments of 2 characters
  const segments = cleanHexString.match(/(.{2})/g);

  // Convert each segment to ASCII character and join
  return segments
    .map((segment) => String.fromCharCode(parseInt(segment, 16)))
    .join("");
}

export function doKeccak256(globData, data) {
  let hash = ethers.keccak256(data);
  hash = hash.toString("hex");
  hash = hash.slice(2);
  hash = ethers.keccak256(hash);
  hash = hash.toString("hex");
  return hash.substring(2, 10); //shrtening for the sake of proof length
}

export const numberWithCommas = (number) => {
  return number.toLocaleString();
};

export const clearRecordParser = (clearRecord) => {
  const clearRecordSegments = clearRecord.split(":");
  return {
    serialNumber: parseInt(clearRecordSegments[0]),
    creditor: clearRecordSegments[1],
    amount: parseInt(clearRecordSegments[2]),
    salt: clearRecordSegments[3],
  };
};

export const parseClearRecord = (aRecord) => {
  // 2:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955:10000:2a2f2198
  let recordSegments = aRecord.split(":");
  return {
    serialNumber: recordSegments[0],
    creditor: recordSegments[1],
    amount: parseInt(recordSegments[2]),
    salt: recordSegments[3],
  };
};

// Create a global event emitter for displaying messages
const messageEventEmitter = new EventTarget();

export const dspEvent = (msg, msgType = "info") => {
  const event = new CustomEvent('displayMessage', {
    detail: { message: msg, type: msgType }
  });
  messageEventEmitter.dispatchEvent(event);
};

export const subscribeToMessageEvents = (callback) => {
  messageEventEmitter.addEventListener('displayMessage', (event) => {
    callback(event.detail.message, event.detail.type);
  });
};

export const unsubscribeFromMessageEvents = (callback) => {
  messageEventEmitter.removeEventListener('displayMessage', callback);
};

export async function checkConnection(provider) {
  try {
    await provider.getBlockNumber(); // Fetch latest block number as a connection test
    console.log("Connected to a Blockchain");
  } catch (err) {
    console.error("Not connected:", err);
  }
}