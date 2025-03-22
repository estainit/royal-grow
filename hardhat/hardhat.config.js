require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");

const ALCHEMY_SEPOLIA_RPC_URL =
  "https://eth-sepolia.g.alchemy.com/v2/xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
const ALCHEMY_SEPOLIA_API_KEY = "xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
const ALCHEMY_SEPOLIA_WebSocket =
  "wss://eth-sepolia.g.alchemy.com/v2/xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
const ACC1_PRIVATE_KEY =
  "c906019567d27e7c46785ab62e2b856eadfa7d384547e4e7b3f027dc0e9550b2";
const ACC1_PUBLIC_KEY = "0x5095ad334F6766DDFD07a87a550cC0f96b377A25";

const ACC_LOCAL_HH_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ACC_LOCAL_HH_PUBLIC_KEY = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",

  mining: {
    auto: false,
    interval: 5000,
  },

  networks: {
    /*
    hardhat: {
      mining: {
        auto: false,
        interval: 5000,
      },
      chainId: 1337,
      //accounts: [`${ACC_LOCAL_HH_PRIVATE_KEY}`],
    },
 */

    localhost: {
      url: "http://127.0.0.1:8545", // http://127.0.0.1:8545,  http://113.30.150.33:8545
      chainId: 31337, // default was 1337
      accounts: [`${ACC_LOCAL_HH_PRIVATE_KEY}`],
    },

    sepolia: {
      url: `${ALCHEMY_SEPOLIA_RPC_URL}`,
      accounts: [`${ACC1_PRIVATE_KEY}`],
      chainId: 11155111, // Sepolia chain ID
    },
  },
};

/*

Metamask seetings for Sepolia
Network Name - Sepolia Testnet
New RPC URL - https://eth-sepolia.g.alchemy.com/v2/[YOUR-API-KEY]
Chain ID - 11155111
Currency Symbol - SepoliaETH
Block explorer URL - https://sepolia.etherscan.io/

// index.js
import { Network, Alchemy } from 'alchemy-sdk';

const settings = {
    apiKey: "xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X",
    network: Network.ETH_SEPOLIA,
};

const alchemy = new Alchemy(settings);

// Get the latest block
const latestBlock = alchemy.core.getBlockNumber();

// Get all outbound transfers for a provided address
alchemy.core
    .getTokenBalances('0x994b342dd87fc825f66e51ffa3ef71ad818b6893')
    .then(console.log);

// Get all the NFTs owned by an address
const nfts = alchemy.nft.getNftsForOwner("vitalik.eth");

// Listen to all new pending transactions
alchemy.ws.on(
    { method: "alchemy_pendingTransactions",
    fromAddress: "vitalik.eth" },
    (res) => console.log(res)
);
*/
