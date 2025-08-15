<script>
    import { fly } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { erc721ABI, erc721Bytecode, erc721Merkle, erc721Simple } from "$lib/contract.config.js";
    import { onMount } from 'svelte';
    import { ethers } from "ethers";
    import { page } from '$app/stores';
    import { goto } from "$app/navigation";
    import Loading from "$lib/Loading.svelte";
    import config from "$lib/config.js";
    import {bigIntToFloat, formatTimeLeft} from "$lib/index.js";
    import { marked } from 'marked'; // Add this import for Markdown parsing
    import { emitBetweenText } from '$lib/index.js';
    import { addNFTToWallet} from '$lib/localWalletStorage.js';

    const simpleCollections = {
        "0xa2C7b5aD89FAF313fD734c1B810583A765048A8b": {
            total: 1000
        }
    }

    const temCollections =
    {
        "": {
            total: "",
            freemintItem:"",
            publicItem:"",
            freemintTime:"",
            publicTime:"",
            publicPrice:"",
            mintedFree:"",
            mintedPublic:"",
        }

    }


    //mint load
    let mintLoad = true;
    let mintLoad2 = true;

    let frontAddress, yourFrontWlSlots, yourFrontFmSlots
    let fmAddress = []; 
    let wlAddress = []; 

    const tokens = $page.url.pathname.split("/");
    const collectionAddress = tokens.at(-1);
    
    let loading = false, done = false, loadMintInfo = true, loadTotalMint = true;
    let mint, getRarity;

    let collectionName = "Loading", collectionDescription = "Loading";

    let startFreemint, deadlineFreemint, startWhitelist , deadlineWhitelist , startPublic,  deadlinePublic, publicPriceFire, limitPublicPerAddress, inlineContentMD

    let mintedAmount = 0, totalAmount = 0;
    let totalWhitelist = 0, totalFree = 0, totalPublic = 0;
    let mintedWhitelist = 0, mintedFree = 0, mintedPublic = 0;
    let whitelistSlots = 0, freeSlots = 0, publicSlots = 0;
    let whitelistPrice = "0", publicPrice = "0";
    let resultMetadata = { description: "", attributes: [] }, resultId = "1", minted = false, imgLoad = true;

    let attributePoints = {}; 
    let totalAttributePoints = {};
    let nftPoints = {};

    let provider, signer, address;

    let websiteLink, twitterLink, discordLink, telegramLink;

    async function walletHelper() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (error) {
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: config.chainId,
                            rpcUrls: [config.ethRpcUrl],
                            chainName: config.chainName,
                            nativeCurrency: {
                                name: config.nativeCurrency.name,
                                symbol: config.nativeCurrency.symbol,
                                decimals: 18
                            },
                            blockExplorerUrls: [config.blockExplorerUrls]
                        }]
                    });
                    console.log('Network added to MetaMask');
                } catch (addError) {
                    console.error('Failed to add the network:', addError);
                }
            } else {
                console.error('Failed to switch to the network:', error);
            }
        }

        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

        if (accounts.length) {
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
        }

        const { chainId } = await provider.getNetwork();

        if (chainId !== parseInt(config.chainId)) throw new Error(`Network must be ${config.chainName}`);
    }

    
    onMount(() => {
        if (simpleCollections[collectionAddress]) {
            mint = async function() {
                loading = true;
                await walletHelper();
                try {
                    const collectionContract = new ethers.Contract(collectionAddress, erc721Simple, signer);
                    const mintTx = await collectionContract.mintNFT(address);
                    const receipt = await mintTx.wait();
                    const event = receipt.events.find(event => event.event === "Transfer");
                    const id = event.args[2].toString();


                    //addNFTToLocalList(collectionAddress, id);
                    addNFTToWallet(address, { collectionAddress, id });
                    const { metadata } = await getNFTInfo(collectionAddress, id, [ "owner", "collectionName", "offers", "listingDetails" ]);

                    resultMetadata = metadata;

                    // Extract attributes from metadata
                    const nftAttributes = resultMetadata?.attributes?.map(attr => ({ 
                        attribute: attr.trait_type, 
                        value: attr.value 
                    })) || [{ attribute: "Default", value: "BasicAttack" }];

                    // Call API to generate skills
                    try {
                        await fetch(config.rpcUrl, {
                            method: "POST",
                            body: JSON.stringify({
                                method: "generateNFTSkill",
                                params: {
                                    collectionAddress,
                                    attributes: nftAttributes,
                                    tokenId: id,    
                                    userAddress: address 
                                }
                            }),
                            headers: {
                                "Content-Type": "application/json"
                            }
                        });
                        console.log("Skills generated for minted NFT");
                    } catch (error) {
                        console.error("Failed to generate skills for minted NFT:", error);
                    }

                    loading = false; 

                    resultId = id;
                    minted = true;

                } catch (e) {
                    loading = false;

                    throw e;
                } 
            }
        } else {
            mint = async function(option) {
                loading = true;
                await walletHelper();
                // Get merkle proof 
                const response = await fetch(config.rpcUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        method: "getGameMintMerkleProof",
                        params: {
                            address,
                            contract: collectionAddress,
                            option
                        }
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    try {
                        const responseBody = await response.json();
                        const proof = responseBody.payload.proof;
                        const drop = responseBody.payload.drop;


                        const collectionContract = new ethers.Contract(collectionAddress, erc721Merkle, signer);
                        const mintTx = await collectionContract.mint(
                            address,
                            BigInt(drop.tokenId),
                            drop.tokenURI,
                            option !== "public" && !drop.fcfsWhitelist,
                            proof,
                            {
                                value: BigInt(drop.price)
                            }
                        );

                        await mintTx.wait();
                        const { metadata } = await getNFTInfo(collectionAddress, drop.tokenId, [ "owner", "collectionName", "offers", "listingDetails" ]);
                        resultMetadata = metadata;

                        loading = false; 
                        resultId = drop.tokenId;
                        addNFTToWallet(address, { collectionAddress, resultId });
                        minted = true;
                        
                        
      
                    } catch (e) {
                        loading = false;
                        errorFrontCode =(e.code);
                        console.log(errorFrontCode);
                        throw e;
                        
                    }
                } else {
                    const responseBody = await response.json();
                    loading = false; 

                    if (responseBody.error && responseBody.error.message) {
                        errorFrontCode = responseBody.error.message;
                        throw new Error(responseBody.error.message);
                    }
                }
            }
        }

        function addNFTToLocalList(collectionAddress, id) {
            const nftList = JSON.parse(localStorage.nftList || "[]");

            let check = true;

            for (const nft of nftList) {
                if (nft.collectionAddress === collectionAddress && nft.id === id) {
                    check = false;
                    break;
                }
            }

            if (check) nftList.push({ collectionAddress, id });

            localStorage.nftList = JSON.stringify(nftList);
        }

        if (simpleCollections[collectionAddress]) {
            (async function getTotalMintAmount() {
                try {
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    address = await signer.getAddress();
                } catch (e) {
                    console.log("Address", e);

                    address = "";
                }

                const response = await fetch(config.rpcUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        method: "getSimpleMintAmount",
                        params: {
                            address: collectionAddress
                        }
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const responseBody = await response.json();

                    mintedAmount = responseBody.payload.total;
                    totalAmount = simpleCollections[collectionAddress].total;
                } else {
                    const responseBody = await response.json();

                    if (responseBody.error && responseBody.error.message) {
                        throw new Error(responseBody.error.message);
                    }
                }
            })();
        } else {
            (async function getMintInfo() {
                mintLoad = true;
                try {
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    address = await signer.getAddress();
                } catch (e) {
                    address = "";
                }

                const response = await fetch(config.rpcUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        method: "getMintInfo",
                        params: {
                            address,
                            contract: collectionAddress
                        }
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const responseBody = await response.json();


                    mintedWhitelist = responseBody.payload.whitelistAmount;
                    mintedFree = responseBody.payload.freeAmount;
                    mintedPublic = responseBody.payload.publicAmount;
                    whitelistSlots = responseBody.payload.whitelistSlots;
                    freeSlots = responseBody.payload.freeSlots;
                    publicSlots = responseBody.payload.publicSlots;
                    whitelistPrice = responseBody.payload.whitelistPrice;
                    publicPrice = responseBody.payload.publicPrice;

                    mintedAmount = mintedWhitelist + mintedPublic + mintedFree;

                    loadMintInfo = false;

                    mintLoad = false;
                } else {
                    const responseBody = await response.json();
                    mintLoad = false;
                    if (responseBody.error && responseBody.error.message) {
                        
                        throw new Error(responseBody.error.message);
                    }
                }
            })();

            (async function getTotalMintAmount() {
                const response = await fetch(config.rpcUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        method: "getTotalMintAmount",
                        params: {
                            address: collectionAddress
                        }
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const responseBody = await response.json();

                    totalWhitelist = responseBody.payload.whitelistAmount;
                    totalFree = responseBody.payload.freeAmount;
                    totalPublic = responseBody.payload.publicAmount;

                    totalAmount = totalWhitelist + totalPublic + totalFree;

                    loadTotalMint = false;
                } else {
                    const responseBody = await response.json();

                    if (responseBody.error && responseBody.error.message) {
                        throw new Error(responseBody.error.message);
                    }
                }
            })();
        }

        (async function getRarity() {

            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getRarityPoints",
                    params: {
                        contract: collectionAddress
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const responseBody = await response.json();

                attributePoints = responseBody.payload.attributePoints;
                totalAttributePoints = responseBody.payload.totalAttributePoints;
                nftPoints = responseBody.payload.nftPoints;

            } else {
                const responseBody = await response.json();

                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        })();

        (async function getLinks() {
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getLinks",
                    params: {
                        address: collectionAddress
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            if (response.ok) {
                const responseBody = await response.json();

                websiteLink = responseBody.payload.website;
                twitterLink = responseBody.payload.twitter;
                discordLink = responseBody.payload.discord;
                telegramLink = responseBody.payload.telegram;

            } else {
                const responseBody = await response.json();

                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        })();

        (async function getSpecificMintCollection() {
            mintLoad2 = true;
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getSpecificMintCollection",
                    params: {
                        address: collectionAddress
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const responseBody = await response.json();
                const collection = responseBody.payload;
                // Set collection name and description
                collectionName = collection.CollectionName;
                collectionDescription = collection.CollectionDescription;
                
                // Set mint durations
                startFreemint = collection.FreemintStartTime;
                deadlineFreemint = collection.FreemintEndTime;
                startWhitelist = collection.WhitelistStartTime;
                deadlineWhitelist = collection.WhitelistEndTime;
                startPublic = collection.PublicStartTime;
                deadlinePublic = collection.PublicEndTime;
                publicPriceFire = collection.PublicPriceFire;
                limitPublicPerAddress = collection.LimitPublicPerAddress;
                inlineContentMD = collection.inlineContentMD
                // You could also use other returned values as needed
                // For example:
                // mintedFreemint = collection.MintedFreemint;
                // mintedWhitelist = collection.MintedWhitelist;
                // mintedPublic = collection.MintedPublic;
                mintLoad2 = false;
            } else {
                const responseBody = await response.json();
                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
                mintLoad2 = false;
            }
        })();

        async function getNFTInfo(address, id, exclude) {
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getNFTInfo",
                    params: {
                        address,
                        id,
                        exclude
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const responseBody = await response.json();

                return responseBody.payload;
            } else {
                const responseBody = await response.json();

                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        }

    });


    let connectToMetamask;

    onMount(async () => {
        connectToMetamask = async function() {
            if (!window.ethereum) {
                window.open("https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn", "_blank");
                return;
            }

            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: config.chainId }],
                });
            } catch (error) {
                if (error.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: config.chainId,
                                rpcUrls: [config.ethRpcUrl],
                                chainName: config.chainName,
                                nativeCurrency: {
                                    name: config.nativeCurrency.name,
                                    symbol: config.nativeCurrency.symbol,
                                    decimals: 18
                                },
                                blockExplorerUrls: [config.blockExplorerUrls]
                            }]
                        });
                        console.log('Network added to MetaMask');
                    } catch (addError) {
                        console.error('Failed to add the network:', addError);
                    }
                } else {
                    console.error('Failed to switch to the network:', error);
                }
            }

            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

            let provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            address = await signer.getAddress();

            location.reload();
        }
            let provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            frontAddress = await signer.getAddress();
            
    });


    $: freemintTimeLeft = deadlineFreemint - dateNow;
    $: freemintTimeStart = startFreemint - dateNow;

    $: whitelistTimeLeft = deadlineWhitelist - dateNow;
    $: whitelistTimeStart = startWhitelist - dateNow

    $: publicTimeLeft = deadlinePublic - dateNow;
    $: publicTimeStart = startPublic - dateNow
    
    let dateNow;
    setInterval(() => {
        dateNow = Date.now();
    }, 1000);

    let loadingAva = true;
    let loadingBanner = true;

    let errorFrontCode = "";
    $: {
        if (errorFrontCode !== "") {
            setTimeout(() => {
                errorFrontCode = "";
            }, 3000);
        }
    }

    // Function to determine the status display
    function getTimeStatus(publicTimeStart, publicTimeLeft) {
        // Case 1: Not started yet
        if (publicTimeStart > 0 && publicTimeLeft > 0) {
            return {
            label: "Starts in:",
            value: formatTimeLeft(publicTimeStart),
            status: "Upcoming"
            };
        } 
        // Case 2: In progress
        else if (publicTimeStart < 0 && publicTimeLeft > 0) {
            return {
            label: "Ends in:",
            value: formatTimeLeft(publicTimeLeft),
            status: "Active"
            };
        } 
        // Case 3: Ended
        else if (publicTimeLeft < 0) {
            return {
            label: "",
            value: "Ended",
            status: "Ended"
            };
        }
        // Default case - should not happen but adding for safety
        else {
            return {
            label: "",
            value: "Unknown Status",
            status: "unknown"
            };
        }
    }
