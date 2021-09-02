const express = require("express");
const Web3 = require("web3");
const { getPrices } = require("./helper");
const Erc20Abi = require("./abis/Erc20.json");

const famTokenAddress = "0x4556A6f454f15C4cD57167a62bdA65A6be325D1F";

// Calculate Total Value Locked
const poolAddress = "0x9804fC036a283C687f2c034bf5220070fD885A54";
let liquidityCache = "";
let liquidityCacheTime = 0;

async function getLiquidity() {
    if (Date.now() - liquidityCacheTime > 300000) {
        console.log("getLiquidity update cache");
        try {
            const web3 = new Web3("https://bsc-dataseed.binance.org");
            const [bnbPrice, famPrice] = await getPrices();
            const famContract = new web3.eth.Contract(Erc20Abi, famTokenAddress);

            const poolFamBalance = web3.utils.toBN(await famContract.methods.balanceOf(poolAddress).call());
            const liquidity = poolFamBalance.mul(web3.utils.toBN(Math.floor(famPrice * 1000))).div(web3.utils.toBN(1000));

            liquidityCache = web3.utils.fromWei(liquidity, "ether");
            liquidityCacheTime = Date.now();
        } catch (err) { console.log("getLiquidity error:", err) }
    }
    return liquidityCache;
}

// Rest API
const app = express();

app.get("/info", async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json');
    res.send({ liquidity: await getLiquidity() });
});

app.listen(1786);