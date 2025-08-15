<script>
    import { onMount } from 'svelte';
    import config from "$lib/config.js";
    import { goto } from "$app/navigation";

    let featuredCollections = [];
    let loading = true;
    let error = null;
    
    async function getPublicFeaturedMintPage() {
        try {
            const response = await fetch(config.rpcUrl, {
                method: "POST",
                body: JSON.stringify({
                    method: "getPublicFeaturedMintPage",
                    params: {}
                }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            if (response.ok) {
                const responseBody = await response.json();
                if (!responseBody.success || !responseBody.payload || !responseBody.payload.featuredCollections) {
                    console.error("Invalid response format:", responseBody);
                    error = "Invalid response format from server";
                } else {
                    // Process and sort the collections
                    const collections = responseBody.payload.featuredCollections;
                    featuredCollections = processFeaturedCollections(collections);
                }
            } else {
                const responseBody = await response.json();
                
                if (responseBody.error && responseBody.error.message) {
                    error = responseBody.error.message;
                } else {
                    error = "Unknown error occurred";
                }
            }
        } catch (e) {
            console.error("Error fetching featured collections:", e);
            error = e.message || "Failed to fetch featured collections";
        } finally {
            loading = false;
        }
    }
    
    function processFeaturedCollections(collections) {
        const now = Date.now();
        
        // Add status to each collection
        const processedCollections = collections.map(collection => {
            let status = '';
            let statusValue = 0; // 0 = ended, 1 = upcoming, 2 = active
            
            if (now < collection.PublicStartTime) {
                // Upcoming
                const timeDiff = Math.max(0, collection.PublicStartTime - now);
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                status = `Upcoming in ${days}d ${hours}h`;
                statusValue = 1;
            } else if (now <= collection.PublicEndTime) {
                // Active
                const timeDiff = Math.max(0, collection.PublicEndTime - now);
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                status = `Ends in ${days}d ${hours}h`;
                statusValue = 2;
            } else {
                // Ended
                status = 'Ended';
                statusValue = 0;
            }
            
            return {
                ...collection,
                status,
                statusValue
            };
        });
        
        // Sort by status (active first, then upcoming, then ended)
        // Within same status, sort by featured value (lower first)
        // Within same featured value, sort by PublicStartTime
        return processedCollections.sort((a, b) => {
            if (a.statusValue !== b.statusValue) {
                return b.statusValue - a.statusValue; // Higher statusValue first
            }
            
            if (a.Featured !== b.Featured) {
                return a.Featured - b.Featured; // Lower Featured first
            }
            
            return a.PublicStartTime - b.PublicStartTime;
        });
    }
    
    onMount(() => {
        getPublicFeaturedMintPage();
    });
    
</script>

<div class="min-h-screen bg-black text-white">
    <div class="flex flex-col container mx-auto px-4 py-8">
        <div class="mb-[30px]">
            <button class="flex items-center text-white" on:click={()=>{goto("../game")}}>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-[20px] w-[20px] mr-[1vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span class="">BACK</span>
            </button>
        </div>
        <h1 class="text-4xl font-bold mb-2">MINT</h1>
        <p class="text-xl mb-10">Use Arena Fire to exchange for rewards</p>
        
        {#if loading}
            <div class="flex justify-center">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
        {:else if error}
            <div class="text-red-500 p-4 rounded-md">
                {error}
            </div>
        {:else if featuredCollections.length === 0}
            <div class="text-center">
                No featured mint collections available at the moment.
            </div>
        {:else}
            <div class="flex flex-wrap gap-[30px] justify-start">
                {#each featuredCollections as collection}
                    <button on:click={()=>{goto(`/mint/${collection?.CollectionAddress}`)}} class=" relative group parent flex flex-col gap-1 rounded-xl cursor-pointer relative bg-arenaMedium min-h-[180px] max-h-[180px] max-w-[350px] px-2 py-2 hover:border-darkGreen hover:border shadow-md">
                        <!--Card img-->
                        <div class="flex relative items-center justify-center min-w-[322px] max-w-[322px] min-h-[95px] max-h-[95px] bg-black rounded-t-xl overflow-hidden">
                            <img src={`${config.rpcUrl}/banner/${collection?.CollectionAddress}`}
                                on:load={()=>{loading = false}}
                                class="shrink-on-hover object-cover w-full h-full rounded-t-xl {loading?"loading":""}" 
                                alt="NFT project's banners"/>
                            <div class="absolute w-full h-full bg-black bg-opacity-30"></div>
                            <!--Status-->
                            <div class="flex absolute right-[0px] bottom-0 items-center justify-center gap-1 px-4 py-0.5 bg-arenaMedium font-semibold text-xs rounded-l-md">
                                {#if collection.statusValue === 2}
                                    <div class="flex items-center gap-[2px]">
                                        <div class="h-[10px] w-[10px] bg-green rounded-full mb-[1px]">
                                        </div>
                                        <span>
                                            {collection.status}
                                        </span>
                                    </div>
                                {:else if collection.statusValue === 1}
                                    <div class="flex items-center gap-[2px]">
                                        <div class="h-[10px] w-[10px] bg-button rounded-full mb-[1px]">
                                        </div>
                                        <span class="text-button">
                                            {collection.status}
                                        </span>
                                    </div>
                                {:else if collection.statusValue === 0}
                                    <div class="flex items-center gap-[2px]">
                                        <div class="h-[10px] w-[10px] bg-lightStone rounded-full mb-[1px]">
                                        </div>
                                        <span class="text-lightStone">
                                            {collection.status}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                             <!--Logo-->
                            <div class="flex absolute left-[10px] overflow-hidden w-[70px] w-[70px] rounded-full">
                                <img src={`${config.rpcUrl}/logo/${collection?.CollectionAddress}`}
                                on:load={()=>{loading = false}}
                                class="shrink-on-hover object-cover w-full h-full rounded-t-xl {loading?"loading":""}" 
                                alt="NFT project's banners"/>
                            </div>
                        </div>
                        <!--Card Info-->
                        <div class="flex w-full gap-[5px] justify-between items-end ">
                            <div class="flex flex-wrap w-full justify-between mt-[10px]">
                                <div class="flex flex-col items-start font-bold yellowGreen-text gap-1 text-base">
                                    <span>
                                        {collection?.CollectionName || "Loading"}
                                    </span>
                                    <div class="font-semibold text-xs bg-buttonHover px-2 pt-1 rounded-md">
                                        NFT
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-[0.2vw] text-button items-center mr-[10px]">
                                <span class="font-semibold text-xl inline-block">
                                    {collection?.PublicPriceFire}
                                </span>
                                <img class="h-[24px] inline-block mb-[4px]" alt="Arena Fire" src="/game/ui/arenaFire.png"/>
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>