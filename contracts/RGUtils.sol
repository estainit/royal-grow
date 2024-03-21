// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./StructuresInterface.sol";

contract RGUtils is StructuresInterface{

    function parseClearRecord(
        string memory aRecord
    ) public pure returns (ClearRecord memory) {
        // 2:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955:10000:2a2f2198
        ClearRecord memory clR;
        string[] memory recordSegments = splitString(
            aRecord,
            ":"
        );
        clR.serialNumber = recordSegments[0];
        clR.creditor = recordSegments[1];
        clR.amount = stringToNumeric(recordSegments[2]);
        clR.salt = recordSegments[3];
        return clR;
    }

    function pSubstring(
        string memory str,
        uint256 startIndex,
        uint256 endIndex
    ) public pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint256 i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function getStringLength(string memory str) public pure returns (uint256) {
        return bytes(str).length;
    }

    function doKeccak256(
        string memory data
    ) public pure returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(data));
        hash = keccak256(abi.encodePacked(pSubstring(toHex(hash), 2, 66)));
        return pSubstring(toHex(hash), 2, 10);
    }

    function toHex16(bytes16 data) internal pure returns (bytes32 result) {
        result =
            (bytes32(data) &
                0xFFFFFFFFFFFFFFFF000000000000000000000000000000000000000000000000) |
            ((bytes32(data) &
                0x0000000000000000FFFFFFFFFFFFFFFF00000000000000000000000000000000) >>
                64);
        result =
            (result &
                0xFFFFFFFF000000000000000000000000FFFFFFFF000000000000000000000000) |
            ((result &
                0x00000000FFFFFFFF000000000000000000000000FFFFFFFF0000000000000000) >>
                32);
        result =
            (result &
                0xFFFF000000000000FFFF000000000000FFFF000000000000FFFF000000000000) |
            ((result &
                0x0000FFFF000000000000FFFF000000000000FFFF000000000000FFFF00000000) >>
                16);
        result =
            (result &
                0xFF000000FF000000FF000000FF000000FF000000FF000000FF000000FF000000) |
            ((result &
                0x00FF000000FF000000FF000000FF000000FF000000FF000000FF000000FF0000) >>
                8);
        result =
            ((result &
                0xF000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000) >>
                4) |
            ((result &
                0x0F000F000F000F000F000F000F000F000F000F000F000F000F000F000F000F00) >>
                8);
        result = bytes32(
            0x3030303030303030303030303030303030303030303030303030303030303030 +
                uint256(result) +
                (((uint256(result) +
                    0x0606060606060606060606060606060606060606060606060606060606060606) >>
                    4) &
                    0x0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F) *
                39
        );
    }

    function toHex(bytes32 data) public pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "0x",
                    toHex16(bytes16(data)),
                    toHex16(bytes16(data << 128))
                )
            );
    }

    function stringToNumeric(
        string memory _input
    ) public pure returns (uint256) {
        uint256 total = 0;
        uint256 length = bytes(_input).length;

        for (uint256 i = 0; i < length; i++) {
            uint256 positionValue = uint256(uint8(bytes(_input)[i])) - 48; // Convert ASCII to numeric value
            require(
                positionValue >= 0 && positionValue <= 9,
                "Invalid character in input string"
            );

            uint256 multiplier = 10 ** (length - i - 1);
            total += positionValue * multiplier;
        }

        return total;
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

    function areStrsEqual(
        string memory left,
        string memory right
    ) public pure returns (bool) {
        return
            keccak256(abi.encodePacked(left)) ==
            keccak256(abi.encodePacked(right));
    }

    function bytes8ToAsciiString(
        bytes8 data
    ) public pure returns (string memory) {
        bytes memory asciiString = new bytes(8); // 1 ASCII character per byte, so 8 characters for 8 bytes

        for (uint i = 0; i < 8; i++) {
            asciiString[i] = bytes1(uint8(data[i])); // Convert byte to ASCII representation
        }

        return string(asciiString);
    }

    function bytesToBytes32(bytes memory data) public pure returns (bytes32) {
        bytes32 result;
        assembly {
            result := mload(add(data, 32))
        }
        return result;
    }
    /**
    function split(
        string memory str,
        bytes1 delimiter
    ) public pure returns (string[] memory) {
        uint256[] memory indexes = new uint256[](bytes(str).length);
        uint256 count = 0;
        for (uint256 i = 0; i < bytes(str).length; i++) {
            if (bytes(str)[i] == delimiter) {
                indexes[count] = i;
                count++;
            }
        }

        string[] memory result = new string[](count + 1); // Account for empty parts
        uint256 startIndex = 0;
        for (uint256 i = 0; i < count; i++) {
            result[i] = slice(str, startIndex, indexes[i] - startIndex);
            startIndex = indexes[i] + 1;
        }
        result[count] = slice(str, startIndex, bytes(str).length - startIndex);
        return result;
    }

    function slice(
        string memory str,
        uint256 from,
        uint256 to
    ) public pure returns (string memory) {
        bytes memory result = new bytes(to - from);
        for (uint256 i = from; i < to; i++) {
            result[i - from] = bytes(str)[i];
        }
        return string(result);
    }
 */
    function splitString(
        string memory str,
        string memory delimiter
    ) public pure returns (string[] memory) {
        uint delimiterLength = bytes(delimiter).length;
        uint startIndex = 0;
        uint count = 0;

        // Count the number of occurrences of the delimiter
        for (uint i = 0; i < bytes(str).length - delimiterLength + 1; i++) {
            if (isEqualSubstring(str, delimiter, i, delimiterLength)) {
                count++;
                i += delimiterLength - 1;
            }
        }

        // Create an array to store the substrings
        string[] memory parts = new string[](count + 1);
        uint partIndex = 0;

        // Split the string into parts
        for (uint i = 0; i < bytes(str).length - delimiterLength + 1; i++) {
            if (isEqualSubstring(str, delimiter, i, delimiterLength)) {
                parts[partIndex++] = aSubstring(
                    str,
                    startIndex,
                    i - startIndex
                );
                startIndex = i + delimiterLength;
                i += delimiterLength - 1;
            }
        }

        // Add the last part
        parts[partIndex] = aSubstring(
            str,
            startIndex,
            bytes(str).length - startIndex
        );

        return parts;
    }

    function isEqualSubstring(
        string memory a,
        string memory b,
        uint startIndex,
        uint length
    ) private pure returns (bool) {
        for (uint i = 0; i < length; i++) {
            if (bytes(a)[startIndex + i] != bytes(b)[i]) {
                return false;
            }
        }
        return true;
    }

    function aSubstring(
        string memory str,
        uint startIndex,
        uint length
    ) private pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(length);
        for (uint i = 0; i < length; i++) {
            result[i] = strBytes[startIndex + i];
        }
        return string(result);
    }
}
