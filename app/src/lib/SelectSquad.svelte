<!-- lib/SelectSquad.svelte -->
<script>
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import config from "$lib/config.js";

    // Props
    export let items = [];
    export let loading = false;
    export let squad = [{}, {}, {}];
    export let selected = {};
    export let showSelectedAtributes = [];
    export let selectedCollectionName = "";
    
    // Functions
    export let chooseSquad = () => {};
    export let getAttributes = async () => [];
    export let getEffect = () => "";

    // Loading items for skeleton
    let loadingItems1 = [{}, {}, {}, {}, {}];

    // Reactive statement to handle squad updates
    $: if (squad) {
        squad = squad; // Trigger reactivity
    }
</script>

<div class="grid grid-cols-10 gap-[2vw] w-full">
    <div class="col-span-6 flex flex-col rounded-md p-[0.5vw] gap-[0.5vw]">
        <span class="text-[1.5vw]">
            Choose your NFT
        </span>
        <span class="text-[1vw] font-normal text-gray-400">
            You can choose duplicated NFTs
        </span>
        <!--NFT places-->
        <div data-onboard="choose-squad" class="flex flex-col border-[0.3px] border-arenaLight rounded-md">
            <div class="flex flex-wrap rounded-md justify-start min-h-[16vw] max-h-[16vw] overflow-y-scroll bg-arenaDark gap-x-[0.5vw] p-[1vw]">
                <!--Example-->
                {#if items.length > 0 && !loading}
                    <div class="flex flex-wrap gap-[0.5vw] justify-start items-start gap-y-[0.1vw]">
                        {#each items as item}  
                            <button on:click={async () => {
                                selected.id = item.id;
                                selected.collection = item.collection;
                                chooseSquad();
                                const attributeResult = await getAttributes([{ collectionAddress: selected.collection, id: selected.id }]);
                                showSelectedAtributes = attributeResult[0];;
                            }} class="flex bg-black hover:border border-yellow h-fit rounded-md overflow-hidden">
                                <img alt="NFT" class="bg-black w-[5vw] h-[5vw] object-cover" src={`${config.rpcUrl}/cdn/nft/${item.collection}/${item.id}/200/200`}
                                onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                            </button>
                        {/each}
                    </div>                          
                {:else if loading}
                    {#each loadingItems1 as loadItem} 
                    <div class="loading w-[5vw] h-[5vw]">
                    </div>
                    {/each}
                {:else if items.length === 0}
                    <div class="flex flex-col text-white m-auto items-center">
                        <span class="text-arenaLight">Looks like you don't have any NFTs to battle with</span>
                        <div class="flex items-center gap-[1vw]">
                            <div class="flex items-center gap-[1vw]">
                                <button class="flex glow-border-run self-center p-[0.3vw] rounded-md bg-button hover:bg-buttonHover w-fit text-white text-[0.8vw]"
                                on:click={() => {goto("./game/importnft")}}>
                                    Import & Generate skills for your NFT
                                </button>
                            </div>
                        </div>
                    </div>
                {/if}
            </div>
            <div class="flex items-center py-[0.5vw] bg-arenaMedium">
                <span class="text-[1.3vw] ml-[3vw] mr-[4vw]">
                    My Squad
                </span>
                <!--Squad-->
                <div class="flex justify-center gap-[2vw] rounded-md">
                    <!--1-->
                    {#if squad[0].id}
                        <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={() => {squad[0] = {}; squad = squad}} in:fade={{ duration: 300 }}>
                            <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[5vw] h-[5vw] z-10">
                                <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                            </div>
                            <img class="bg-black w-[5vw] h-[5vw]" src={`${config.rpcUrl}/cdn/nft/${squad[0].collection}/${squad[0].id}/200/200`}
                            onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                        </button>
                    {:else}
                        <div class="flex">
                            <img class="w-[5vw] h-[5vw]" alt="empty slot" src="/game/ui/emptySlot.svg"/>
                        </div>
                    {/if}
                    <!--2-->
                    {#if squad[1].id}
                        <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={() => {squad[1] = {}; squad = squad}} in:fade={{ duration: 300 }}>
                            <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[5vw] h-[5vw] z-10">
                                <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                            </div>
                            <img class="bg-black w-[5vw] h-[5vw]" src={`${config.rpcUrl}/cdn/nft/${squad[1].collection}/${squad[1].id}/200/200`}
                            onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                        </button>
                    {:else}
                        <div class="flex">
                            <img class="w-[5vw] h-[5vw]" alt="empty slot" src="/game/ui/emptySlot.svg"/>
                        </div>
                    {/if}
                    <!--3-->
                    {#if squad[2].id}
                        <button class="flex relative shadow-md rounded-md overflow-hidden" on:click={() => {squad[2] = {}; squad = squad}} in:fade={{ duration: 300 }}>
                            <div class="hover:opacity-70 opacity-0 flex absolute bg-black justify-center items-center w-[5vw] h-[5vw] z-10">
                                <img class="w-[3vw] h-[3vw]" alt="close icon" src="/game/ui/close.svg"/>
                            </div>
                            <img class="bg-black w-[5vw] h-[5vw]" src={`${config.rpcUrl}/cdn/nft/${squad[2].collection}/${squad[2].id}/200/200`}
                            onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                        </button>
                    {:else}
                        <div class="flex">
                            <img class="w-[5vw] h-[5vw]" alt="empty slot" src="/game/ui/emptySlot.svg"/>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-4 flex flex-col rounded-md justify-end">
        {#if selected.id}
            <div class="flex flex-col p-[1vw] bg-arenaMedium rounded-md" in:slide={{ duration: 300 }}>
                <div class="flex gap-[1vw]">
                    <div class="w-[5vw] h-[5vw] bg-black">
                        <img class="bg-black w-[5vw] h-[5vw]" src={`${config.rpcUrl}/cdn/nft/${selected.collection}/${selected.id}/200/200`}
                        onerror="this.onerror=null; this.src='/game/noImage.svg';"/>
                    </div>
                    <div class="flex flex-col justify-center gap-[10px]">
                        <span class="text-arenaLight">
                            From <span class="text-button font-thin">{selectedCollectionName}</span>
                        </span>
                        <span class="font-semibold">
                            #{selected.id}
                        </span>
                    </div>
                </div>
                <div class="flex flex-col bg-arenaDark p-[1vw] text-arenaLight rounded-md mt-[1vw] gap-[1vw] max-h-[15vw] min-h-[15vw] overflow-y-scroll">
                    {#each showSelectedAtributes as showSelectedAtribute}
                        <div class="flex flex-col">
                            <span>
                                <span class="text-button">
                                    {showSelectedAtribute}
                                </span>
                            </span>
                            <span class="text-[0.8vw] font-medium">
                                Activation Rate
                                <span class="text-white">
                                    {(100/showSelectedAtributes.length).toFixed(2)}%
                                </span>
                            </span>
                            <span class="text-[0.8vw] text-white font-medium ml-[1vw]">
                                {getEffect(selected.collection, showSelectedAtribute)}  
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>