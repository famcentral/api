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

// Calculate Circulating Supply
const lockedAddress = [
    "0x7DfF18934a2d489F076085372CE7992150Bc2e43",
    "0x40c395d8bedEBB87eA7Ee3061F0C7d2D8FCc3738",
    "0x07d4B87Ac8f4350CB64c067d6b9620aE9cBf7eb2",
    "0x5b6e81851431Da338502C6b4509dc8ec97E7eDfe",
    "0xC58592c38e5284BD49236eB6049FFBa73aFce192",
    "0x5A8f9b6A3be3A079aAAa57c778Db7f50AFa896C6",
    "0x67E66ae13858988D6328B8Da10671D8BA6540b47",
    "0x08f3521E2F0CFe27e923a1F51260A4FF4fC6ecf4",
    "0xB3696859d9bD2f5e89bCfA46948689cd00500A80",
    "0x35A8f80F27A8cf0752aAfbA68370e7ec9A1e56ee",
];
let supplyCache = "5450000";
let supplyCacheTime = 0;

async function getCirculatingSupply() {
    if (Date.now() - supplyCacheTime > 300000000) {
        console.log("getCirculatingSupply update cache");
        try {
            const web3 = new Web3("https://bsc-dataseed.binance.org");
            const famContract = new web3.eth.Contract(Erc20Abi, famTokenAddress);
            let supply = web3.utils.toBN(await famContract.methods.totalSupply().call());
            for (let address of lockedAddress) {
                const balance = await famContract.methods.balanceOf(address).call();
                supply = supply.sub(web3.utils.toBN(balance));
            }
            supplyCache = web3.utils.fromWei(supply.toString(), "ether");
            supplyCacheTime = Date.now();
        } catch (err) { console.log("getCirculatingSupply error:", err) }
    }
    return supplyCache;
}

// Rest API
const app = express();

app.get("/info", async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json');
    res.send({ liquidity: await getLiquidity() });
});

app.get("/supply", async function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'text/plain');
    res.send(await getCirculatingSupply());
});

app.listen(1786);