const axios = require("axios");

const COINGECKO = "https://api.coingecko.com/api/v3/simple/price";

const getPrices = () => {
    return axios
        .get(`${COINGECKO}?ids=binancecoin%2Cfam-token&vs_currencies=usd`)
        .then(res => [res.data["binancecoin"].usd, res.data["fam-token"].usd]);
}

module.exports = { getPrices }