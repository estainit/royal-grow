// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
//const hre = require("hardhat");

const fs = require("fs");
const contractsDir = __dirname + "/../../frontend/src/deployed-contracts";

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  const deploying_network = "localhost"; // can be localhost, sepolia, ...
  let provider = ethers.getDefaultProvider(); // Get the default provider

  if (deploying_network == "sepolia") {
    /**
      const ALCHEMY_SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
      const ALCHEMY_SEPOLIA_API_KEY = "xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
      const ALCHEMY_SEPOLIA_WebSocket = "wss://eth-sepolia.g.alchemy.com/v2/xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X";
      const ACC1_PRIVATE_KEY =
        "c906019567d27e7c46785ab62e2b856eadfa7d384547e4e7b3f027dc0e9550b2";
      const ACC1_PUBLIC_KEY = "0x5095ad334F6766DDFD07a87a550cC0f96b377A25";

     */
    provider = new ethers.providers.JsonRpcProvider(
      "https://eth-sepolia.g.alchemy.com/v2/xl9NXzq-J2N1voXCujrq3iRcrnHfCq_X"
    );
  }

  const [deployer] = await ethers.getSigners();
  const balanceBeforeDeploy = await provider.getBalance(deployer.address);

  console.log("Deploying the contracts with the account:", deployer.address);
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log(
    "Account balance Before deploy:",
    ethers.formatEther(balanceBeforeDeploy)
  );
  //console.log("Account balance Before deploy:", ethers.utils.formatEther(balanceBeforeDeploy.toString()));

  let contractsAddresses = {};

  // deploy MessageVerifier
  const messageVerifierDeploy = await ethers.deployContract("MessageVerifier");
  const messageVerifierDeployRes =
    await messageVerifierDeploy.waitForDeployment();
  let messageVerifierDeployedAddress =
    await messageVerifierDeployRes.getAddress();
  console.log(`Deployed MessageVerifier(${messageVerifierDeployedAddress})`);
  contractsAddresses["MessageVerifier"] = messageVerifierDeployedAddress;
  saveFrontendContracts("MessageVerifier");

  // deploy RGUtils
  const rgUtilsDeploy = await ethers.deployContract("RGUtils");
  const rgUtilsDeployRes = await rgUtilsDeploy.waitForDeployment();
  let rgUtilsDeployedAddress = await rgUtilsDeployRes.getAddress();
  console.log(`Deployed RGUtils(${rgUtilsDeployedAddress})`);
  contractsAddresses["RGUtils"] = rgUtilsDeployedAddress;
  saveFrontendContracts("RGUtils");

  // deploy RoyalGrow
  const royalGrowDeploy = await ethers.deployContract("RoyalGrow", [
    messageVerifierDeployedAddress,
    rgUtilsDeployedAddress,
  ]); //, { value: 1 }
  const royalGrowDeployRes = await royalGrowDeploy.waitForDeployment();
  let deployedAddress = await royalGrowDeployRes.getAddress();
  console.log(`Deployed RoyalGrow(${deployedAddress})`);
  contractsAddresses["RoyalGrow"] = deployedAddress;
  saveFrontendContracts("RoyalGrow");

  // save contracts addresses
  saveFrontendContractAddresses(contractsAddresses);

  /*
  //const ethers = require('ethers'); 
  async function deployRoyalGrow(messageVerifierDeployedAddress, gasLimit, gasPrice) {
    const provider = new ethers.providers.JsonRpcProvider('your-rpc-url'); // Replace with your provider URL
    const signer = new ethers.Wallet('your-private-key', provider); // Replace with your private key

    // Load the contract bytecode (assuming it's available)
    const contractFactory = new ethers.ContractFactory(bytecode, abi, signer); // Replace with actual bytecode and ABI

    // Deployment transaction parameters
    const deploymentTx = contractFactory.getDeployTransaction([messageVerifierDeployedAddress], {
      gasLimit,
      gasPrice,
    });

    try {
      const deployedContract = await deploymentTx.deploy();
      console.log("RoyalGrow contract deployed to:", await deployedContract.deployed().address);
      contractsAddresses["RoyalGrow"] = deployedContract.deployed().address;
      return deployedContract; // Optionally return the deployed contract instance
    } catch (error) {
      console.error("Error deploying contract:", error);
      return null; // Or handle the error differently
    }
  }

// Example usage
const gasLimit = 1000000; // Adjust gas limit as needed
const gasPrice = ethers.utils.bigNumberify('1000000000'); // Adjust gas price as needed

deployRoyalGrow(messageVerifierDeployedAddress, gasLimit, gasPrice)
  .then(deployedContract => {
    console.log("deployedContract: ", deployedContract)
  })
  .catch(error => {
    console.error("Deployment failed:", error);
  });



 */

  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const unlockTime = currentTimestampInSeconds + 60;
  // const lockedAmount = hre.ethers.parseEther("0.001");
  // const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
  //   value: lockedAmount,
  // });
  // await lock.waitForDeployment();
}

function saveFrontendContractAddresses(contractsAddresses) {
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify(contractsAddresses, undefined, 2)
  );
}

function saveFrontendContracts(contractName) {
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  const ContractArtifact = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
    contractsDir + `/${contractName}.json`,
    JSON.stringify(ContractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
