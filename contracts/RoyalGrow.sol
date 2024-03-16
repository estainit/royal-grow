// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

import "./MessageVerifier.sol";
import "./RGUtils.sol";

contract RoyalGrow {
    address public verifierContractAddress;
    MessageVerifier verifierContract;

    address public rgUtilsContractAddress;
    RGUtils rgUtilsContract;

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

    // avoiding drain contract funds by DoS deposit & withdraw attack
    uint256 public trialFundingCost;

    uint txFee;

    enum State {
        Running,
        Paused
    }
    State public contractState;

    struct DCProfile {
        uint256 serialNumber;
        bytes8 rootHash;
    }

    struct ClearRecord {
        string serialNumber;
        string creditor;
        uint256 amount;
        string salt;
    }

    uint dcSerialNumber;
    mapping(uint => bytes8) public dcMerkleRoots;

    mapping(string => bool) public withdrawedRecords;

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
    event CreditsMerkleRootUpdatedEvent(
        uint serialNumber,
        bytes8 creditsMerkleRoot
    );
    event InvalidDCProfEvent(
        string rootHash,
        string calculatedRoot,
        string leave,
        string[] proofs
    );
    event ObfBurntEvent(string obfRecord);

    modifier onlyOwner() {
        require(owner == msg.sender);
        _;
    }

    constructor(
        address _verifierContractAddress,
        address _rgUtilsContractAddress
    ) payable {
        verifierContractAddress = _verifierContractAddress;
        verifierContract = MessageVerifier(verifierContractAddress);
        rgUtilsContractAddress = _rgUtilsContractAddress;
        rgUtilsContract = RGUtils(rgUtilsContractAddress);

        owner = msg.sender;
        txFee = 1000;
        trialFundingCost = 10000;
        contractState = State.Running;

        dcSerialNumber = 0;
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

        uint256 uniqueId = rgUtilsContract.generateUniqueId();
        emit PayToContractEvent(msg.sender, msg.value, uniqueId);
    }

    function updateCreditsMerkleRoot(bytes8 newCreditsMerkleRoot) public {
        dcSerialNumber++;
        dcMerkleRoots[dcSerialNumber] = newCreditsMerkleRoot;
        emit CreditsMerkleRootUpdatedEvent(
            dcSerialNumber,
            newCreditsMerkleRoot
        );
    }

    function getDCCurrentSerialNumber() public view returns (uint) {
        return dcSerialNumber;
    }

    function getCreditsMerkleRoot() public view returns (string memory) {
        return getCreditsMerkleRoot(dcSerialNumber);
    }

    function getCreditsMerkleRoot(
        uint serialNumber
    ) public view returns (string memory) {
        return rgUtilsContract.bytes8ToAsciiString(dcMerkleRoots[serialNumber]);
    }

    function getLast10DCRoots() public view returns (DCProfile[10] memory) {
        DCProfile[10] memory profiles;
        uint max = 10;
        if (dcSerialNumber < 10) max = dcSerialNumber;
        for (uint i = 0; i < max; i++) {
            uint index = dcSerialNumber - i;
            profiles[i] = DCProfile(index, dcMerkleRoots[index]);
        }
        return profiles;
    }

    function validateDCCredit(
        string calldata clearRecord,
        string[] calldata proofs
    ) public returns (bool, string memory) {
        ClearRecord memory clR = parseClearRecord(clearRecord);
        string memory hashedClearData = rgUtilsContract.doKeccak256(
            clearRecord
        );

        string memory obfRecord = string(
            abi.encodePacked(
                clR.serialNumber,
                ":",
                Strings.toString(clR.amount),
                ":",
                hashedClearData
            )
        );

        return validateDCProof(obfRecord, proofs, true);
    }

    /**
    function validateDCProofDev(
        string calldata obfRecord,
        string[] calldata proofs,
        bool isClearText
    ) public returns (bool) {
        bool res = validateDCProof(obfRecord, proofs, isClearText);
        if (!res) {
            string memory calculatedRoot = calcRootByAProve(
                obfRecord,
                proofs,
                isClearText
            );
            emit InvalidDCProfEvent(
                getCreditsMerkleRoot(),
                calculatedRoot,
                obfRecord,
                proofs
            );
        }
        return res;
    }
 */

    function validateDCProof(
        string memory obfRecord,
        string[] memory proofs,
        bool isClearText
    ) public view returns (bool, string memory) {
        string memory rootHash = getCreditsMerkleRoot();
        bool isValid = validateProof(rootHash, obfRecord, proofs, isClearText);
        if (!isValid) return (isValid, "Invalid Proof");

        if (alreadyWithdrawed(obfRecord))
            return (
                false,
                string(abi.encodePacked("Already withdrawed", obfRecord))
            );

        return (true, "Proof verified");
    }

    function validateProof(
        string memory rootHash,
        string memory leave,
        string[] memory proofs,
        bool isClearText
    ) public view returns (bool) {
        string memory calculatedRoot = calcRootByAProve(
            leave,
            proofs,
            isClearText
        );
        return rgUtilsContract.areStrsEqual(calculatedRoot, rootHash);
    }

    function calcRootByAProve(
        string memory leave,
        string[] memory proofs,
        bool isClearText
    ) public view returns (string memory rootHash) {
        string memory proof = leave;

        if (isClearText) {
            proof = rgUtilsContract.doKeccak256(leave);
        }

        if (proofs.length > 0) {
            for (uint i = 0; i < proofs.length; i++) {
                string memory pos = rgUtilsContract.pSubstring(proofs[i], 0, 1);
                string memory val = rgUtilsContract.pSubstring(
                    proofs[i],
                    2,
                    rgUtilsContract.getStringLength(proofs[i])
                );
                if (rgUtilsContract.areStrsEqual(pos, "r")) {
                    proof = rgUtilsContract.doKeccak256(
                        string(abi.encodePacked(proof, val))
                    );
                } else {
                    proof = rgUtilsContract.doKeccak256(
                        string(abi.encodePacked(val, proof))
                    );
                }
            }
        }
        return proof;
    }

    function updateMyBalance() public {}

    function addressToString(
        address _addr
    ) public pure returns (string memory) {
        return Strings.toHexString(uint256(uint160(_addr)), 20);
    }

    function withdrawDummy(
        string calldata _msg, // a string of comma seperated records
        uint256 _amount,
        string calldata signer,
        bytes memory signature // signed records
    ) public returns (bool, string memory) {
        // check if the signer is the msg.sender
        if (
            !rgUtilsContract.areStrsEqual(signer, addressToString(msg.sender))
        ) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "Tx Sender(",
                        addressToString(msg.sender),
                        ") is not the signer(",
                        signer,
                        ")"
                    )
                )
            );
        }

        // check the signatur of clear record
        bytes32 messageHash = keccak256(abi.encodePacked("withdraw", _msg));
        bytes32 ethSignedMessageHash = verifierContract
            .getEthSignedMessageHash4(messageHash);
        address tmpSigner = verifierContract.recoverSigner4(
            ethSignedMessageHash,
            signature
        );
        if (tmpSigner != msg.sender) {
            return (false, "Invalid signature");
        }

        string[] memory creditRecords = rgUtilsContract.splitString(_msg, "+");
        uint recordsCount = creditRecords.length;
        uint256 totalWithdrawAmount = 0;

        string[125] memory tmpWiRecs;
        uint256 tmpWiRecsCounter = 0;

        for (uint i = 0; i < recordsCount; i = i + 2) {
            string memory clearRecord = creditRecords[i];
            string[] memory proofs = rgUtilsContract.splitString(
                creditRecords[i + 1],
                ","
            );

            ClearRecord memory clR = parseClearRecord(clearRecord);

            // check if signer is equal to creditor(the address in clear record)
            if (
                !rgUtilsContract.areStrsEqual(
                    addressToString(msg.sender),
                    clR.creditor
                )
            ) {
                return (
                    false,
                    string(
                        abi.encodePacked(
                            "Tx Creditor(",
                            clR.creditor,
                            ") is not the signer(",
                            addressToString(msg.sender),
                            ")"
                        )
                    )
                );
            }

            // check if regenerated obfRecord is correct
            string memory regenObf = string(
                abi.encodePacked(
                    clR.serialNumber,
                    ":",
                    Strings.toString(clR.amount),
                    ":",
                    rgUtilsContract.doKeccak256(clearRecord)
                )
            );

            if (alreadyWithdrawed(regenObf)) {
                return (
                    false,
                    string(abi.encodePacked("Already withdrawed ", regenObf))
                );
            }

            /**
             * 
            FIXME: this checks MUST be activated ASAP
            // check if given proof is correct
            (
                bool proofIsValid,
                string memory proofValidateMsg
            ) = validateDCProof(regenObf, proofs, true);
            if (!proofIsValid) {
                return (false, proofValidateMsg);
            }
            */

            // check double-spend in same transaction
            for (uint256 i = 0; i < tmpWiRecsCounter; i++) {
                if (rgUtilsContract.areStrsEqual(regenObf, tmpWiRecs[i])) {
                    return (
                        false,
                        string(
                            abi.encodePacked(
                                "Double-spend in same transaction! ",
                                regenObf
                            )
                        )
                    );
                }
            }
            tmpWiRecs[tmpWiRecsCounter] = regenObf;
            tmpWiRecsCounter += 1;

            totalWithdrawAmount += clR.amount;
        }

        // check if creditor balance is enough
        if (getCreditorBalance() < totalWithdrawAmount) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "Insufficient balance (",
                        addressToString(msg.sender),
                        ") ",
                        Strings.toString(getCreditorBalance()),
                        " < ",
                        Strings.toString(totalWithdrawAmount),
                        " Requested amount"
                    )
                )
            );
        }

        // check if withdraw amount coincides records sum
        if (_amount != totalWithdrawAmount) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "Discrepancy in withdraw amount(",
                        Strings.toString(_amount),
                        ") and records sum(",
                        Strings.toString(totalWithdrawAmount),
                        ") "
                    )
                )
            );
        }

        // real transfer fund
        string memory latestObf;
        for (uint256 i = 0; i < tmpWiRecsCounter; i++) {
            bool tmpRes = setAsWithdrawed(tmpWiRecs[i]);
            latestObf = string(
                latestObf,
                " + ",
                abi.encodePacked(tmpWiRecs[i])
            );
            if (!tmpRes)
                return (
                    false,
                    string(
                        abi.encodePacked(
                            tmpWiRecs[i],
                            " Obf burning not setted!"
                        )
                    )
                );
        }

        uint prvAmount = getCreditorBalance();
        uint currentCredit = creditorsAmount[msg.sender] - totalWithdrawAmount;
        creditorsAmount[msg.sender] = currentCredit;
        payable(msg.sender).transfer(totalWithdrawAmount);

        return (
            true,
            string(
                abi.encodePacked(
                    latestObf,
                    " Withdrow to account (",
                    addressToString(msg.sender),
                    ") Done. The withdrowed amount is ",
                    Strings.toString(totalWithdrawAmount),
                    ". Previous balance was ",
                    Strings.toString(prvAmount),
                    " wei, current balance is ",
                    Strings.toString(getCreditorBalance()),
                    " wei."
                )
            )
        );
    }

    function parseClearRecord(
        string memory aRecord
    ) public view returns (ClearRecord memory) {
        // 2:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955:10000:2a2f2198
        ClearRecord memory clR;
        string[] memory recordSegments = rgUtilsContract.splitString(
            aRecord,
            ":"
        );
        clR.serialNumber = recordSegments[0];
        clR.creditor = recordSegments[1];
        clR.amount = rgUtilsContract.stringToNumeric(recordSegments[2]);
        clR.salt = recordSegments[3];
        return clR;
    }

    function alreadyWithdrawed(string memory obf) public view returns (bool) {
        return withdrawedRecords[obf];
    }

    function setAsWithdrawed(string memory obf) public returns (bool) {
        withdrawedRecords[obf] = true;
        emit ObfBurntEvent(obf);
        return withdrawedRecords[obf];
    }

    /**
 
 
    struct ObfuscatedRecord {
        string serialNumber;
        uint256 amount;
        string hashedClearRecord;
    }

    function parseObfRecord(
        string memory aRecord
    ) public returns (ObfuscatedRecord memory) {
        ObfuscatedRecord memory obfR;
        string[] memory recordSegments = rgUtilsContract.splitString(
            aRecord,
            ":"
        );
        obfR.serialNumber = recordSegments[0];
        obfR.amount = rgUtilsContract.stringToNumeric(recordSegments[1]);
        obfR.hashedClearRecord = recordSegments[2];
        return obfR;
    }
 */

    function withdraw(
        string calldata _msg, // a string of comma seperated records
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
}
