// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract MessageVerifier {
    // Function to verify a message signature
    function verifySignature(
        string memory message,
        bytes memory signature,
        address signer
    ) public pure returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(message));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);
        return recoveredSigner == signer;
    }

    // Function to recover signer from signature
    function recoverSigner(bytes32 hash, bytes memory signature)
        internal
        pure
        returns (address)
    {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            // First 32 bytes store the length of the signature
            // Add 0x20 to skip the length field
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // Version of signature should be 27 or 28, but in some cases might be 0 or 1
        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature version");

        return ecrecover(hash, v, r, s);
    }
}
