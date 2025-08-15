const mode = "mainnet";
const status = "production";

export default {
    rpcUrl: mode === "mainnet" && status === "production" ? "https://api.corearena.xyz" : "http://localhost:443",
    indexerUrl: mode === "mainnet" && status === "production" ? "http://localhost:444" : "http://localhost:444",
    chainId: mode === "mainnet"  ? "0x45c" : "",
    ethRpcUrl: mode === "mainnet"  ? "https://rpc.coredao.org" : "",
    chainName: mode === "mainnet"  ? "Core Blockchain" : "Core Testnet",
    nativeCurrency: {
        name: "CORE",
        symbol: "CORE",
        decimals: 18
    },
    blockExplorerUrls: "https://scan.coredao.org",
    site: "https://corearena.xyz",
    twitter: "https://x.com/corearena_xyz",
    discord: "https://discord.gg/eNXuhN22JX"
}

//http://localhost:443
//https://api.corearena.xyz
//test