// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract StructuresInterface {

    struct DCProfile {
        uint256 serialNumber;
        bytes8 rootHash;
    }

    struct WithDrawState {
        string[] records;
        uint256 recordCounter;
        uint256 total;
    }
    
    struct ClearRecord {
        string serialNumber;
        string creditor;
        uint256 amount;
        string salt;
    }
}