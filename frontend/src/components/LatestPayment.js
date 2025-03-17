import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "./AppContext";


const LatestPayment = () => {
  const { globData } = useContext(AppContext);

  const [latestPayment, setLatestPayment] = useState(null);

  // Unsubscribe from event on component unmount (optional)
  useEffect(() => {
    const unsubscribe = async () => {
      // Implement logic to unsubscribe from the event (if subscription is stored)
    };
    return unsubscribe;
  }, []); // Re-subscribe on Ether/address change

  return (
    <div
      id="latestPaymentInfo"
      style={{ border: "1px solid black", padding: "10px" }}
    >
      <h2>Latest Payment</h2>
      {latestPayment ? (
        <p>
          Sender: {latestPayment.sender} <br /> Amount: {latestPayment.amount}{" "}
          ETH
        </p>
      ) : (
        <p>No recent payments received.</p>
      )}
    </div>
  );
};

export default LatestPayment;
