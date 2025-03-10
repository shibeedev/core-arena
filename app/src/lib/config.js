const mode = "mainnet";

export default {
    rpcUrl: mode === "mainnet" ? "https://api.corearena.xyz" : "",
    indexerUrl: mode === "mainnet" ? "https://api.corearena.xyz" : "",
    chainId: mode === "mainnet" ? "0x45c" : "",
    ethRpcUrl: mode === "mainnet" ? "https://rpc.coredao.org" : "",
    chainName: mode === "mainnet" ? "Core Blockchain" : "Core Testnet",
    nativeCurrency: {
        name: "CORE",
        symbol: "CORE",
        decimals: 18
    },
    blockExplorerUrls: "https://scan.coredao.org",
    site: "https://corearena.xyz",
    twitter: "https://x.com/corearena_xyz"
}