</script>


    <div class="relative flex justify-center bg-black text-white w-full min-h-screen">
        <div class="flex flex-col w-full max-w-screen-2xl mx-auto sm:px-[33px] px-[10px]">
            <!--Back button-->
            <div class="mt-[20px]">
                <button class="flex items-center text-white" on:click={()=>{goto("../rewards")}}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-[20px] w-[20px] mr-[1vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span class="">BACK</span>
                </button>
            </div>
            <!--Container 1-->
            <div class="flex flex-col">
                <div class="flex relative sm:h-[340px] h-[180px] mt-[30px] ">
                    <!--Banner img-->
                    <div class="flex overflow-hidden h-full w-full bg-black parent">
                        <img alt="Collection banner" 
                        class="w-full object-cover h-full shrink-on-hover {loadingBanner?"loading":""}" 
                        src={`${config.rpcUrl}/banner/${collectionAddress}`}
                        on:load={()=>{loadingBanner = false}}/>
                    </div>
                    <!--Stuffs on Banner-->
                    <div class="absolute flex flex-wrap self-end justify-between w-full rounded-md gap-0 mb-0 z-10">
                        <div class="flex items-center gap-2 font-semibold text-2xl py-2 px-6 bg-darkCard bg-opacity-90 rounded-lg shadow-lg">
                            <img alt="Collection avatar" 
                            class="rounded-full inline-block h-[80px] min-w-[80px] {loadingAva?"loading":""}" 
                            src={`${config.rpcUrl}/logo/${collectionAddress}/200/200`}
                            on:load={()=>{loadingAva = false}}/>
                            <div class="flex flex-col">
                                <span class="text-md text-button mb-1">
                                    {collectionName}
                                </span>
                                <span class="text-xs font-normal">
                                    <span class="text-lightStone">
                                        Contract:
                                    </span>
                                    <a class="underline" href="https://scan.coredao.org/address/{collectionAddress}" target="_blank">
                                    {emitBetweenText(collectionAddress, 10)}
                                    </a>
                                </span>
                            </div>
                        </div>

                        {#if startPublic == 123456789101112 && temCollections[collectionAddress] || temCollections[collectionAddress]?.show}
                            <div class="sm:flex hidden justify-end items-center text-lg gap-2 py-1 px-6 bg-darkCard bg-opacity-90 rounded-lg shadow-lg text-button">
                                <span class="text-md font-bold">
                                    {temCollections[collectionAddress].status}
                                </span>
                            </div>
                        {:else if (publicTimeStart > 0 && publicTimeLeft > 0) & (whitelistTimeStart > 0 && whitelistTimeLeft > 0) & (freemintTimeStart > 0 && freemintTimeLeft > 0)}
                            <div class="sm:flex hidden justify-end items-center text-lg gap-2 py-1 px-6 bg-darkCard bg-opacity-90 rounded-lg shadow-lg text-button">
                                <span class="text-md">
                                   Starts in: {formatTimeLeft(freemintTimeStart)}
                                </span>
                                <div class="bg-[#FFED4A] rounded-full h-[13px] w-[13px] mt-[5px]"></div>
                            </div>
                        {:else if (publicTimeStart < 0 && publicTimeLeft > 0) || (whitelistTimeStart < 0 && whitelistTimeLeft > 0)|| (freemintTimeStart < 0 && freemintTimeLeft > 0)}
                            <div class="sm:flex hidden justify-end items-center text-lg gap-2 py-1 px-6 bg-darkCard bg-opacity-90 rounded-lg shadow-lg text-button">
                                <span class="text-button">Minting now</span>
                                <div class="bg-[#14FF00] rounded-full h-[13px] w-[13px] mt-[5px]"></div>
                            </div>
                        {:else if publicTimeLeft < 0 }
                            <div class="sm:flex hidden justify-end items-center text-lg gap-2 py-1 px-6 bg-darkCard bg-opacity-90 rounded-lg shadow-lg text-button">
                                <span class="text-white">Ended</span>
                                <div class="bg-[#14FF00] rounded-full h-[13px] w-[13px] mt-[5px]"></div>
                            </div>
                        {/if}
                    </div>
                </div>
                <!---->
                <div class="flex lg:flex-row flex-col justify-between w-full mt-[50px] lg:gap-[50px] gap-[20px] mb-[100px]">
                    <div class="flex flex-col w-full lg:order-1 order-2">
                        <!--Mint Tiers Container-->
                        <div class="flex w-full flex-col gap-[10px]">
                            <!--Public mint container-->
                            <div class="self-end flex flex-col w-full p-4 rounded-md shadow-lg bg-arenaMedium">
                                <div class="flex flex-wrap justify-between mb-[10px] sm:text-sm text-xs">
                                    <div class="flex gap-2">
                                        <span class="text-lightStone">Minted</span>
                                        <span>
                                            <!--Minted-->
                                            {#if collectionAddress === "0x7f19FD41857d3749142F27c1127112858f4e759D"}
                                                {simpleCollections[collectionAddress] ? (mintedAmount <= totalAmount ? mintedAmount : totalAmount)  : (mintedPublic >= totalPublic? totalPublic:mintedPublic +9)} /
                                            {:else}
                                                {simpleCollections[collectionAddress] ? (mintedAmount <= totalAmount? mintedAmount : totalAmount)  : (mintedPublic >= totalPublic? totalPublic:mintedPublic)} /
                                            {/if}
                                                                                            <!--Total mint-->
                                                {simpleCollections[collectionAddress] ? totalAmount : totalPublic}
                                        </span>
                                    </div>
                                    <div class="flex justify-between items-center gap-[10px]">
                                        <span class="font-normal text-darkGray">{getTimeStatus(publicTimeStart, publicTimeLeft).label}</span>
                                        <span class="text-button">
                                            {getTimeStatus(publicTimeStart, publicTimeLeft).value}
                                        </span>
                                    </div>
                                </div>
                                <!--Mint button-->
                                {#if address !== ""} 
                                    {#if mintLoad2 === false && publicTimeStart &&publicTimeLeft }
                                        {#if publicTimeStart < 0 && publicTimeLeft > 0}
                                            {#if (simpleCollections[collectionAddress] && mintedAmount < totalAmount)  ||  (mintedPublic < totalPublic && publicSlots > 0)}
                                                <button on:click={() => mint("public")} class="self-end flex flex-col w-full py-2 rounded-md shadow-lg text-2xl font-bold bg-button hover:bg-buttonHover" >
                                                    MINT
                                                </button>
                                            {:else}
                                                <div class="self-end flex flex-col w-full p-4 rounded-md shadow-lg bg-lightStone text-2xl font-bold">
                                                    Sold out
                                                </div>
                                            {/if}
                                        {:else}
                                            <button class="self-end flex flex-col w-full p-4 rounded-md shadow-lg bg-lightStone text-2xl font-bold">
                                                Mint not available
                                            </button>
                                        {/if}
                                    {:else}
                                        <div class="self-end justify-center flex w-full p-4 rounded-md shadow-lg bg-lightStone text-2xl font-bold loading">
                                            LOADING
                                        </div>
                                    {/if}
                                {:else}
                                    <button on:click={() => connectToMetamask()} class="text-lg border py-1 px-6 rounded rounded-lg mt-4 text-white font-semibold bg-linearOrange self-hover">
                                        Connect Wallet
                                    </button>
                                {/if}
                                <div class="flex flex-wrap justify-between w-full self-center mt-4 gap-1">
                                    <div class="sm:flex hidden"></div>
                                    <div class="flex flex-col items-center gap-1">
                                        <span class="text-sm text-lightStone">Price</span>
                                        <div class="flex items-center gap-1 font-semibold">
                                            <img class="h-[24px]" src="/icons/CORE.png" alt="coin icon"/>
                                            <span>
                                                {publicPrice}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-center gap-1">
                                        <span class="text-sm text-lightStone">Required</span>
                                        <div class="flex items-center gap-1 font-semibold">
                                            <img class="h-[24px] inline-block mb-[4px]" alt="Arena Fire" src="/game/ui/arenaFire.png"/>
                                            <span>
                                                {publicPriceFire}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-center gap-1">
                                        <span class="text-sm text-lightStone">Max mint </span>
                                        <div class="flex items-center gap-1 font-semibold">
                                            <span>
                                                {limitPublicPerAddress}
                                            </span>
                                        </div>
                                    </div>

                                    <div class="sm:flex hidden"></div>
                                </div>

                            </div>
                        </div>
                        <div class="flex flex-col gap-1 mt-[20px]">
                            {#if collectionDescription || simpleCollections[collectionAddress]?.description}
                                <div class="flex flex-col gap-1">
                                    <span>Description</span> 
                                    <span class="">
                                        {collectionDescription}
                                        {simpleCollections[collectionAddress]?.description}
                                    </span>
                                </div>
                            {/if}
                            {#if inlineContentMD}
                                <div class="flex flex-col markdown-content  border w-full p-4 rounded-md">
                                    {@html marked(inlineContentMD)}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <!--Mint page image-->
                    <div class="flex flex-col lg:order-2 order-1">
                        <div class="relative self-center flex flex-col w-full overflow-hidden max-w-[480px] max-h-[480px] lg:min-w-[480px] lg:min-h-[480px]">
                            <img src={`${config.rpcUrl}/mpimage/${collectionAddress}`} class="object-contain max-h-[480px]  max-w-[480px] lg:min-w-[480px] lg:min-h-[480px]" alt="mint images"/>
                        </div>
                    </div>
                </div> 
            </div>
        </div>
    </div>
{#if loading}
    <Loading/>
{/if}

{#if done}
    <div class="fixed flex font-semibold flex flex-col inset-0 bg-black bg-opacity-60 z-20 mt-[10px] gap-[20px]" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}> 
        <div class="flex flex-col items-center sm:w-[400px] w-[300px] bg-darkCard shadow-md mx-auto my-auto py-4 gap-[20px] rounded-lg shadow">
            <span class="text-4xl text-button">
                Success
            </span>
            <img src="/icons/tick.svg" class="h-[150px] inline-block my-[10px]" alt="done icon"/>
            <button on:click={() => {location.reload()}} class="self-center w-[300px] py-[6px] bg-button rounded-xl font-semibold shadow-md hover:bg-buttonHover text-xl text-white">
                Confirm
            </button>
        </div>
    </div>
{/if}

{#if minted}
    <div class="fixed font-semibold flex flex-col justify-center items-center inset-0 text-white bg-black shadow-md bg-opacity-90 z-30" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
        <div class =" flex flex-col pt-4 pb-8 px-6 bg-darkCard rounded-md max-w-[850px] overflow-hidden">
            <button class="self-end" on:click={()=>{minted = false; location.reload()}}>
                <img class="h-[20px] inline-block" src="/icons/x.png" alt="close icon"/>
            </button>
            <div class ="grid md:grid-cols-2 grid-cols-1 gap-[30px] h-fit rounded-md mt-[10px]" >
                <!--Img container-->
                <div class="flex flex-col">
                    <div class="flex justify-center parent h-fit top-0 col-span-1 flex items-start ">
                        <div class="flex justify-center overflow-hidden rounded-md max-h-[300px] max-w-[300px] {imgLoad? "loading":""}">
                            <img src={`${config.rpcUrl}/cdn/nft/${collectionAddress}/${resultId}/350/350`}
                            class="object-contain shrink-on-hover max-h-[300px] max-w-[300px] 
                            min-h-[300px] min-w-[300px] {imgLoad? "loading":""}"
                            on:load={()=>{imgLoad = false}} alt="your minted NFTs"/>
                        </div>
                    </div>
                </div>
                <!--Detail containers-->
                <div class="flex  flex-col col-span-1 gap-[10px] text-sm max-h-[350px] overflow-y-scroll">
                    <!--Item name-->
                    <span class="text-3xl font-bold text-button ">
                        {collectionName} #{resultId}
                    </span>
                    <!---->
                    <div class="flex justify-between mt-[5px] text-md  ">
                        <!--From collection-->
                        <div class="flex font-semibold items-center">
                            <span class="text-darkGray">from </span>
                            <button on:click={()=>{goto(`../../collections/${collectionAddress}`)}} class="pl-2 pr-1 text-button">{collectionName}</button>
                            <img class="h-4 inline-block" src="/icons/verified.svg" alt="verified icon"/>
                        </div>
                    </div>
                    <!--Description container-->
                    <div class="flex flex-col gap-[5px] my-[5px]">
                        <span class="text-md font-semibold text-darkGray">
                            Description
                        </span>
                        <!--Description-->
                        <span class="text-sm text-white">
                            {resultMetadata?.description}
                        </span>
                    </div>
                    <!--Attribute + Rarity container-->
                    <div class={`flex flex-col text-sm pl-[20px] pt-[10px] pb-[25px] font-semibold gap-[20px] mt-[5px] rounded-lg ${loading ? "loading" : ""}`}>
                        {#if nftPoints[resultId]}
                            <!--Rarity container-->
                            <span class="text-sm font-normal font-semibold">
                                <span class="text-darkGray">Rarity Score:</span>
                                <span>{ nftPoints[resultId] || "Loading" }</span>
                            </span>
                        {/if}
                        {#if resultMetadata?.attributes}
                            <div class="flex flex-wrap justify-between gap-[20px] mr-[20px] text-sm ">
                                {#each resultMetadata.attributes as attribute}
                                    <!--Attribute container-->
                                    <div class="flex flex-col max-w-[330px] min-w-[330px] p-2 rounded-xl border">
                                        <span class="font-medium text-darkGray ">
                                            {attribute["trait_type"]}
                                        </span>
                                        <div class="flex justify-between mt-[2px]">
                                            {attribute["value"]}
                                            <span class="mt-[2px] font-medium text-darkGray">
                                                {#if attributePoints[attribute["trait_type"]]}
                                                    {(attributePoints[attribute["trait_type"]][attribute["value"]])}/{totalAttributePoints[attribute["trait_type"]]}
                                                {/if}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                    <!--Info-->
                    <!--Info Header-->
                    <span class="text-md font-semibold text-darkGray mt-[20px]">
                        Information
                    </span>
                    <!--Info Container-->
                    <div class="flex flex-col border border-white pl-[20px] pr-[25px] pt-[10px] pb-[25px] font-semibold gap-[10px] rounded-lg"> 
                        <div class="flex justify-between">
                            <span class="text-darkGray font-medium">Royalties</span>
                            <span>0%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-darkGray font-medium">Blockchain</span>
                            <span>{config.chainName}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

{#if errorFrontCode !=""}
    <div class="fixed bottom-5 right-10 flex items-center gap-[5px] pl-2 z-10 bg-red-500 md:w-[500px] w-[300px] h-[100px] rounded-md shadow-md" in:fly={{ duration: 500, x: 300 }} out:fly={{ duration: 500, x: 300 }}>
        <img class="h-[20px]" src="/icons/warning.svg" alt="warning icon"/>
        <span class="font-semibold text-white">
            {#if errorFrontCode == "-32603"}
                Insufficient Fund
            {:else if errorFrontCode == "ACTION_REJECTED"}
                Rejected by user
            {:else if errorFrontCode == "Requested account does not have any mint with this option."}
                No slot left for this address
            {:else if errorFrontCode == "Too many requests."}
                Rate limit, Too many requests. Wait a moment and try again
            {:else}
                {errorFrontCode}
            {/if}
        </span>
    </div>
{/if}
