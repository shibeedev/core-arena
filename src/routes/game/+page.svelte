<script>
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { onMount, onDestroy } from "svelte";
    import { goto } from '$app/navigation';
    import { writable } from 'svelte/store';
    import { page } from '$app/stores';
    import { emitBetweenText } from '$lib/index.js';
    import { erc721ABI, erc721Bytecode, contractAddress,contractAbi  } from "$lib/contract.config.js";
    import { ethers } from "ethers";
    import config from "$lib/config.js";
    import { walletState, connectWallet, checkExistingConnection} from '$lib/wallet.js';
    import { getNFTListForWallet, saveNFTListForWallet } from '$lib/localWalletStorage.js';
    import PvPMode from './PvPMode.svelte';
    import TrainingRoom from './TrainingRoom.svelte';
    import Quest from './Quest.svelte';
    import QuickMint from './QuickMint.svelte';
    import PvpOnboard from './PvpOnboard.svelte';
    import TutorialPopUp from './TutorialPopUp.svelte';
    import Hall from './Hall.svelte';
    import LoadingGame from '$lib/LoadingGame.svelte';
    import OnboardingManager from '$lib/onboarding/OnboardingManager.svelte';
    import { onboardingStore, startOnboarding , getUserOnboardingStatus , closeOnboarding, currentStep, resetOnboarding, setUserAddress} from '$lib/onboarding/onboardingStore.js';
    import { trackButtonClick, resetEvents, onboardingEvents } from '$lib/onboarding/onboardingEvents.js';

    let completeOnboardServer = false;
    export const skillData = writable([]);
    let showNotifications1 = true;
    let showNotifications2 = false;
    let showNotifications3 = false;
    import './styles.css';
    import Loading from "$lib/Loading.svelte";
    let isLogin = false;
    let connectToMetamask;
    let navigation = "hall";
    let matchPopUp = false;
    let challengePopUp = false;
    let rankMatchPopUp = false;
    let rankRewardPopup = false;
    let chainChoose = false;
    let isQuestLoading = false;

    let showSelectedAtributes =[];
    let selected = {};
    let selectedAtributes = {};
    let rewardFire;

    let battleProfile = {};
    let challengeHistory = [];
    let defendHistory =[];
    let battleHistory = [];
    
    let challengePerDay = "";
    let challengeUsed ="";

    let isShowMintFree = true;
    let isShowQuickMint = false;
    let isShowOnboardPvP = false

    let inputStake;

    let withdrawList =[];
    //
    let selectedChallengeTarget = "";
    let selectedChallengeId = "";
    let selectedStakeDisplay;

    //pvp squad
    let squad = [{},{},{}];
    function chooseSquad(){
        if(!squad[0].id)
        {   squad[0].collection = selected.collection; 
            squad[0].id = selected.id;
            squad = squad;
            
        }
        else if(!squad[1].id)
        {   squad[1].collection = selected.collection; 
            squad[1].id = selected.id;
            squad = squad;
        }
        else if(!squad[2].id)
        {
            squad[2].collection = selected.collection; 
            squad[2].id = selected.id;
            squad = squad;
        }
    }

    let y;
    let showSelectedRankAtributes =[];
    let selectedCollectionName;
    let selectedRank ={};
    let rankSquad = [{},{},{}];
    function chooseRankSquad(){
        if(!rankSquad[0].id)
        {   rankSquad[0].collection = selectedRank.collection; 
            rankSquad[0].id = selectedRank.id;
            rankSquad = rankSquad;
            
        }
        else if(!rankSquad[1].id)
        {   rankSquad[1].collection = selectedRank.collection; 
            rankSquad[1].id = selectedRank.id;
            rankSquad = rankSquad;
        }
        else if(!rankSquad[2].id)
        {
            rankSquad[2].collection = selectedRank.collection; 
            rankSquad[2].id = selectedRank.id;
            rankSquad = rankSquad;
        }
    }

    let passHold = "";
    

    

    // Example of using the data
    let effect = '';
    function getEffect(collections, attribute) {
    let currentSkillData = [];
    
    // Get the current value from the store
        const unsubscribe = skillData.subscribe(value => {
            currentSkillData = value || [];
        });
        unsubscribe(); // Unsubscribe immediately after getting the value
        
        const item = Array.isArray(currentSkillData) 
            ? currentSkillData.find(item => item.collections === collections && item.attribute === attribute)
            : null;
            
        effect = item ? item.desc : 'Effect not found, please re-generate skills for this NFT';
        return effect;
    }


    let address = ""; 
    let playerProfile;
    let userAddress;
    //Copy
    let textToCopy = address;

    let nftList = [];
    let currentItem = 0;
    let items = [];
    let done = false;
    let popupLoading = false;
    let loading = true;
    let allLoading = true;
    

    let matches = [];

    let withDrawPopUp = false;
    let questPopUp = false;
    let isShowTutorialPopUp = false;
    let questList = [];
    
    let provider;
    let signer;
    let prizePoolContract;

    let unsubWallet;

    //Onboard
    $: gameState = {
        navigation,
        nftList,
        squad
    };

    onMount(async () => {
        ////Connect wallet ///////////////
        const walletReady = new Promise(resolve => {
            //subcribe to wallet state
            unsubWallet = walletState.subscribe(state => {
                provider = state.provider;
                signer = state.signer;
                userAddress = state.address;
                address = userAddress;
                isLogin = state.isConnected;
                //set onboard useradress
                if (userAddress) {
                    setUserAddress(userAddress);
                }
                
                // If we have a valid wallet connection, resolve the promise
                if (state.isConnected && state.signer) {
                    resolve();
                }
            });
        });

        await checkExistingConnection();
        await walletReady;
        //////////////////////////
        prizePoolContract = new ethers.Contract(contractAddress, contractAbi, signer);
        
        ////////////////////////// CHECK NFT IN LOCAL LIST + COMBINED ON-CHAIN VERFITICATION + LOAD NFT ///////////////////////////////////////////
        (async () => {
            // Get nfts that user owns
            try {
                await (async function() {
                    try {
                        const localNFTList = getNFTListForWallet(userAddress);
                        const requests = [];
                        // Check if user is still the owner
                        for (const nft of localNFTList) {
                            requests.push((async () => {
                                const { owner } = await getNFTOwner(nft.collectionAddress, nft.id);
                                
                                if (owner !== userAddress) {
                                    return;
                                }

                                nftList.push(nft);
                                nftList = nftList;
                            })());
                        }

                        await Promise.all(requests);
                        saveNFTListForWallet(userAddress, nftList);
                    } catch (e) {
                        console.log(e);
                    }
    
                })();
            } catch (e) {}

        const excludedAddresses = [
            "",
            ""
        ];

        ////////////////////////// CHECK SPECIFIC NFT ON CHAIN USE HAD, ADDED IT TO NFT LIST ///////// 
        const collectionsToCheck = ["0xa269bc199dea7338cbeae61df6ea2b7ad10523c1", "0xe48696582061011beadcdb1eb132ff2261ced5cf"];

        ///////// Filter NFT that being excluded ////////////////////////////////
        nftList = nftList.filter(nft => !excludedAddresses.includes(nft.collectionAddress));
        
        //update onboard tracking props
        gameState.nftList = nftList;
        gameState ={...gameState}
        loadNFTs(nftList);

           
        })();

        async function loadNFTs() {
            loading = true;
            
            const nfts = [];

            for (let index = currentItem; index < currentItem + 100; index++) {
                const id = nftList[index];

                nfts.push(id);
            }

            try {
                const curatedNFTs = nfts.filter(id => typeof id !== "undefined" && id !== null);

                if (curatedNFTs.length !== nfts.length) { done = true; }

                const nftInfos = (await getNFTsInfo(curatedNFTs, [ "metadata", "offers", "owner" ])).nftInfos;

                const newNfts = nftInfos.map(nft => ({ ...nft, id: nft.id }));

                items = [ ...items, ...newNfts ];

            } catch (e) {
                console.log(e);

                done = true;
                loading = false;
            }
            loading = false;
            currentItem += 100;
        }

        if (!done && !loading) {
            loadNFTs(nftList);
        }
        await initProfile();
        await getMatches();
        await getPlayerProfile();
        await getAllBattleHistory();
        await getUserQuests();
        await getWithdrawList(address);
        await fetchSkillData();
        await getAllStages();

        // Start onboarding if needed
        allLoading= false;
        gameState.navigation = navigation;
        gameState = {...gameState};
        // Check user's onboarding status from localStorage
        const userStatus = getUserOnboardingStatus(userAddress);
        
        if (userStatus === 'not-started' || userStatus === 'active') {
            // User hasn't finished onboarding, start it
            resetEvents();
            startOnboarding('newUser');
        } else if (userStatus === 'finished') {
            // User completed onboarding, do nothing
            //console.log('User has completed onboarding');
        } else {
            // Not found or error, reset and start fresh
            console.log('Onboarding data not found or corrupted, resetting...');
            resetEvents();
            resetOnboarding('newUser');
        }

        
    });

    onDestroy(() => {
        if (unsubWallet) unsubWallet();
    });

    connectToMetamask = async function() {
        const result = await connectWallet();
        if (result.success) {
            location.reload();// Reload to ensure reset state of other components
        }
    }

    async function apiCall(method, params = {}) {
        try {
        const response = await fetch(config.rpcUrl, {
            method: 'POST',
            body: JSON.stringify({
            method,
            params: { ...params}
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`Failed to ${method}`);
        const responseData = await response.json();
        if (!responseData.success) throw new Error(responseData.error?.message || `Failed to ${method}`);
        if (Array.isArray(responseData.payload.data) && responseData.payload.data.length >= 2) {
            const [responseType, responsePayload] = responseData.payload.data;
            if (responseType === 'error') throw new Error(responsePayload || 'Server error');
            if (responseType === 'success') return { success: true, data: responsePayload };
        }
        throw new Error('Invalid response format');
        } catch (error) {
            console.error(`${method} API call failed:`, error);
            throw error;
        }
    }

    async function getAllStages() {
        try {
            const result = await apiCall('getAllStages');
            botStages = result.data || [];
            botStages = [...botStages];
        } catch (error) {
        }
    }

    async function getNFTOwner(address, id) {
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "getNFTInfo",
                params: {
                    address,
                    id,
                    exclude: [ "metadata", "collectionName", "offers" ]
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


    async function getNFTsInfo(nfts, exclude) {
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "getNFTsInfo",
                params: {
                    nfts,
                    exclude
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const responseBody = await response.json();
            selectedCollectionName = responseBody.payload.nftInfos[0].collectionName;
            selectedCollectionName = selectedCollectionName
            return responseBody.payload;
           
        } else {
            const responseBody = await response.json();

            if (responseBody.error && responseBody.error.message) {
                throw new Error(responseBody.error.message);
            }
        }
    }

    async function getAttributes(nfts) {
        const attributeList = (await getNFTsInfo(nfts, ["owner", "listingDetails", "offers"]))
            .nftInfos
            .map(nft => {
                //Check if NFT has missing attributes
                if (!nft?.metadata) {
                    throw new Error(`NFT is not existed`);
                }
                // Return a default BasicAttack skill for NFTs that have no attributes
                if (!nft?.metadata?.attributes?.length) {
                    return ["BasicAttack"];
                }

                const attributes = nft.metadata.attributes;
                return attributes.map(attribute => attribute["value"]);
            });
        return attributeList; 
    }

    async function fetchSkillData() {
        try {
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getAllSkillData",
                    params: {}
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            
            if (!response.ok) {
                const responseBody = await response.json();
                throw new Error(responseBody.error?.message || "Failed to get skill data");
            }

            const responseBody = await response.json();
            
            if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
                
                if (Array.isArray(responseBody)) {
                    const data = responseBody;
                    skillData.set(data);
                    return data;
                }
                
                if (responseBody.data && Array.isArray(responseBody.data)) {
                    skillData.set(responseBody.data);
                    return responseBody.data;
                }
                
                if (responseBody.payload && Array.isArray(responseBody.payload)) {
                    skillData.set(responseBody.payload);
                    return responseBody.payload;
                }
                
                if (responseBody.result && Array.isArray(responseBody.result)) {
                    skillData.set(responseBody.result);
                    return responseBody.result;
                }
                
                throw new Error("Invalid response format from server");
            }
            
            const responseData = responseBody.payload.data;
            

            if (Array.isArray(responseData)) {
                if (responseData[0] === "skillData" && Array.isArray(responseData[1])) {
                    skillData.set(responseData[1]);
                    return responseData[1];
                } else {
                    skillData.set(responseData);
                    return responseData;
                }
            }
            
            console.error("Unexpected response format:", responseData);
            throw new Error("Unrecognized data format");
            
        } catch (error) {
            console.error("Error fetching skill data:", error);
            throw error;
        }
    }
   
    async function getMatches() {
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "getAllMatch",
                params: {}
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const responseBody = await response.json();
            if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
                console.error("Invalid response format:", responseBody);
                throw new Error("Invalid response format from server");
            }
        
            matches = responseBody.payload.data[1];
        } else {
            const responseBody = await response.json();

            if (responseBody.error && responseBody.error.message) {
                throw new Error(responseBody.error.message);
            }
        }
    }; 

    async function loadQueue(nfts, address, value) {
        popupLoading = true;
        if (!nfts?.length) {
            popupLoading = false;
            return;
            
        }
        
        const floatValue = parseFloat(value);
        if (isNaN(floatValue) || floatValue <= 0) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Deposit value must be greater than 0";
            return;
        }

        // Add max stake validation
        if (floatValue > 10) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "In this phase, the maximum stake per match allowed is 10 $CORE";
            return;
        }

        const filteredNfts = nfts.map(nft => ({ collectionAddress: nft.collection, id: nft.id }));
        const attributeList = await getAttributes(filteredNfts);
        const finalNfts = [];
        for (let i = 0; i < attributeList.length; i++) {
            finalNfts.push({
                collection: nfts[i].collection,
                id: parseInt(nfts[i].id),
                attributes: attributeList[i]
            });
        }
        
        const initialResponse = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "loadQueue",
                params: {
                    daddress: address,
                    value: floatValue,
                    matchBody: {
                        nfts: finalNfts
                    }
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!initialResponse.ok) {
            const responseBody = await initialResponse.json();
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Failed to initialize battle";
            throw new Error(responseBody.error?.message || "Failed to initialize battle");
            return;
        }
        const responseBody = await initialResponse.json();

        if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Invalid response format from server";
            throw new Error("Invalid response format from server");
        }

        const responseData = responseBody.payload.data;
        if (responseData[0] === "error") {
            popupLoading = false;
            generalError = true;
            generalErrorValue = responseData[1];
            throw new Error(responseData[1]);
        }
        
        if (responseData[0] !== "pendingBattle") {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Unexpected response";
            throw new Error(`Unexpected response from server: ${responseData[0]}`);
        }
        
        const { battleID, value: confirmedValue } = responseData[1];

        try {
            const valueToUse = parseFloat(confirmedValue.toString());
            
            const valueInWei = ethers.utils.parseEther(valueToUse.toString());
            
            const tx = await prizePoolContract.create(battleID, { value: valueInWei });
            
            await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "confirmDefenderDeposit",
                    params: {
                        battleID: battleID,
                        txHash: tx.hash
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            try {
                const receipt = await tx.wait();
                if (receipt.status !== 1) {
                    popupLoading = false;
                    generalError = true;
                    generalErrorValue = ("Transaction failed with status: " + receipt.status);
                    throw new Error("Transaction failed with status: " + receipt.status);
                }
            } catch (error) {
                popupLoading = false;
                generalError = true;
                generalErrorValue = ("Transaction failed: " + (error.message || "Unknown error"));
                console.error("Transaction failed:", error);
                throw new Error("Transaction failed: " + (error.message || "Unknown error"));
            }
            
            const finalResponse = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "finalizeDefenderDeposit",
                    params: {
                        battleID: battleID
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!finalResponse.ok) {
                const responseBody = await finalResponse.json();
                popupLoading = false;
                generalError = true;
                generalErrorValue = "Failed to finalize battle creation";
                throw new Error(responseBody.error?.message || "Failed to finalize battle creation");
            }
            popupLoading = false;
            location.reload();
            
        } catch (error) {
            popupLoading = false;
            throw error;
        }
    }

    async function challenge(nfts, caddress, daddress, battleID) {
        checkSquad();
        if (!nfts?.length) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Invalid NFTs input";
            throw new Error("Invalid NFTs input");
        }
        popupLoading = true;

        const filteredNfts = nfts.map(nft => ({ collectionAddress: nft.collection, id: nft.id }));
        const attributeList = await getAttributes(filteredNfts);
        
        const finalNfts = [];
        for (let i = 0; i < attributeList.length; i++) {
            finalNfts.push({
                collection: nfts[i].collection,
                id: parseInt(nfts[i].id),
                attributes: attributeList[i]
            });
        }
        
        const initialResponse = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "match",
                params: {
                    battleID, 
                    caddress,
                    daddress,
                    matchBody: {
                        nfts: finalNfts
                    }
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!initialResponse.ok) {
            const responseBody = await initialResponse.json();
            popupLoading = false;
            generalError = true;
            generalErrorValue = responseBody.error?.message;
            throw new Error(responseBody.error?.message || "Failed to initialize challenge");
        }

        const responseBody = await initialResponse.json();
        if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Invalid response format from server";
            throw new Error("Invalid response format from server");
        }
        const responseData = responseBody.payload.data;

        if (responseData[0] === "error") {
            popupLoading = false;
            generalError = true;
            generalErrorValue = responseData[1];
            throw new Error(responseData[1]);
        }

        if (responseData[0] === "tie") {
            goto("./game/battle");
            return;
        }
        
        if (responseData[0] !== "challengeWithDeposit") {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Unexpected response from server";
            throw new Error("Unexpected response from server");
        }
        
        const battleInfo = responseData[1];
        const secureToken = battleInfo.secureToken;
        
        try {
            
            const valueToUse = parseFloat(battleInfo.value.toString());
            const valueInWei = ethers.utils.parseEther(valueToUse.toString());
            const tx = await prizePoolContract.join(battleInfo.battleID, { value: valueInWei });

            // Notify server about the transaction hash
            await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "confirmChallengerDeposit",
                    params: {
                        battleID: battleInfo.battleID,
                        txHash: tx.hash,
                        caddress: caddress,
                        secureToken: secureToken
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // Wait for transaction confirmation
            try {
                const receipt = await tx.wait();
                if (receipt.status !== 1) {
                    popupLoading = false;
                    generalError = true;
                    generalErrorValue = ("Transaction failed with status: " + receipt.status);
                    throw new Error("Transaction failed with status: " + receipt.status);
                }

                // Transaction confirmed successfully - signal to server
                await fetch(config.rpcUrl, {
                    method: "POST",
                    body: JSON.stringify({
                        method: "signalTransactionDone",
                        params: {
                            battleID: battleInfo.battleID,
                            txHash: tx.hash,
                            caddress: caddress,
                            secureToken: secureToken
                        }
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                popupLoading = false;
                goto("./game/battle");


            } catch (error) {
                popupLoading = false;
                generalError = true;
                generalErrorValue = ("Transaction failed: " + (error.message || "Unknown error"));
                console.error("Transaction failed:", error);
                throw new Error("Transaction failed: " + (error.message || "Unknown error"));
            }
        } catch (error) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = ("Error challenging battle:", error);
            console.error("Error challenging battle:", error);
            throw error;
        }
    }

    async function getWithdrawList(address) {
        try {
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "withdrawList",
                    params: {
                        address: address
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const responseBody = await response.json();
                throw new Error(responseBody.error?.message || "Failed to get withdraw list");
            }

            const responseBody = await response.json();
            
            // Access the nested response data
            if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
                throw new Error("Invalid response format from server");
            }
            
            const responseData = responseBody.payload.data;
            
            // responseData should be ["withdrawList", claimableBattles]
            if (responseData[0] !== "withdrawList") {
                throw new Error(`Unexpected response from server: ${responseData[0]}`);
            }
            
            withdrawList = [...responseData[1]];
            return responseData[1];
            
        } catch (error) {
            console.error("Error getting withdraw list:", error);
            throw error;
        }
    }

    async function claimBattleWinnings(address, battleID) {
        try {
            popupLoading = true;
            const currentNonce = await prizePoolContract.nonce();
            const claimResponse = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "claim",
                    params: {
                        address: address,
                        battleID: battleID
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!claimResponse.ok) {
                const responseBody = await claimResponse.json();
                popupLoading = false;
                generalError = true;
                generalErrorValue = (responseBody.error?.message || "Failed to initiate claim");
                throw new Error(responseBody.error?.message || "Failed to initiate claim");
            }

            const responseBody = await claimResponse.json();
            
            if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
                popupLoading = false;
                generalError = true;
                generalErrorValue = "Invalid response format from server";
                throw new Error("Invalid response format from server");
            }
            const responseData = responseBody.payload.data;
            if (responseData[0] !== "claimSignature") {
                popupLoading = false;
                generalError = true;
                generalErrorValue = "Invalid response format from server";
                throw new Error(`Unexpected response from server: ${responseData[0]}`);
            }
            
            const { signature } = responseData[1];
            
            const tx = await prizePoolContract.claim(
                battleID,
                signature.r,
                signature.s,
                signature.v,
                {
                    gasLimit: 120000, 
                }
            );
            await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "confirmClaimTx",
                    params: {
                        battleID: battleID,
                        address: address,
                        txHash: tx.hash
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            try {
                const receipt = await tx.wait();
                if (receipt.status !== 1) {
                    popupLoading = false;
                    generalError = true;
                    generalErrorValue = ("Transaction failed with status: " + receipt.status);
                    throw new Error("Transaction failed with status: " + receipt.status);
                }
            } catch (error) {
                popupLoading = false;
                generalError = true;
                generalErrorValue = ("Transaction failed: " + (error.message || "Unknown error"));

                throw new Error("Transaction failed: " + (error.message || "Unknown error"));
            }
            
            const finalResponse = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "finalizeClaimTx",
                    params: {
                        battleID: battleID
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!finalResponse.ok) {
                const responseBody = await finalResponse.json();
                popupLoading = false;
                generalError = true;
                generalErrorValue = (responseBody.error?.message || "Failed to finalize claim");
                throw new Error(responseBody.error?.message || "Failed to finalize claim");
            }
            
            popupLoading = false;
            await getWithdrawList(address);
            return true;
        } catch (error) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = ("Error claiming battle winnings:", error);
            console.error("Error claiming battle winnings:", error);
            throw error;
        }
    }

    async function delistBattle(address, battleID) {
        popupLoading = true;
        try {
            const tx = await prizePoolContract.delist(battleID);
            
            await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "confirmDelistTx",
                    params: {
                        battleID: battleID,
                        address: address,
                        txHash: tx.hash
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            try {
                const receipt = await tx.wait();
                if (receipt.status !== 1) {
                    popupLoading = false;
                    generalError = true;
                    generalErrorValue = ("Transaction failed with status: " + receipt.status);
                    throw new Error("Transaction failed with status: " + receipt.status);
                }
            } catch (error) {
                popupLoading = false;
                generalError = true;
                generalErrorValue = ("Transaction failed: " + (error.message || "Unknown error"));
                console.error("Transaction failed:", error);
                throw new Error("Transaction failed: " + (error.message || "Unknown error"));
            }
            
            const finalResponse = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "finalizeDelistTx",
                    params: {
                        battleID: battleID
                    }
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!finalResponse.ok) {
                const responseBody = await finalResponse.json();
                popupLoading = false;
                generalError = true;
                generalErrorValue = (responseBody.error?.message || "Failed to finalize delist");
                throw new Error(responseBody.error?.message || "Failed to finalize delist");
            }
            
            popupLoading = false;
            location.reload();
            return true;
        } catch (error) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = ("Error delisting battle:", error);
            console.error("Error delisting battle:", error);
            throw error;
        }
    }

    
    async function initProfile() {
        try {
                const response = await fetch(config.rpcUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        method: "initProfile",
                        params: {
                        address: userAddress
                        }
                    })
                });

                if (response.ok) {
                    const responseBody = await response.json();
                    return responseBody.payload.data[1];
                } else {
                    const responseBody = await response.json();
                    if (responseBody.error && responseBody.error.message) {
                        throw new Error(responseBody.error.message);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch battle history:', error);
                throw error;
            }
    }
    async function getPlayerProfile() {
        try {
            const response = await fetch(config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: "getPlayerProfile",
                    params: {
                        address: userAddress
                    }
                })
            });

            if (response.ok) {
                const responseBody = await response.json();
                const playerProfile = responseBody.payload.data[1];
                
                challengePerDay = playerProfile.challengePerDay;
                challengeUsed = playerProfile.challengeUsed;
                rewardFire = playerProfile.rewardFire;
                
                return playerProfile;
            } else {
                const responseBody = await response.json();
                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        } catch (error) {
            console.error('Failed to fetch player profile:', error);
            throw error;
        }
    }

    async function getAllBattleHistory() {
        try {
            const response = await fetch(config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: "getAllBattleHistory",
                    params: {
                        address: userAddress
                    }
                })
            });

            if (response.ok) {
                const responseBody = await response.json();
                // The response structure is now different
                const allBattles = responseBody.payload.data[1]; // This is now an array of battles
                /*
                // Separate into challenge and defend history based on who was the challenger/defender
                challengeHistory = allBattles.filter(battle => 
                    battle.caddress.toLowerCase() === userAddress.toLowerCase()
                );
                
                defendHistory = allBattles.filter(battle => 
                    battle.daddress.toLowerCase() === userAddress.toLowerCase() && 
                    battle.caddress.toLowerCase() !== userAddress.toLowerCase()
                );
                */
                // Combine all battles
                battleHistory = allBattles;
                return allBattles;
            } else {
                const responseBody = await response.json();
                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        } catch (error) {
            console.error('Failed to fetch battle history:', error);
            throw error;
        }
    }
    
    /////////////////// Quests API ///////////////////////////////////////////////////////////
    async function getUserQuests() {
    try {   
            const response = await fetch(config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: "getUserQuests",
                    params: {
                    userAddress: userAddress
                    }
                })
            });

            if (response.ok) {
                const responseBody = await response.json();
                
                questList = responseBody.payload.data[1];
                return responseBody.payload.data[1];
            } else {
                const responseBody = await response.json();
                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                }
            }
        } catch (error) {
            console.error('Failed to fetch battle history:', error);
            throw error;
        }
    }

    async function claimQuestReward(questId) {
    try {
            const response = await fetch(config.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    method: "claimQuestReward",
                    params: {
                    userAddress: userAddress,
                    questId: questId
                    }
                })
            });

            if (response.ok) {
                const responseBody = await response.json();
                await getUserQuests(userAddress);
                await getPlayerProfile();
                //location.reload()

                return responseBody.payload.data[1];
            } else {
                const responseBody = await response.json();
                if (responseBody.error && responseBody.error.message) {
                    throw new Error(responseBody.error.message);
                    
                }
            }
        } catch (error) {
            console.error('Failed to fetch battle history:', error);
            throw error;
        }
    }

    ////////////////////// Training  ////////////////////////////////
    let botStages = [];
    let stageNavigation = 0;
    async function joinTrainingRoom(nfts, address) {
        checkSquad();
        if (!nfts?.length) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Invalid NFTs input";
            throw new Error("Invalid NFTs input");
        }
        popupLoading = true;
        const filteredNfts = nfts.map(nft => ({ collectionAddress: nft.collection, id: nft.id }));
        const attributeList = await getAttributes(filteredNfts);
        
        const finalNfts = [];
        for (let i = 0; i < attributeList.length; i++) {
            finalNfts.push({
                collection: nfts[i].collection,
                id: parseInt(nfts[i].id),
                attributes: attributeList[i]
            });
        }
        
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "joinTrainingRoom",
                params: {
                    address: address,
                    playerTeam: finalNfts,
                    stage:stageNavigation
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const responseBody = await response.json();
            popupLoading = false;
            generalError = true;
            generalErrorValue = responseBody.error?.message || "Failed to start training battle";
            throw new Error(responseBody.error?.message || "Failed to start training battle");
        }

        const responseBody = await response.json();
        if (!responseBody.success || !responseBody.payload || !responseBody.payload.data) {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Invalid response format from server";
            throw new Error("Invalid response format from server");
        }
        
        const responseData = responseBody.payload.data;

        if (responseData[0] === "error") {
            popupLoading = false;
            generalError = true;
            generalErrorValue = responseData[1];
            throw new Error(responseData[1]);
        }
        
        if (responseData[0] === "trainingBattleResult") {
            popupLoading = false;
            goto("./game/trainingRoomBattle");
        } else {
            popupLoading = false;
            generalError = true;
            generalErrorValue = "Unexpected response from server";
            throw new Error("Unexpected response from server");
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////
    let rankAndNearbys = [];
    let rankUserProfile = {
        rankSquad: [], 
        userAddress: ""
    };

    let challengeRankUsed;
    let challengeRankPerDay;
    let seasonInfo = [];
    let rankBattleHistories = [];


    let error = false;
    let errorOutChallenge;

    let errorRank = false;
    let errorOutRankChallenge;
    let errorRankSquadAvailable = false;
    let generalError = false;
    let generalErrorValue = "Error";

    function checkSquad() {
        if (!squad[0].id || !squad[1].id || !squad[2].id) {
            error = true;
        }
    }

    setInterval(()=>{
        if(error === true){
            setTimeout(()=>{error = false}, 2000)
        }
        if(errorOutChallenge === true){
            setTimeout(()=>{errorOutChallenge = false}, 2000)
        }
        if(errorRank === true){
            setTimeout(()=>{errorRank = false}, 2000)
        }
        if(errorOutRankChallenge === true){
            setTimeout(()=>{errorOutRankChallenge = false}, 2000)
        }
        if(errorRankSquadAvailable === true){
            setTimeout(()=>{errorRankSquadAvailable = false}, 2000)
        }
        if(generalError === true){
            setTimeout(()=>{generalError = false; generalErrorValue = "Error" }, 3000)
        }
    }, 100);

    
    let loadingItems2 = [{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}];;

    let totalSeconds, totalMinutes , totalHours, totalDays;
    let deadline = 1735650000000;
    let deadline2 = 1735650000000;

    let totalHours2

    function formatTimeLeftBattle(timestamp) {
        let milliseconds = Date.now() - timestamp;
        totalSeconds = Math.floor(milliseconds / 1000);
        totalMinutes = Math.floor(totalSeconds / 60);
        totalHours = Math.floor(totalMinutes / 60);
        totalDays = Math.floor(totalHours / 24);

        totalSeconds = totalSeconds % 60;
        totalMinutes =  totalMinutes % 60;
        totalHours2 =  totalHours % 24;
        if(totalDays < 1){
            totalDays =  0;
        } else {totalDays = totalDays}

        return `${totalDays > 0 ? totalDays + 'd ' : ''}${totalHours > 0 ? totalHours + 'h ' : ''}${totalMinutes}m`;
    }

    function formatTimeLeft(milliseconds) {
        totalSeconds = Math.floor(milliseconds / 1000);
        totalMinutes = Math.floor(totalSeconds / 60);
        totalHours = Math.floor(totalMinutes / 60);
        totalDays = Math.floor(totalHours / 24);

        totalSeconds = totalSeconds % 60;
        totalMinutes =  totalMinutes % 60;
        totalHours =  totalHours % 24;
        if(totalDays < 1){
            totalDays =  0;
        } else {totalDays = totalDays}
    }

    let dateNow;
    let resetChallengeHours = 0;
    let resetChallengeMinutes = 0;

    setInterval(() => {
        dateNow = Date.now();
        formatTimeLeft(deadline - dateNow);
        formatTimeLeftBattle(deadline2 - dateNow);
        getTimeUntilReset(); 
    }, 1000);

    function getTimeUntilReset() {
        const now = new Date();
        const targetHour = 14; 
        
        let targetDate = new Date();
        targetDate.setUTCHours(targetHour, 0, 0, 0);
        
        if (now.getUTCHours() >= targetHour) {
            targetDate.setUTCDate(targetDate.getUTCDate() + 1);
        }
        
        const diff = targetDate.getTime() - now.getTime();
        
        resetChallengeHours = Math.floor(diff / (1000 * 60 * 60));
        resetChallengeMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    }

    let searchTerm = '';
    let filters = {
        damage: false,
        res: false,
        heal: false,
        maxHp: false,
        stun:false
    };
    function toggleFilter(name) {
        filters[name] = !filters[name];
        filters = filters; 
    }
    $: filteredSkills = Array.isArray($skillData) 
    ? $skillData.filter(skill => {
        const searchMatch = !searchTerm || 
            skill.collections.toLowerCase().includes(searchTerm.toLowerCase());

        const damageMatch = !filters.damage || skill.dmg !== 0;
        const resMatch = !filters.res || skill.resChange !== 0;
        const healMatch = !filters.heal || skill.heal !== 0;
        const maxHpMatch = !filters.maxHp || skill.hpChange !== 0;
        const stunMatch = !filters.stun || skill.stunChance !== 0;
        return searchMatch && damageMatch && resMatch && healMatch && maxHpMatch &&stunMatch;
    }) 
    : [];

    function calculateTotalWithdrawable() {
        if (!withdrawList || withdrawList.length === 0) {
            return 0;
        }
        
        return withdrawList.reduce((total, item) => total + (item.value * 2), 0);
    }
</script>

{#if isLogin }
    <div class="hidden sm:flex relative flex-col justify-center items-center w-full h-screen bg-black text-white ">
        <!--Game Screen-->
        <div class="flex flex-col relative w-[100vw] h-[45vw] maw-w-[1920px] max-h-[45vw] m-auto bg-cover font-geo text-[1vw] overflow-hidden">

            <div class="flex flex-col w-full h-full m-auto px-[3vw]">
                <!--Game nav-->
                <div class="flex justify-between pl-[1vw]">
                    <!--User Info-->
                    <div class="absolute flex flex-col bg-arenaDark w-[13vw] gap-[0.2vw] px-[1vw] py-[0.5vw] z-10  right-[0vw] border border-arenaMedium">
                        <div class="flex justify-between bg-arenaDark gap-[0.5vw]">
                            <span class="text-[1.1vw]">
                                {emitBetweenText(address, 10)}
                            </span>
                        </div>
                        <div class="flex justify-between bg-arenaDark gap-[0.5vw] text-[0.9vw] text-[#9F8A42] pt-[0.3vw] border-t border-arenaMedium">
                            <div class="text-arenaLight">
                                Withdrawable
                            </div>
                            <button class="flex gap-[0.2vw] text-button text-buttonHover underline" on:click={()=>{withDrawPopUp = true}}>
                                <span class="text-[0.9vw]">
                                    {calculateTotalWithdrawable(withdrawList)}
                                </span>
                                <img class="h-[1vw]" alt="currency" src="/icons/CORE.png"/>
                            </button>
                        </div>
                        <div class="flex justify-between bg-arenaDark gap-[0.5vw] text-[0.9vw] text-[#9F8A42">
                            <div class="text-arenaLight">
                                Arena Fire
                            </div>
                            <button class="flex gap-[0.2vw] text-button text-buttonHover" on:click={()=>{withDrawPopUp = true}}>
                                <span class="text-[0.9vw]">
                                    {rewardFire}
                                </span>
                                <img class="h-[1vw]" alt="Arena Fire" src="/game/ui/arenaFire.png"/>
                            </button>
                        </div>
                    </div>
                </div>
                {#if navigation === "pvpMode"}
                    <PvPMode 
                        {address}
                        {matches}
                        {squad}
                        {withdrawList}
                        {battleHistory}
                        {challengeUsed}
                        {challengePerDay}
                        {resetChallengeHours}
                        {resetChallengeMinutes}
                        {items}
                        {loading}
                        {selected}
                        {showSelectedAtributes}
                        {selectedCollectionName}
                        {getMatches}
                        {loadQueue}
                        {challenge}
                        {delistBattle}
                        {claimBattleWinnings}
                        {getAttributes}
                        {chooseSquad}
                        {getEffect}
                    />
                {/if}
                {#if navigation === "myTeam"}
                    <div class ="mt-[6vw] flex flex-col rounded-md w-full z-10" in:fade={{ duration: 300 }} >
                        <div class="relative {selected.id?"grid grid-cols-10":""} gap-[2vw] w-full">
                            <!--Squad-->
                            <!---->
                            <div class="relative col-span-6 flex flex-col rounded-md">
                                <div class=" flex flex-col justify-center items-center border border-arenaLight mt-[0.5vw] flex justify-center px-[1vw] py-[0.5vw] bg-arenaMedium gap-[0.5vw] rounded-md z-10">
                                    <span class="text-[1.3vw] self-center text-white font-semibold">
                                        MY SQUAD
                                    </span>
                                    <div class="flex gap-[0.5vw]">
                                        <!--1-->
                                        {#if squad[0].id}
                                            <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={()=>{squad[0] = {}; squad = squad}} in:fade={{ duration: 300 }} >
                                                <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[4vw] h-[4vw] z-10">
                                                    <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                                                </div>
                                                <img class="bg-black w-[4vw] h-[4vw]" src={`${config.rpcUrl}/cdn/nft/${squad[0].collection}/${squad[0].id}/200/200`}
                                                onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                                            </button>
                                        {:else}
                                            <div class="flex">
                                                <img class="w-[4vw] h-[4vw]"  alt="empty slot" src="/game/ui/emptySlot.svg"/>
                                            </div>
                                        {/if}
                                        <!--2-->
                                        {#if squad[1].id}
                                            <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={()=>{squad[1] = {}; squad = squad}} in:fade={{ duration: 300 }} >
                                                <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[4vw] h-[4vw] z-10">
                                                    <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                                                </div>
                                                <img class="bg-black w-[4vw] h-[4vw]" src={`${config.rpcUrl}/cdn/nft/${squad[1].collection}/${squad[1].id}/200/200`}
                                                onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                                            </button>
                                        {:else}
                                            <div class="flex">
                                                <img class="w-[4vw] h-[4vw]"  alt="empty slot" src="/game/ui/emptySlot.svg"/>
                                            </div>
                                        {/if}
                                        <!--3-->
                                        {#if squad[2].id}
                                            <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={()=>{squad[2] = {}; squad = squad}} in:fade={{ duration: 300 }} >
                                                <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[4vw] h-[4vw] z-10">
                                                    <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                                                </div>
                                                <img class="bg-black w-[4vw] h-[4vw]" src={`${config.rpcUrl}/cdn/nft/${squad[2].collection}/${squad[2].id}/200/200`}
                                                onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                                            </button>
                                        {:else}
                                            <div class="flex">
                                                <img class="w-[4vw] h-[4vw]"  alt="empty slot" src="/game/ui/emptySlot.svg"/>
                                            </div>
                                        {/if}
                                    </div>
                                
                                </div>
                                <div class="flex flex-col justify-between bg-arenaDark">
                                    <div class="flex flex-wrap min-h-[20vw] max-h-[20vw] gap-[0.8vw] p-[1vw] rounded-md overflow-y-scroll">
                                        <!--Example-->
                                        {#if items.length > 0 && !loading}
                                            {#each items as item}  
                                                <button on:click={async () => {
                                                    selected.id = item.id;
                                                    selected.collection = item.collection;
                                                    chooseSquad();
                                                    await getAttributes([{ collectionAddress: item.collection, id: item.id }]);
                                                    const attributeResult = await getAttributes([{ collectionAddress: selected.collection, id: selected.id }]);
                                                    showSelectedAtributes = attributeResult[0];
                                            
                                                }} class="flex bg-black hover:border border-linearGreen h-fit rounded-md overflow-hidden">
                                                    <img class="bg-black w-[5vw] h-[5vw]" 
                                                    src={`${config.rpcUrl}/cdn/nft/${item.collection}/${item.id}/200/200`}
                                                    onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                                                </button>
                                            {/each}                         
                                        {:else if loading }
                                            {#each loadingItems2 as loadItem} 
                                            <div class="loading w-[5vw] h-[5vw] ">
            
                                            </div>
                                            {/each}
                                        {:else if items.length == 0}
                                            <div class="flex flex-col text-white m-auto items-center">
                                                <span class="text-arenaLight">Looks like you don't have any NFTs to battle with</span>
                                                <button class="flex glow-border-run self-center p-[0.3vw] rounded-md bg-button hover:bg-buttonHover w-fit text-white text-[0.8vw] mt-[0.5vw]"
                                                on:click={()=>{goto("./game/importnft")}}>
                                                    Import & Generate skills for your NFT
                                                </button>
                                            </div>
                                        {/if}
                                    </div>
                                    <div class="flex self-center justify-center">
                                        <button class="flex w-fit text-white my-[0.5vw] text-[0.9vw] gap-[0.5vw] items-center underline"
                                        on:click={()=>{goto("./game/importnft")}}>
                                            <span>Import & Generate skills for your NFT </span>
                                            <img class="h-[1vw] inline" src="/game/ui/visit.svg" alt="visit site" />
                                        </button>

                                    </div>
                                </div>

                            </div>
                            <div class="col-span-4 flex flex-col rounded-md " >
                                {#if selected.id}
                                    <div class="flex flex-col p-[1vw] bg-arenaMedium rounded-md" in:slide={{ duration: 300 }}>
                                        <div class="flex gap-[1vw]">
                                            <div class="w-[5vw] h-[5vw] bg-black">
                                                <img class="bg-black w-[5vw] h-[5vw]" src={`${config.rpcUrl}/cdn/nft/${selected.collection}/${selected.id}/200/200`}
                                                onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                                            </div>
                                            <!---->
                                            <div class="flex flex-col justify-center gap-[10px]">
                                                <span class="text-arenaLight">
                                                    From <span class="text-button font-thin"> {selectedCollectionName}</span>
                                                </span>
                                                <span class=" font-semibold">
                                                    #{selected.id}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="flex flex-col bg-arenaDark p-[1vw] text-arenaLight rounded-md mt-[1vw] gap-[1vw] max-h-[23vw] min-h-[23vw] overflow-y-scroll">
                                            <!-- skill-->
                                            {#each showSelectedAtributes as showSelectedAtribute}
                                                <div class="flex flex-col">
                                                    <span>
                                                        <span class="text-button">
                                                            {showSelectedAtribute}
                                                        </span>
                                                    </span>
                                                    <span class="text-[0.8vw] font-medium">
                                                        Activation Rate:
                                                        <span class="text-white">
                                                            {(100/showSelectedAtributes.length).toFixed(2)}%
                                                        </span>
                                                    </span>
                                                    <span class="text-[0.8vw] text-white font-medium ml-[1vw]">
                                                        {getEffect(selected.collection,showSelectedAtribute)}  
                                                    </span>
                                                </div>
                                            {/each}
                        
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/if}
                    
                {#if navigation === "allSkill"} 
                    <div class ="mt-[4vw] flex flex-col rounded-md w-full bg-arenaMedium gap-[0.5vw] pb-[0.5vw] z-10 min-h-[32vw]" in:fade={{ duration: 300 }} >
                        <div class="flex flex-col p-[0.5vw]">
                            <!-- Filter Controls -->
                            <div class="flex py-[0.50vw] justify-start gap-[5vw]">
                                <input 
                                class="border-[0.2vw] border-arenaLight p-[0.3vw] text-[0.8vw] w-[20vw] rounded-md bg-arenaDark text-arenaLight" 
                                placeholder="Search by collection name or contract"
                                bind:value={searchTerm}
                                />
                                <div class="flex gap-[0.5vw]">
                                    <button 
                                        class=" w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight {filters.damage ? 'bg-black' : 'bg-arenaDark'}"
                                        on:click={() => {toggleFilter('damage')}}
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/dame.svg" alt="dame filter"/>
                                    </button>
                                    <button 
                                        class=" w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight {filters.res ? 'bg-black' : 'bg-arenaDark'}"
                                        on:click={() => toggleFilter('res')}
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/res.svg" alt="res filter"/>
                                    </button>
                                    <button 
                                        class="w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight {filters.heal ? 'bg-black' : 'bg-arenaDark'}"
                                        on:click={() => toggleFilter('heal')}
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/heal.svg" alt="heal filter"/>
                                    </button>
                                    <button 
                                        class=" w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight {filters.maxHp ? 'bg-black' : 'bg-arenaDark'}"
                                        on:click={() => toggleFilter('maxHp')}
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/maxHp.svg" alt="maxHp filter"/>
                                    </button>
                                    <button 
                                        class="w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight {filters.stun ? 'bg-black' : 'bg-arenaDark'}"
                                        on:click={() => toggleFilter('stun')}
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/stun.svg" alt="stun filter"/>
                                    </button>
                                    <button 
                                        class="w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight"
                                    >
                                        <img class="h-[1.5vw]" src="game/ui/speed.svg" alt="speed filter"/>
                                    </button>
                                <button 
                                class="bg-arenaDark w-[4vw] justify-center rounded-md flex items-center border-[0.2vw] border-arenaLight"
                            >
                                <img class="h-[1.5vw]" src="game/ui/poison.svg" alt="poison filter"/>
                            </button>
                                </div>
                            </div>
                            <!--Skill Table-->
                            <div class="flex flex-col flex-grow w-ful bg-arenaDark max-h-[27vw]">
                                <!--Header-->
                                <div class="flex gap-[0.5vw] px-[0.8vw] bg-arenaDark text-arenaLight">
                                    <div class="w-[20%]">Collection</div>
                                    <div class="w-[30%]">Trait</div>
                                    <div class="w-[20%]">Description</div>
                                </div>
                                <!--Table-->
                                <div class="flex flex-col gap-[0.7vw] text-[0.8vw] my-[0.5vw] px-[0.8vw] bg-arenaDark rounded-md overflow-y-scroll min-h-[24vw] ">
                                    <!--Example-->
                                    {#each filteredSkills as skill}
                                        <div class="flex items-center gap-[0.5vw] w-full hover:text-yellow-400">
                            
                                            <div class="w-[20%]">{emitBetweenText(skill.collections,10)}</div>
                                            <div class="w-[30%]">{skill.attribute}</div>
                                            <div class="w-[50%]">
                                                {skill.desc}
                                            </div>
                                        </div>
                                    {/each} 
                                </div>
                            </div>
                            <button on:click={()=>{goto("./game/importnft")}} class="flex self-center mt-[0.5vw] p-[0.5vw] rounded-md bg-arenaMedium w-fit text-white border border-button hover:border-buttonHover" >
                                    Import NFT
                            </button>
                        </div>
                    </div>
                {/if}

                {#if navigation === "trainingRoom"}
                    <TrainingRoom 
                        {address}
                        {botStages}
                        bind:stageNavigation
                        {squad}
                        {items}
                        {loading}
                        {selected}
                        {showSelectedAtributes}
                        {selectedCollectionName}
                        {getAttributes}
                        {chooseSquad}
                        {getEffect}
                        {joinTrainingRoom}
                    />
                {/if}


                <!--Error PopUp-->
                {#if error}
                    <div class="absolute text-[2vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
                        You have to choose squad before battle
                    </div>
                {/if}
                {#if errorOutChallenge}
                    <div class="absolute text-[2vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
                        You have used all your challenge attempts for today.
                    </div>
                {/if}

                {#if errorRankSquadAvailable}
                    <div class="absolute text-[1.5vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
                        Please click "Enter Rank" to set up your rank squad before battle
                    </div>
                {/if}
                {#if generalError}
                    <div class="absolute text-[1.5vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
                        {generalErrorValue}
                    </div>
                {/if}
                {#if isShowTutorialPopUp}
                    <TutorialPopUp bind:isShowTutorialPopUp bind:navigation {resetEvents} {resetOnboarding}/>
                {/if}
                {#if questPopUp}
                    <Quest 
                        {questList}
                        {resetChallengeHours}
                        {resetChallengeMinutes}
                        {userAddress}
                        {claimQuestReward}
                        {getUserQuests}
                        {isQuestLoading}
                        bind:questPopUp
                    />  
                {/if}
                {#if $currentStep?.title ==='Before battle, you need to get yourself an NFT' && !allLoading && $onboardingStore.status === 'active'}
                    <QuickMint {userAddress} bind:items />    
                {/if}
                {#if $currentStep?.title ==='Show PvP' && !allLoading && $onboardingStore.status === 'active'}
                    <PvpOnboard class="z-20" {userAddress} />    
                {/if}
          
                
   


                <div class="absolute bottom-[0vw] w-full bg-black bg-opacity-50 flex justify-between items-end gap-[2.5vw] z-10 py-[0.5vw] px-[4vw] mt-[1vw] ml-[-3vw]">
                    <div class="flex items-end gap-[2.5vw]">
                        <button class="z-10 flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400"
                        on:click={()=>{
                            questPopUp = true;
                            showNotifications1 = false;
                            isQuestLoading = true;
                            getUserQuests().finally(() => {
                                isQuestLoading = false;
                            });

                        }}>
                            <div class="relative">
                                <img class="h-[2.5vw] mt-[0.5vw]" alt="pvp mode" src="/game/ui/quest.svg"/>
                                {#if showNotifications1}
                                    <div class="absolute bottom-0 right-0 rounded-full bg-red-500 animate-pulse" 
                                        style="width: 0.8vw; height: 0.8vw; transform: translate(25%, -25%);">
                                    </div>
                                {/if}
                            </div>
                            <span class="text-[1vw] font-semibold">
                                Quest
                            </span>
                        </button>
        
                        <button class="z-10 flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400"
                        on:click={()=>{
                            goto("./rewards");
                            showNotifications2 = false;
                        }}>
                            <div class="relative">
                                <img class="h-[2.6vw] mt-[0.5vw]" alt="pvp mode" src="/game/ui/rewards.svg"/>
                                {#if showNotifications2}
                                    <div class="absolute bottom-0 right-0 rounded-full bg-red-500 animate-pulse" 
                                        style="width: 0.8vw; height: 0.8vw; transform: translate(25%, -25%);">
                                    </div>
                                {/if}
                            </div>
                            <span class="text-[1vw] font-semibold">
                                Rewards
                            </span>
                        </button>
                        <button class="flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400" 
                        on:click={()=>{navigation="myTeam"}}>
                            <img alt="my squad" class="h-[2.5vw]" src="/game/ui/squad.svg"/>
                            <span class="text-[0.9vw] font-semibold">
                                My squad
                            </span>
                        </button>
                        <button class="flex flex-col shrinkHover relative items-center gap-[0.5vw] hover:text-yellow-400" on:click={()=>{goto("./game/importnft")}} >
                            <img alt="import NFT" class="h-[2.5vw]" src="/game/ui/import.svg"/>
                            <div class="glow rounded-full absolute h-[1vw] w-[1vw] mt-[1.2vw]">

                            </div>
                            <span class="text-[0.9vw] font-semibold">
                                Import existing NFT
                            </span>
                        </button>
                    </div>
                    <div class="flex items-end gap-[2.5vw]">
                        <button class="z-10 flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400"
                        on:click={()=>{
                            isShowTutorialPopUp = true
                        }}>
                            <div class="relative">
                                <img class="h-[2.6vw] mt-[0.5vw]" alt="pvp mode" src="/game/ui/docs.svg"/>
                            </div>
                            <span class="text-[1vw] font-semibold">
                                Tutorial
                            </span>
                        </button>
                        <button class="flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400"  on:click={()=> { window.open(`${config.site}/mint/0xa2C7b5aD89FAF313fD734c1B810583A765048A8b`, "_blank") }} >
                            <img alt="import NFT" class="h-[2.5vw]" src="/game/ui/demo.svg"/>
                            <span class="text-[0.9vw] font-semibold">
                                Mint demo NFT
                            </span>
                        </button>
                        <button class="flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400" on:click={()=>{navigation="allSkill"}} >
                            <img class="h-[2.5vw]" src="/game/ui/skills.svg"/>
                            <span class="text-[0.9vw] font-semibold">
                                All skills
                            </span>
                        </button>
                        <button class="flex flex-col shrinkHover items-center gap-[0.5vw] hover:text-yellow-400" on:click={()=>{ window.open(`${config.discord}`)}} >
                            <img class="h-[2vw]" src="/icons/discord.svg"/>
                            <span class="text-[0.9vw] font-semibold">
                                Discord
                            </span>
                        </button>
                    </div>
                </div>

                <!--PopUp start-->
                <!--
                {#if !loading && items.length == 0 && (navigation === "pvpMode")&& isShowMintFree}
                    <div class="absolute flex right-10 bottom-10 z-50 w-[20vw] h-[20vw] bg-black bg-opacity-80 rounded-md border border-button" >
                        <div class="flex flex-col justify-center items-center relative w-full h-full ">
                            <span class="text-[0.9vw] mt-[1vw] ">
                                Can't find your NFT?
                            </span>
                            <button class="flex self-center p-[0.3vw] rounded-md border-[0.2vw] font-semibold border-button hover:bg-buttonHover w-fit text-white text-[0.9vw] mt-[0.5vw]"
                            on:click={()=>{goto("./game/importnft")}}>
                                Import & Generate skills for your NFT
                            </button>
                            <span class="text-[0.9vw] mt-[1vw] pt-[1vw] border-t">
                                Don't own any NFTs?
                            </span>
                            <img src="/game/demo.webp" class="h-[5vw]"/>
                            <button class="flex self-center p-[0.3vw] rounded-md border-[0.2vw] font-semibold border-button hover:bg-buttonHover w-fit text-white text-[0.9vw] mt-[0.5vw]"
                            on:click={()=> { window.open(`${config.site}/mint/0xa2C7b5aD89FAF313fD734c1B810583A765048A8b`, "_blank") }}>
                                Mint this NFT
                            </button>
                            <button on:click={()=>isShowMintFree = false}>
                                <img class="absolute w-[2vw] h-[2vw] right-[1vw] top-[1vw] z-10" alt="close icon" src="/game/ui/closeRed.svg"/>
                            </button>
                        </div>
                    </div>
                {/if}
                -->
                {#if popupLoading}
                    <div class="z-50">
                        <Loading/>
                    </div>
                {/if}
                {#if allLoading}
                    <div class="z-50">
                        <LoadingGame/>
                    </div>
                {/if}
            </div>
            <!--Background-->
            <Hall bind:navigation />    
            {#if navigation !== "hall"}
                <img class="absolute bg-cover w-full h-full" alt="background" src="/game/ui/bgpvp.webp" 
                in:fade={{ duration: 300 }} out:fade={{ duration: 300 }} />
            {/if}
            <!--Exit to hall-->
            {#if navigation !== "hall"}
                <div class="absolute flex left-[2vw] top-[2vw] z-10">
                    <button class="flex items-center text-white px-[1vw]" 
                    on:click={()=>{navigation = "hall"}}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-[2vw] w-[2vw] mr-[1vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span class="text-[1.1vw]">BACK</span>
                    </button>
                </div>
            {/if}

        </div>
        
    </div>
{/if}

{#if !isLogin}
    <div class="hidden sm:flex fixed justify-center font-semibold  flex-col inset-0 bg-black bg-opacity-90 z-50 font-geo" > 
        <div class="relative flex flex-col justify-center h-[45vw]">
            <img class="absolute" alt="background" src="/game/load/bgLoad.webp"/>
            <img alt=" nft" class="absolute left-[5vw] bottom-[21vw] z-10 h-[15vw] w-auto object-contain floating" src="/game/load/coolCat.png"/>
            <div class="flex absolute left-[17vw] bottom-[13vw] w-[50vw]  h-[15vw] floating3">
                <div class="flex justify-start relative w-full h-full">
                    <img alt=" nft" class="absolute  z-10 h-[14.5vw] w-auto object-contain" src="/game/load/coretoshi.png"/>

                    <img alt="fire" class="absolute left-[3vw] top-[1vw] z-20 h-[12vw] w-[28vw] widthPulse" src="/game/load/fire.png"/>
                    
                </div>
            </div>
            <div class="flex absolute left-[5vw] bottom-[3vw]  z-10 h-[12vw]  w-[11vw] floating">
                <div class="flex relative w-full h-full">
                    <img alt="random nft" class="absolute z-10 h-[12vw] w-auto object-contain" src="/game/load/punk.png"/>
                    <img alt="hit effect" class="absolute left-[6vw] top-[2vw] z-20 h-auto w-[10vw] object-contain glitch" src="/game/load/hit.png"/>
                </div>
            </div>
            <div class="flex absolute right-[5vw] bottom-[21vw] w-[50vw]  h-[13vw] floating">
                <div class="flex relative w-full h-full">
                    <img alt="random nft" class=" absolute right-[0vw] bottom-[1vw] h-[13vw] w-auto object-contain" src="/game/load/a1.png"/>

                    <img alt="thunder" class="absolute right-[6vw] top-[1vw] z-20 h-[7vw] w-[38vw]  widthPulse" src="/game/load/thunder.png"/>
                    
                </div>
            </div>
            <div class="flex absolute right-[17vw] bottom-[13vw]  h-[16vw] w-[11vw]">
                <div class="flex relative w-full h-full">
                    <img alt="random nft" class="absolute z-10 h-[16vw] w-auto object-contain floating4" src="/game/load/cryptoPunk.png"/> 
                    <img alt="spell" class="absolute right-[2vw] top-[3vw] z-20 h-auto w-[10vw] object-contain floating2" src="/game/load/wkSpel.png"/>
                
                </div>
            </div>
            <div class="flex absolute right-[5vw] bottom-[3vw]  h-[13vw] w-[11vw] floating">
                <div class="flex relative w-full h-full">
                    <img alt="random nft" class="absolute z-10 h-[13vw] w-auto object-contain" src="/game/load/t1.png"/>
                    <img alt="explode" class="absolute right-[5vw] top-[5vw] z-20 h-auto w-[8vw] object-contain shrink" src="/game/load/explode.png"/>
                </div>
            </div>
            <span class="absolute z-[20] text-[3.5vw] self-center top-[8vw] font-bold text-button">
                CORE ARENA
            </span>
            <div class="flex flex-col items-center gap-[0.5vw] absolute z-[20]  text-[1.5vw] self-center bottom-[4vw] font-bold text-white">
                <span>
                    Battle with any ERC-721 NFT in a PvP game
                </span>
                <span>
                    In-game skills are auto-generated and unique based on the NFT's trait name
                </span>
                <span>
                    Winner takes staked $CORE from loser
                </span>
            </div>

            <div class="w-[17vw] h-[17vw] gap-[0.5vw] flex flex-col justify-center items-center bg-black z-20 self-center rounded-full bg-opacity-90 glow-border-run">
                <span class="text-[1.3vw] text-white mt-[1vw]">
                    PLAY NOW
                </span>
                {#if !isLogin}
                    <button class="text-white hover:text-buttonHover hover:border-buttonHover rounded-md border p-2 glow-border-run text-[1.3vw]" on:click={() => connectToMetamask()} >
                        Connect Wallet
                    </button>
                {/if}
            </div>
            <!--Social link-->
            <div class="absolute flex items-center self-center bottom-[1vw] gap-[1vw] overflow-hidden ">
                <button on:click={()=>{window.open(`${config.twitter}`, "_blank")}} class="flex shrink-self-hover rounded-full border-[0.2vw] border-button">
                    <img class="inline-block w-[2.2vw]" src="/game/elements/x.png" alt="X icon"/>
                </button>
                <button on:click={()=>{window.open(`${config.discord}`, "_blank")}} class="flex shrink-self-hover">
                    <img class="inline-block w-[2vw]" src="/game/elements/discord.png" alt="X icon"/>
                </button>
            </div>
        </div>
    </div>
    
{/if}



 <!--Mobile notice--->
 <div class=" relative sm:hidden flex flex-col w-full min-h-screen font-Hoves bg-black text-white px-4">
    <div class="flex flex-col z-10 text-button text-xl font-semibold mx-auto my-auto gap-[5px]">
        <span class="font-bold">
            MOBILE UNSUPPORTED
        </span>
        <span>
            Game is curently not supporting mobile devices. Please use PC to access this.
        </span> 
    </div>

    <!-- animation-->
    <div class="containerLeaf">
        <div class="sakura"><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
        </div>
    </div>
</div>


<OnboardingManager {gameState} {allLoading} />







