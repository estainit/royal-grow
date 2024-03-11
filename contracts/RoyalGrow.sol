// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "./MessageVerifier.sol";

contract RoyalGrow {
    address public verifierContractAddress;
    MessageVerifier verifierContract;

    uint256 public constant ONE_ETH = 1 ether; // the cost for update balance amount because of withdraw request from user
    uint256 public balancesRefreshCost = ONE_ETH; // the cost for update balance amount because of withdraw request from user
    uint256 public balance;

    // if server is down, after this time withdraws no need to wait for settelment.
    // in this manner avoiding client funds being locked for ever.
    uint16 public noMoreSettelementRequired = 24 * 60; // by minutes,
    uint16 public balancesValidTime = 10; // by minutes
    uint16 public withdrawReqSettelment = 15; // by minutes
    uint16 public contractRefreshGap = 5; // by minutes
    address public owner;
    bytes32 public creditsMerkleRoot;

    // avoiding drain contract funds by DoS deposit & withdraw attack
    uint256 public trialFundingCost;

    uint txFee;

    enum State {
        Running,
        Paused
    }
    State public contractState;

    mapping(address => uint) public creditorsAmount;
    mapping(address => uint) public creditorsUpdate;
    mapping(address => mapping(uint => uint256)) public WithdrawalsQueue;

    event PayToContractEvent(address sender, uint amount, uint256 uniqueId);
    event WithdrawalEvent(
        address indexed user,
        uint256 amount,
        uint256 timestamp,
        uint8 stage
    );
    event SignatureVerifiedEvent(address signer, bool isVerified);
    event GetCreditorBalanceEvent(address indexed user, uint256 amount);
    event CreditsMerkleRootUpdatedEvent(bytes32 creditsMerkleRoot);

    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }

    constructor(address _verifierContractAddress) payable {
        verifierContractAddress = _verifierContractAddress;
        verifierContract = MessageVerifier(verifierContractAddress);

        owner = msg.sender;
        txFee = 1000;
        trialFundingCost = 10000;
        contractState = State.Running;

        //emit PayToContractEvent(msg.sender, msg.value);
    }

    receive() external payable {
        payToContract();
    }

    function payToContract() public payable {
        require(contractState == State.Running);
        require(msg.value >= txFee * 10);

        require(msg.value >= trialFundingCost, "Must pay minimum amount");

        uint currentCredit = creditorsAmount[msg.sender] + msg.value;
        creditorsAmount[msg.sender] = currentCredit;
        creditorsUpdate[msg.sender] =
            block.timestamp -
            (withdrawReqSettelment * 60);

        balance += msg.value;

        uint256 uniqueId = generateUniqueId();
        emit PayToContractEvent(msg.sender, msg.value, uniqueId);
    }

    function generateUniqueId() public payable returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        msg.value,
                        msg.sender
                    )
                )
            );
    }

    function updateCreditsMerkleRoot(
        bytes32 newCreditsMerkleRoot
    ) public onlyOwner {
        creditsMerkleRoot = newCreditsMerkleRoot;
        emit CreditsMerkleRootUpdatedEvent(newCreditsMerkleRoot);
    }

    function updateMyBalance() public {}

    function withdraw(
        string calldata _msg,
        uint256 _amount,
        string calldata _sig
    ) external returns (bool) {
        uint8 stage = 0;
        emit WithdrawalEvent(msg.sender, _amount, block.timestamp, stage);

        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(creditorsAmount[msg.sender] >= _amount, "Insufficient fund");

        if (WithdrawalsQueue[msg.sender][_amount] == 0) {
            stage = 1; // we are in stage 1 which means creaditor asked for withdraw
            WithdrawalsQueue[msg.sender][_amount] = block.timestamp;
            /**
            // check if merkle proffs are valid
            // signed message _msg = signature::v0.0.0:publicKey::proof1:proof2:proof3
            // Initialize the result array
            string[] memory parts = macroParseMsg(_msg);
            string memory signature = parts[0];
            //string memory version = parts[1];
            string memory signedMsg = string(abi.encodePacked(parts[1], parts[2]));
            require(verifyMessageSignature(signedMsg, bytes(signature), msg.sender));
    */

            emit WithdrawalEvent(msg.sender, _amount, block.timestamp, stage);
            return true;
        } else {
            require(
                _amount > balancesRefreshCost,
                "Withdrawal amount is less than withdraw cost"
            );
            uint reqTime = WithdrawalsQueue[msg.sender][_amount];
            if (reqTime + (noMoreSettelementRequired * 60) > block.timestamp) {
                require(
                    reqTime + (withdrawReqSettelment * 60) < block.timestamp,
                    "Your request still not cooled down"
                );
                stage = 2;
            } else {
                stage = 3; // site is down, and user can take his money back
            }

            uint256 applyableWithdraw = _amount - balancesRefreshCost;

            // Update the balance before transfer to prevent reentrancy
            creditorsAmount[msg.sender] -= applyableWithdraw;

            balance -= applyableWithdraw;

            // Transfer funds
            (bool success, ) = msg.sender.call{value: applyableWithdraw}("");
            require(success, "Transfer failed");

            emit WithdrawalEvent(
                msg.sender,
                applyableWithdraw,
                block.timestamp,
                stage
            );
            return true;
        }
    }

    function macroParseMsg(
        string calldata _msg
    ) internal pure returns (string[] memory) {
        string[] memory parts = new string[](3);
        // Split the string
        uint256 start = 0;
        uint256 index = 0;
        for (uint256 i = 0; i < bytes(_msg).length; i++) {
            if (bytes(_msg)[i] == bytes1(" ")) {
                parts[index] = substring(_msg, start, i);
                start = i + 1;
                index++;
            }
        }
        parts[index] = substring(_msg, start, bytes(_msg).length);

        return parts;
    }

    function verifyMessageSignature(
        string memory message,
        bytes memory signature,
        address signer
    ) public returns (bool) {
        // Call the verifySignature function from the MessageVerifier contract
        bool isVerified = verifierContract.verifySignature(
            message,
            signature,
            signer
        );

        // Emit an event with the verification result
        if (!isVerified) emit SignatureVerifiedEvent(signer, isVerified);

        return isVerified;
    }

    // Helper function to extract substring
    function substring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function getDepositsBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getCreditorBalanceView() public view returns (uint) {
        return creditorsAmount[msg.sender];
    }

    function getCreditorBalance() public returns (uint) {
        emit GetCreditorBalanceEvent(msg.sender, getCreditorBalanceView());
        return getCreditorBalanceView();
    }

    function base64Decode(
        string memory base64String
    ) internal pure returns (string memory) {
        // Implementation of base64 decoding logic
        // You can use libraries like https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/Base64.sol
        // or implement your own decoding logic
    }

    function transferCoin(
        uint256 amount,
        address receiver,
        string calldata proofMsg
    ) public {
        //bytes memory decodedMessage = bytes(base64Decode(proofMsg));
    }
}
