// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

import "./MessageVerifier.sol";
import "./RGUtils.sol";
import "./StructuresInterface.sol";

contract RoyalGrow is StructuresInterface {
    string public version;
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
    uint public lastUpdateDCMerkleRoot;
    uint public dCMerkleRootCoolDownWindowTime;
    uint public dCMerkleRootWithdrawWindowTime;

    enum State {
        Running,
        Paused
    }
    State public contractState;

    uint dcSerialNumber;
    mapping(uint => bytes8) public dcMerkleRoots;

    string[] public withdrawedRecords;
    uint256 public withdrawedRecordsCounter;
    uint256 public maxWRecCounter;
    // mapping(string => bool) public withdrawedRecords;

    mapping(address => uint) public creditorsAmount;
    mapping(address => uint) public creditorsUpdate;
    mapping(address => mapping(uint => uint256)) public WithdrawalsQueue;

    event PayToContractEvent(address sender, uint amount, uint256 uniqueId);
    event WithdrawEvent(
        address indexed withdrawer,
        string withdrawMsg,
        bytes signature,
        uint256 amount,
        uint256 timestamp
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
        version = "0.0.0";
        verifierContractAddress = _verifierContractAddress;
        verifierContract = MessageVerifier(verifierContractAddress);
        rgUtilsContractAddress = _rgUtilsContractAddress;
        rgUtilsContract = RGUtils(rgUtilsContractAddress);

        owner = msg.sender;
        txFee = 1000;
        trialFundingCost = 10000;
        contractState = State.Running;

        dcSerialNumber = 0;
        if (msg.value > 0) {
            uint256 uniqueId = rgUtilsContract.generateUniqueId();
            emit PayToContractEvent(msg.sender, msg.value, uniqueId);
        }

        withdrawedRecordsCounter = 0;
        maxWRecCounter = 0;

        lastUpdateDCMerkleRoot = block.timestamp;
        dCMerkleRootCoolDownWindowTime = 2;
        dCMerkleRootWithdrawWindowTime = 1;
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

    // FIXME: need to add onlyAdmin() modifier
    function updateCreditsMerkleRoot(
        bytes8 newDCRoot
    ) public returns (bool stat_, string memory msg_) {
        if (!dCUpdateAllowed()) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "You are in withdrawal phase, so you are not allowed to update DCRoot!",
                        " Block.timestamp(",
                        Strings.toString(block.timestamp),
                        ") lastUpdateDCMerkleRoot(",
                        Strings.toString(lastUpdateDCMerkleRoot),
                        ") dCMerkleRootCoolDownWindowTime(",
                        Strings.toString(dCMerkleRootCoolDownWindowTime * 60),
                        ") dCMerkleRootWithdrawWindowTime(",
                        Strings.toString(dCMerkleRootWithdrawWindowTime * 60)
                    )
                )
            );
        }

        dcSerialNumber++;
        dcMerkleRoots[dcSerialNumber] = newDCRoot;
        lastUpdateDCMerkleRoot = block.timestamp;

        emit CreditsMerkleRootUpdatedEvent(dcSerialNumber, newDCRoot);

        return (
            true,
            string(
                abi.encodePacked(
                    "DCRoot updated serialNumber(",
                    Strings.toString(dcSerialNumber),
                    ") date(",
                    Strings.toString(lastUpdateDCMerkleRoot),
                    ")"
                )
            )
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
    ) public view returns (bool, string memory) {
        ClearRecord memory clR = rgUtilsContract.parseClearRecord(clearRecord);
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

    function merkleRootIsMatured() public view returns (bool) {
        // two minutes for cool down the new DC and
        // Being aware of the possible betrayal of the agent by issuing new corrupted DC & Merkle Root
        // FIXME: this 2 minutes would be a barrier for good UX. this time should be calculated dinamycally
        return
            lastUpdateDCMerkleRoot + (dCMerkleRootCoolDownWindowTime * 60) <=
            block.timestamp;
    }

    function dCUpdateAllowed() public view returns (bool) {
        // update DCRoot ->
        // 2 minutes not allowed withdraw, not allowed update DCRoot ->
        // 1 minute allowed withdraw, but not allowed update DC Root ->
        // repeat the cycle
        return
            lastUpdateDCMerkleRoot +
                (dCMerkleRootCoolDownWindowTime * 60) +
                (dCMerkleRootWithdrawWindowTime * 60) <=
            block.timestamp;
    }

    function withdrawDummy(
        string calldata _msg, // a string of comma seperated records
        uint256 _amount,
        string calldata signer,
        bytes memory signature // signed records
    ) public returns (bool, string memory) {
        // check if the signer is the msg.sender
        if (
            !rgUtilsContract.areStrsEqual(
                signer,
                rgUtilsContract.addressToString(msg.sender)
            )
        ) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "Tx Sender(",
                        rgUtilsContract.addressToString(msg.sender),
                        ") is not the signer(",
                        signer,
                        ")"
                    )
                )
            );
        }

        // check the signatur of clear record
        if (
            !verifierContract.isValidSignature(
                keccak256(abi.encodePacked("withdraw", _msg)),
                signature,
                msg.sender
            )
        ) {
            return (false, "Invalid signature");
        }

        string[] memory creditRecords = rgUtilsContract.splitString(_msg, "+");

        WithDrawState memory wStat;
        wStat.records = new string[](16); // due to gas limits, in every withdraw request, we can apply maximum 16 records
        wStat.recordCounter = 0;
        wStat.total = 0;

        for (uint inx = 0; inx < creditRecords.length; inx = inx + 2) {
            string[] memory proofs = rgUtilsContract.splitString(
                creditRecords[inx + 1],
                ","
            );

            ClearRecord memory clR = rgUtilsContract.parseClearRecord(
                creditRecords[inx]
            );

            // check if signer is equal to creditor(the address in clear record)
            if (
                !rgUtilsContract.areStrsEqual(
                    rgUtilsContract.addressToString(msg.sender),
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
                            rgUtilsContract.addressToString(msg.sender),
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
                    rgUtilsContract.doKeccak256(creditRecords[inx])
                )
            );

            if (alreadyWithdrawed(regenObf)) {
                return (
                    false,
                    string(abi.encodePacked("Already withdrawed ", regenObf))
                );
            }

            // check if given proof is correct
            (
                bool proofIsValid,
                string memory proofValidateMsg
            ) = validateDCProof(regenObf, proofs, true);
            if (!proofIsValid) {
                return (false, proofValidateMsg);
            }
            // check double-spend in same transaction
            for (uint256 j = 0; j < wStat.recordCounter; j++) {
                if (rgUtilsContract.areStrsEqual(regenObf, wStat.records[j])) {
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
            wStat.records[wStat.recordCounter] = regenObf;
            wStat.recordCounter += 1;

            wStat.total += clR.amount;
        }

        // check if withdraw amount coincides records sum
        if (_amount != wStat.total) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "Discrepancy in withdraw amount(",
                        Strings.toString(_amount),
                        ") and records sum(",
                        Strings.toString(wStat.total),
                        ") "
                    )
                )
            );
        }

        // check if merkle root is matured
        if (!merkleRootIsMatured()) {
            return (
                false,
                string(
                    abi.encodePacked(
                        "DC Merkle root is not matured! wait!",
                        " Block.timestamp(",
                        Strings.toString(block.timestamp),
                        ") lastUpdateDCMerkleRoot(",
                        Strings.toString(lastUpdateDCMerkleRoot),
                        ") dCMerkleRootCoolDownWindowTime(",
                        Strings.toString(dCMerkleRootCoolDownWindowTime * 60),
                        ") dCMerkleRootWithdrawWindowTime(",
                        Strings.toString(dCMerkleRootWithdrawWindowTime * 60)
                    )
                )
            );
        }

        // real transfer fund
        string memory latestObf;
        for (uint256 i = 0; i < wStat.recordCounter; i++) {
            bool tmpRes = setAsWithdrawed(wStat.records[i]);
            latestObf = string(
                abi.encodePacked(latestObf, " + ", wStat.records[i])
            );
            if (!tmpRes)
                return (
                    false,
                    string(
                        abi.encodePacked(
                            wStat.records[i],
                            " Obf burning not setted!"
                        )
                    )
                );
        }

        uint prvAmount = getCreditorBalance();
        uint currentCredit = creditorsAmount[msg.sender] - wStat.total;
        creditorsAmount[msg.sender] = currentCredit;
        payable(msg.sender).transfer(wStat.total);

        emit WithdrawEvent(
            msg.sender,
            _msg,
            signature,
            _amount,
            block.timestamp
        );

        return (
            true,
            string(
                abi.encodePacked(
                    latestObf,
                    " Withdrow to account (",
                    rgUtilsContract.addressToString(msg.sender),
                    ") Done. The withdrowed amount is ",
                    Strings.toString(wStat.total),
                    ". Previous balance was ",
                    Strings.toString(prvAmount),
                    " wei, current balance is ",
                    Strings.toString(getCreditorBalance()),
                    " wei."
                )
            )
        );
    }

    function alreadyWithdrawed(string memory obf) public view returns (bool) {
        for (uint256 i = 0; i < withdrawedRecordsCounter; i++) {
            if (rgUtilsContract.areStrsEqual(withdrawedRecords[i], obf))
                return true;
        }

        return false; //withdrawedRecords[obf];
    }

    function setAsWithdrawed(string memory obf) public returns (bool) {
        if (withdrawedRecordsCounter < maxWRecCounter) {
            withdrawedRecords[withdrawedRecordsCounter] = obf;
        } else {
            withdrawedRecords.push(obf);
        }
        withdrawedRecordsCounter = withdrawedRecordsCounter + 1;
        emit ObfBurntEvent(obf);
        return alreadyWithdrawed(obf);
    }

    function resetWithdrawed() public returns (uint256, uint256) {
        if (maxWRecCounter < withdrawedRecordsCounter)
            maxWRecCounter = withdrawedRecordsCounter;
        uint256 currentCounter = withdrawedRecordsCounter;
        withdrawedRecordsCounter = 0;
        return (maxWRecCounter, currentCounter);
    }

    function getWithdrawedInfoByIndex(
        uint256 inx
    ) public view returns (string memory obf) {
        if (inx < withdrawedRecordsCounter) return withdrawedRecords[inx];
        return "Out of range";
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

    /**

    function withdraw(
        //string calldata _msg, // a string of comma seperated records
        uint256 _amount
    )
        external
        returns (
            //string calldata _sig
            bool
        )
    {
        uint8 stage = 0;
        emit WithdrawEvent(msg.sender, _amount, block.timestamp, stage);

        require(_amount > 0, "Withdrawal amount must be greater than zero");
        require(creditorsAmount[msg.sender] >= _amount, "Insufficient fund");

        if (WithdrawalsQueue[msg.sender][_amount] == 0) {
            stage = 1; // we are in stage 1 which means creaditor asked for withdraw
            WithdrawalsQueue[msg.sender][_amount] = block.timestamp;
            // check if merkle proffs are valid
            // signed message _msg = signature::v0.0.0:publicKey::proof1:proof2:proof3
            // Initialize the result array
            string[] memory parts = macroParseMsg(_msg);
            string memory signature = parts[0];
            //string memory version = parts[1];
            string memory signedMsg = string(abi.encodePacked(parts[1], parts[2]));
            require(verifyMessageSignature(signedMsg, bytes(signature), msg.sender));

            emit WithdrawEvent(msg.sender, _amount, block.timestamp, stage);
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

            emit WithdrawEvent(
                msg.sender,
                applyableWithdraw,
                block.timestamp,
                stage
            );
            return true;
        }
    }

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
}
