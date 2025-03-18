// import React, { useContext, useEffect, useState } from "react";
// import { AppContext } from "../AppContext";
// import { getWalletSelectedAccount, etherToWei } from "../CUtils";

// import { ethers } from "ethers";

// const Withdraw = () => {
//   const { globData } = useContext(AppContext);

//   const [message, setMessage] = useState("");
//   const [amount, setAmount] = useState(0);

//   const handleWithdraw = async () => {
//     if (!globData.web3 || !message || !amount) {
//       console.error("Missing required data");
//       return;
//     }

//     // Request user confirmation to sign message
//     try {
//       const selectedAccount = await getWalletSelectedAccount(globData);
//       console.log("wwwwwwww message:", message);
//       console.log("wwwwwwww selectedAccount:", selectedAccount);

//       const provider = new ethers.BrowserProvider(window.ethereum);
//       const signer = await provider.getSigner();
//       console.log("wwwwwwww signer:", signer);

//       const signature = await signer.signMessage(message);
//       console.log("wwwwwwww signature:", signature);

//       const address = await signer.getAddress();
//       console.log("wwwwwwww address:", address);

//       // Call withdraw with message, amount, and signature
//       const tx = await globData.royalGrowcontractInstanc e.methods
//         .withdraw(message, etherToWei(amount), signature)
//         .send({
//           from: address,
//         });
//       console.log("Transaction hash:", tx.transactionHash);
//     } catch (error) {
//       console.error("Error signing or sending transaction:", error);
//     }
//   };

//   const investigateOnWithdraw = async (user, amount, timestamp) => {
//     const balancesRefreshCost = etherToWei(1);
//     const userInfo = await updateFromBackend(user, amount);
//     await setCreditorBalance(user, userInfo.amount - balancesRefreshCost);
//   };

//   const updateFromBackend = async (user) => {};

//   const setCreditorBalance = async (user, amount) => {
//     const provider = new ethers.BrowserProvider(window.ethereum);
//     const signer = await provider.getSigner();
//     const address = await signer.getAddress();
//     const tx = await globData.royalGrowcontractInstanc e.methods
//       .setCreditorBalance(message, etherToWei(amount))
//       .send({
//         from: address,
//       });
//     console.log("Transaction hash:", tx.transactionHash);
//   };

//   const handleWithdrawalEvent = async (event) => {
//     console.log(
//       ` User: ${event.returnValues.user}, Amount: ${event.returnValues.amount} ⏱️ Timestamp: ${event.returnValues.timestamp} Stage: ${event.returnValues.stage}`
//     );
//     console.log(` Event: ${event}`);

//     if (event.returnValues.stage === 1) {
//       await investigateOnWithdraw(
//         event.returnValues.user,
//         event.returnValues.amount,
//         event.returnValues.timestamp
//       );
//     }
//   };

//   // Unsubscribe from event on component unmount (optional)
//   useEffect(() => {
//     const unsubscribe = async () => {
//       // Implement logic to unsubscribe from the event (if subscription is stored)
//     };
//     return unsubscribe;
//   }, []); // Re-subscribe on web3/address change

//   // Initialize web3 and subscribe to event on component mount
//   useEffect(() => {
//     const subscribeToEvent = async () => {
//       if (globData.royalGrowcontractInstanc e.events.WithdrawalEvent) {
//         const subscription =
//           await globData.royalGrowcontractInstanc e.events.WithdrawalEvent({
//             fromBlock: "latest",
//           });

//         subscription.on("data", async (event) => {
//           await handleWithdrawalEvent(event);
//         });

//         subscription.on("error", console.error);
//       }
//     };

//     if (!globData) return;

//     const init = async () => {
//       await subscribeToEvent();
//     };

//     init();
//   }, [globData]);

//   return (
//     <div className="App-header">
//       <input
//         type="text"
//         placeholder="Enter message"
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//       />
//       <input
//         type="number"
//         placeholder="Enter amount"
//         value={amount}
//         onChange={(e) => setAmount(Number(e.target.value))}
//       />
//       <button onClick={handleWithdraw}>Withdraw</button>
//     </div>
//   );
// };

// export default Withdraw;
// a Sign example