

export function getPrticipantsList() {    
}

export function addTicket(address, hashedLuckyNumber, oracleMerkleRoot ) {    
}

export function revealTicket(address, hashedLuckyNumber, oracleMerkleRoot, clearNumber, oracleJsonObject) {    
}

export function findWinners() {    
    // based on lucky number and oracle facts, would be one or more the winner
}

export function etherPriceFinder() {
    // in order to prevent vector attack, the price must be enough near to 3 famous exchanges API    
    // this function works on ether price oracle claims
    //

    return {
        "price": 2700.54,
        "winners": ["address1", "address2"],
    }
}

export function getPrticiparList() {    
}

export function getPrticiparList() {    
}

export function getPrticiparList() {    
}


let clearNumber = 1234;
let oracleJsonObject = {
    "ETH_to_USD": 3700.53,
    "BTC_to_USD": 45209.17,
    "USDT_to_USD": 1.02,
    "1_gram_GOLD_18_to_USD": 1453.62,
}
revealTicket("address", "hashedLuckyNumber", "oracleMerkleRoot", 
clearNumber, oracleJsonObject);

