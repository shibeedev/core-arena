<script>
    import { fade, slide } from 'svelte/transition';
    import { ethers } from "ethers";
    import { erc721Simple } from "$lib/contract.config.js";
    import config from "$lib/config.js";
    import { addNFTToWallet } from '$lib/localWalletStorage.js';
    import Loading from "$lib/Loading.svelte";
    import { trackButtonClick, trackPopupOpen } from '$lib/onboarding/onboardingEvents.js';
    import { getNFTListForWallet, saveNFTListForWallet } from '$lib/localWalletStorage.js';

    //prop
    export let userAddress;
    export let items;
    // Component state
    let showInputGenerateField = false;
    let inputNftContract = "";
    let inputId = "";
    let isSuccess = false;
    let loading = false;
    let generalError = false;
    let generalErrorValue = "Error";

    // Success state data
    let resultMetadata = {};
    let resultId = "";
    let collectionName = "";
    let resultSkills = [];
    let attributes = [];
    let mintedNftContract = "";

    // Constants
    const mintContract = "0xa2C7b5aD89FAF313fD734c1B810583A765048A8b";

    // Export close function for parent component
    export let isShowMintFree = true;

    // Mint NFT function (from mint pattern)
    async function mintNFT() {
        loading = true;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            const collectionContract = new ethers.Contract(mintContract, erc721Simple, signer);
            const mintTx = await collectionContract.mintNFT(userAddress);
            const receipt = await mintTx.wait();
            const event = receipt.events.find(event => event.event === "Transfer");
            const id = event.args[2].toString();

            // Add to wallet storage
            addNFTToWallet(userAddress, { collectionAddress: mintContract, id });
            
            // Get NFT info
            const nftInfo = await getNFTInfo(mintContract, id, ["owner", "offers", "listingDetails"]);
            
            resultMetadata = nftInfo.metadata;
            collectionName = nftInfo.collectionName;
            resultId = id;
            mintedNftContract = mintContract;

            // Process attributes for UI display
            if (!resultMetadata?.attributes || resultMetadata?.attributes.length === 0) {
                attributes = [{
                    attribute: "Default",
                    value: "BasicAttack"
                }];
            } else {
                attributes = []; // Reset array
                if (Array.isArray(resultMetadata.attributes)) {
                    for (const attribute of resultMetadata.attributes) {
                        attributes.push({ 
                            attribute: attribute["trait_type"], 
                            value: attribute["value"] 
                        });
                    }
                }
            }

            // Generate skills for minted NFT
            await generateNFTSkill(mintContract, attributes, id, userAddress);
            
            //make NFT appear on chooseSquad
            const newNFT = {
                collection:mintContract,
                id:resultId,
            };
            items.push(newNFT)
            items = [ ...items ];

            loading = false;
            isSuccess = true;

        } catch (error) {
            loading = false;
            generalError = true;
            generalErrorValue = error.message || "Minting failed";
        }
    }

    // Import NFT function (from import pattern)
    async function importAndGenerateNFT(collectionAddress, id) {
        if (!collectionAddress || !id) return;
        
        loading = true;
        try {
            // Reset state
            attributes = [];
            resultSkills = [];
            
            // Get NFT info
            const nftInfo = await getNFTInfo(collectionAddress, id);
            
            if (!nftInfo.collectionName) {
                throw new Error("Collection does not exist");
            }
            if (!nftInfo.tokenURI) {
                throw new Error("Cannot find tokenURI of this NFT");
            }
            if (!nftInfo.owner) {
                throw new Error("This NFT does not exist");
            }

            collectionName = nftInfo.collectionName;
            resultMetadata = nftInfo.metadata;
            resultId = id;
            mintedNftContract = collectionAddress;

            // Process attributes
            if (!resultMetadata?.attributes || resultMetadata?.attributes.length === 0) {
                attributes = [{
                    attribute: "Default",
                    value: "BasicAttack"
                }];
            } else {
                if (Array.isArray(resultMetadata.attributes)) {
                    for (const attribute of resultMetadata.attributes) {
                        attributes.push({ 
                            attribute: attribute["trait_type"], 
                            value: attribute["value"] 
                        });
                    }
                }
            }

            // Generate skills
            await generateNFTSkill(collectionAddress, attributes, id, userAddress);
            
            // Add to wallet storage
            addNFTToWallet(userAddress, { collectionAddress, id });
            //make NFT appear on chooseSquad
            const newNFT = {
                collection:mintContract,
                id:resultId,
            };
            items.push(newNFT)
            items = [ ...items ];
            
            loading = false;
            isSuccess = true;

        } catch (error) {
            loading = false;
            generalError = true;
            generalErrorValue = error.message || "Import failed";
        }
    }

    // Helper function to get NFT info
    async function getNFTInfo(userAddress, id, exclude = []) {
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "getNFTInfo",
                params: {
                    address:userAddress,
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
            throw new Error("Failed to get NFT info");
        }
    }



    // Helper function to generate NFT skills
    async function generateNFTSkill(collectionAddress, attributes, tokenId, userAddress) {
        const response = await fetch(config.rpcUrl, {
            method: "POST",
            body: JSON.stringify({
                method: "generateNFTSkill",
                params: {
                    collectionAddress,
                    attributes: attributes,
                    tokenId: tokenId,    
                    userAddress: userAddress 
                }
            }),
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const responseBody = await response.json();
            
            if (responseBody.payload && responseBody.payload.data && responseBody.payload.data[0] === "error") {
                throw new Error(responseBody.payload.data[1]);
            }
            
            resultSkills = responseBody.payload.data[1];
            return responseBody.payload;
        } else {
            const responseBody = await response.json();
            if (responseBody.error && responseBody.error.message) {
                throw new Error(responseBody.error.message);
            }
            throw new Error("Failed to generate NFT skills");
        }
    }

    // Error handling with auto-clear
    $: {
        if (generalError) {
            setTimeout(() => {
                generalError = false;
                generalErrorValue = "Error";
            }, 3000);
        }
    }
</script>
<div class="relative flex h-[2vw]">
    <button on:click={() => isShowMintFree = false}>
            <img class="absolute w-[2vw] h-[2vw] right-[1vw] top-[1vw] z-10" alt="close icon" src="/game/ui/closeRed.svg"/>
    </button>
</div>
<div data-onboard="showQuickMintElement" class="flex flex-col justify-center items-center fixed justify-center font-semibold inset-0 bg-black bg-opacity-90 z-50 font-geo" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}> 
    {#if !isSuccess}
        <div class="z-10 text-white relative flex flex-col justify-center items-center self-center min-h-[40vw] max-h-[40vw] w-[40vw]">
            <!-- Quick mint NFT -->
            <div class="flex flex-col items-center">
                <img src="/game/demo.webp" class="h-[16vw]"/>
                <button 
                    on:click={mintNFT}
                    class="flex text-[1.4vw] justify-center self-center items-center h-fit py-[0.5vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[5vw] mt-[1vw] bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600">
                    Claim this NFT
                </button>

            </div>

            <!-- Quick generate skill for NFT -->
            <div class="flex flex-col w-full items-center border-t mt-[2vw] gap-[0.1vw]">
                <span class="text-[0.9vw] mt-[1vw] font-normal text-gray-200">
                    Already have a NFT on Core chain?
                </span>
                {#if !showInputGenerateField}
                    <button class="flex self-center p-[0.3vw] rounded-md  font-semibold text-button hover:text-buttonHover w-fit underline text-[0.9vw]"
                        on:click={() => showInputGenerateField = true}>
                        Import & Generate skills for your NFT
                    </button>
                {:else}
                    <button class="flex justify-start items-start mb-[0.2vw] text-[0.8vw] text-darkGray underline hover:text-buttonHover" 
                        on:click={() => window.open(`${config.blockExplorerUrls}/address/${userAddress}#tokentxnsErc721`, "_blank")}>
                        View your NFTs you own on block explorer
                    </button>
                    <div class="flex flex-col gap-[0.2vw]">
                        <input 
                            type="text" 
                            bind:value={inputNftContract}
                            placeholder="Enter NFT Contract" 
                            class="bg-black w-[16vw] border border-white/40 text-white p-[0.2vw] text-[0.8vw]"
                        />
                        
                        <input 
                            type="text" 
                            bind:value={inputId}
                            placeholder="Enter your NFT ID" 
                            class="bg-black border border-white/40 text-white p-[0.2vw] text-[0.8vw]"
                        />
                        <button 
                            on:click={() => importAndGenerateNFT(inputNftContract, inputId)}
                            class="bg-button hover:bg-buttonHover text-white py-[0.2vw] text-[0.8vw] font-semibold mt-[0.5vw] rounded-md">
                            IMPORT NFT
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <!-- Success state - showing NFT details -->
        <div class="z-10 text-white relative flex flex-col justify-center items-center self-center w-[50vw]">
            <div class="flex flex-col rounded-md w-[35vw]" in:slide={{ duration: 300 }}>
                <div class="flex flex-col p-[1vw] bg-arenaMedium rounded-md">
                    <div class="flex gap-[1vw]">
                        <div class="w-[7vw] h-[7vw] loading">
                            <img class="bg-black w-[7vw] h-[7vw]" 
                                src={`${config.rpcUrl}/cdn/nft/${mintedNftContract}/${resultId}/200/200`}
                                onerror="this.onerror=null; this.src='/game/noImage.svg';" />
                        </div>
                        <div class="flex flex-col justify-center gap-[10px]">
                            <span class="text-lightestWood">
                                From <span class="text-button font-thin">{collectionName}</span>
                            </span>
                            <span class="font-semibold">
                                #{resultId}
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-col bg-arenaDark p-[1vw] text-arenaLight rounded-md mt-[1vw] gap-[1vw] max-h-[19vw] min-h-[19vw] hide-scrollbar overflow-y-scroll">
                        {#if attributes?.length == 0 && resultSkills?.length == 0}
                            <div class="flex flex-col gap-[1vw]">
                                <span class="text-button text-[1.2vw]">
                                    This NFT has no traits
                                </span>
                                <span class="text-white">
                                    Cannot assign skills to an NFT that has no traits (attributes).
                                </span>
                            </div>
                        {:else if attributes?.length > 0 && resultSkills?.length == 0}
                            <span class="text-[1vw] text-gray-500">
                                Generated Skills Based on NFT Trait Names:
                            </span>
                            {#each attributes as attribute}
                                <div class="flex flex-col">
                                    <span>
                                        <span class="text-button">
                                            {attribute.attribute}.{attribute.value}
                                        </span>
                                    </span>
                                    <span class="text-[0.8vw] font-medium">
                                        Activation Rate:
                                        <span class="text-white">
                                            {(100/(attributes.length)).toFixed(2)}%
                                        </span>
                                    </span>
                                    <span class="text-[0.8vw] text-white font-medium ml-[1vw]">
                                        Loading skill
                                    </span>
                                </div>
                            {/each}
                        {:else if attributes?.length > 0 && resultSkills?.length > 0}
                            {#if resultSkills[0].attribute == "BasicAttack"}
                                <span class="text-buttonHover font-bold text-[1.2vw]">
                                    This NFT has no traits; default skill is applied.
                                </span>
                            {:else}
                                <span class="text-[1vw] text-gray-500">
                                    Generated Skills Based on NFT Trait Names:
                                </span>
                            {/if}
                            {#each resultSkills as resultSkill}
                                <div class="flex flex-col">
                                    <span>
                                        <span class="text-button">
                                            {resultSkill.attribute}
                                        </span>
                                    </span>
                                    <span class="text-[0.8vw] font-medium">
                                        Activation Rate:
                                        <span class="text-white">
                                            {(100/(resultSkills.length)).toFixed(2)}%
                                        </span>
                                    </span>
                                    <span class="text-[0.8vw] text-white font-medium ml-[1vw]">
                                        {resultSkill.desc}
                                    </span>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
        <!--Done button-->
        <button 
            on:click={
            ()=>{
                trackButtonClick('doneMintGenerate-button');
                
            }}
            class="flex text-[1.4vw] justify-center self-center items-center h-fit py-[0.5vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-[34vw] px-[5vw] bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600">
            Done
        </button>
    {/if}

    <!-- Error handling UI -->
    {#if generalError}
        <div class="absolute text-[1.5vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" 
            in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
            {generalErrorValue}
        </div>
    {/if}

    <!-- Loading state -->
    {#if loading}
        <div class="z-50">
            <Loading/>
        </div>
    {/if}
</div>