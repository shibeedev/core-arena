<!-- lib/PvPMode.svelte -->
<script>
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { emitBetweenText } from '$lib/index.js';
    import config from "$lib/config.js";
    import Loading from "$lib/Loading.svelte";
    import SelectSquad from "$lib/SelectSquad.svelte";

    // Direct props from parent
    export let address;
    export let matches;
    export let squad;
    export let withdrawList;
    export let battleHistory;
    export let challengeUsed;
    export let challengePerDay;
    export let resetChallengeHours;
    export let resetChallengeMinutes;
    export let items;
    export let loading;
    export let selected;
    export let showSelectedAtributes;
    export let selectedCollectionName;
    
    // Functions passed from parent
    export let getMatches;
    export let loadQueue;
    export let challenge;
    export let delistBattle;
    export let claimBattleWinnings;
    export let getAttributes;
    export let chooseSquad;
    export let getEffect;

    // Local state for PvP mode
    let matchPopUp = false;
    let challengePopUp = false;
    let withDrawPopUp = false;
    let inputStake;
    let selectedChallengeTarget = "";
    let selectedChallengeId = "";
    let selectedStakeDisplay;
    let popupLoading = false;
    let error = false;
    let errorOutChallenge = false;
    let generalError = false;
    let generalErrorValue = "Error";
    let copiedBattleId = null
    // PvP-specific functions
    function checkSquad() {
        if (!squad[0].id || !squad[1].id || !squad[2].id) {
            error = true;
        }
    }

    function checkOutChallenge() {
        if (challengeUsed >= challengePerDay) {
            errorOutChallenge = true;
        }
    }

    function calculateTotalWithdrawable() {
        if (!withdrawList || withdrawList.length === 0) {
            return 0;
        }
        return withdrawList.reduce((total, item) => total + (item.value * 2), 0);
    }

    function formatTimeLeftBattle(timestamp) {
        let milliseconds = Date.now() - timestamp;
        let totalSeconds = Math.floor(milliseconds / 1000);
        let totalMinutes = Math.floor(totalSeconds / 60);
        let totalHours = Math.floor(totalMinutes / 60);
        let totalDays = Math.floor(totalHours / 24);
        let totalWeeks = Math.floor(totalDays / 7);
        
        if (totalWeeks > 0) {
            return `${totalWeeks} week${totalWeeks > 1 ? 's' : ''} ago`;
        } else if (totalDays > 0) {
            return `${totalDays} day${totalDays > 1 ? 's' : ''} ago`;
        } else if (totalHours > 0) {
            return `${totalHours} hour${totalHours > 1 ? 's' : ''} ago`;
        } else if (totalMinutes > 0) {
            return `${totalMinutes} minute${totalMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }

    async function copyBattleLink(battleID) {
        try {
            await navigator.clipboard.writeText(`https://corearena.xyz/game/${battleID}`);
            copiedBattleId = battleID;
            setTimeout(() => {
                copiedBattleId = null;
            }, 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }
    
    // Error handling
    setInterval(() => {
        if(error === true) {
            setTimeout(() => { error = false }, 2000);
        }
        if(errorOutChallenge === true) {
            setTimeout(() => { errorOutChallenge = false }, 2000);
        }
        if(generalError === true) {
            setTimeout(() => { generalError = false; generalErrorValue = "Error" }, 3000);
        }
    }, 100);
    
</script>

<div class="flex gap-[4vw] mt-[1vw] z-10 pl-[1vw] mt-[6vw] min-h-[31vw] max-h-[31vw]" in:fade={{ duration: 300 }}  >
    <div class="relative justify-center items-center flex flex-col bg-arenaMedium rounded-md p-[0.5vw] w-fit">
        <!-- Table -->
        <div class="flex flex-col flex-grow">
            <!-- Header -->
            <div class="flex gap-[0.5vw] text-arenaLight px-[0.8vw]">
                <div class="w-[10%]"></div>
                <div class="w-[50%]">Address</div>
                <div class="w-[20%]">Stake</div>
                <div class="flex justify-center w-[20%]">
                    <button class="flex w-[20%] justify-center" on:click={getMatches}>
                        <img alt="refresh rank board" class="h-[1.5vw] w-[1.5vw]" src="/game/ui/refresh.svg"/>
                    </button>
                </div>
            </div>
            <!-- Table -->
            <div class="flex flex-col justify-between gap-[1vw] text-[0.8vw] bg-arenaDark min-h-[28vw] max-h-[28vw] w-[45vw] rounded-md overflow-y-scroll hide-scrollbar">
                {#if matches.length > 0}
                    <!-- Matches NOT created by the user -->
                     <div class="flex flex-col gap-[0.7vw] px-[0.8vw] pt-[0.7vw]">
                        {#each matches.filter(match => address !== match.daddress) as match, index}
                        <!-- Match row -->
                        <div class="flex items-center gap-[0.5vw] w-full hover:text-yellow-400 border-b-[0.1vw] border-arenaMedium">
                            <div class="w-[10%]">{index+1}</div>
                            <div class="w-[50%]">{emitBetweenText(match.daddress, 10)}</div>
                            <div class="w-[20%] flex items-center gap-[0.1vw]">
                                <span>
                                    {match.value} 
                                </span>
                                <img class="h-[1vw] inline" alt="currency" src="/icons/CORE.png"/>
                            </div>
                            <div class="w-[20%]">
                                <button on:click={() => {
                                    selectedChallengeTarget = match.daddress;
                                    selectedChallengeId = match.battleID;
                                    selectedStakeDisplay = match.value;
                                    challengePopUp = true;
                                }} class="flex gap-[0.5vw] w-full justify-center items-center text-green hover:text-button">
                                    <img src="/game/ui/fight.svg" alt="sword icon" class="h-[1.5vw]"/>
                                    <span class="text-[1vw] ">
                                        FIGHT
                                    </span>
                                </button>
                            </div>
                        </div>
                        {/each}
                     </div>
                     <!-- Matches created by the user -->
                    <div class="flex flex-col overflow-y-scroll hide-scrollbar max-h-[10vw] py-[0.2vw] px-[0.8vw] bg-black bg-opacity-40 ">
                        {#if matches.filter(match => address === match.daddress).length > 0}
                            <span class="mb-[0.2vw] text-[0.9vw]">
                                Matches created by you
                            </span>
                        {/if}
                        {#each matches.filter(match => address === match.daddress) as match, index}
                            <div class="flex items-center gap-[0.5vw] w-full hover:text-yellow-400">
                                <div class="w-[10%]">{matches.filter(m => address !== m.daddress).length + index + 1}</div>
                                <div class="w-[50%] text-yellow-400 font-semibold text-button">YOU</div>
                                <div class="w-[20%] flex items-center gap-[0.1vw]">
                                    <span>
                                        {match.value} 
                                    </span>
                                    <img class="h-[1vw] inline" alt="currency" src="/icons/CORE.png"/>
                                </div>
                                <div class="w-[20%]">
                                    <button class="flex gap-[0.5vw] w-full justify-center items-center text-green hover:text-button"
                                    on:click={() => delistBattle(address, match.battleID)}>
                                        <span class="text-[1vw] text-red-500 hover:text-button">
                                            CANCEL
                                        </span>
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {:else}
                    <span class="m-auto text-[1.2vw]">
                        There are no defenders now, let's create a match
                    </span>
                {/if}  
            </div>
        </div>
    </div>
    
    <!-- Rest of PvP UI, exactly as it appears in the original file -->
    <div class="flex flex-col justify-between">
        <div class="flex flex-col gap-[0.5px]">
            <span class="text-[3vw]">
                PVP MODE
            </span>
            <span class="text-[1.22vw]">
                Solo 1v1, winner take staked ${config.nativeCurrency.name} from loser
            </span>

            <div class="flex flex-col bg-black border border-white rounded-md px-[1vw] py-[0.2vw] w-fit text-[0.8vw] mt-[0.5vw]">
                <div class="flex items-center gap-[0.2vw]">
                    <span>Challenged: {challengeUsed}/{challengePerDay}</span>
                    <img alt="fight icon" class="h-[0.8vw]" src="/game/ui/fight.svg"/>
                </div> 
                <span class="text-[0.7vw] text-darkGray">
                Reset in {resetChallengeHours}h:{resetChallengeMinutes}m
                </span>
            </div>
        </div>
        
        <!-- Create a match button -->
        <button class="flex justify-center items-center h-fit py-[0.7vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] glow-border-run"
        on:click={() => { matchPopUp = true }}>
            <span class="text-[1vw] text-button hover:text-buttonHover">
                CREATE A MATCH
            </span>
            <img src="/game/ui/fight.svg" alt="fight icon" class="h-[1.5vw]"/>
        </button>
        
        <!-- Battle history section -->
        <div class="flex flex-col rounded-md py-[1vw]">
            <div class="flex items-end gap-[1vw] mb-[0.5vw] justify-between mb-[0.3vw] ">
                <span class="text-[1.1vw] self-start text-white">
                    Your recent battle history
                    <span class="text-[0.8vw] text-gray-300">
                        (30days)
                    </span>
                </span>

                <button class="flex items-center gap-[0.5vw] relative border rounded-md px-[1vw] border-button text-button hover:text-buttonHover hover:border-buttonHover"
                on:click={() => { withDrawPopUp = true }}>
                    <span>Withdraw rewards</span>
                    {#if withdrawList?.length > 0}
                        <div class="flex items-center justify-center bg-red-600 w-[1vw] h-[1vw] rounded-full text-[0.5vw] right-[1.5vw] glow-border-run-red"></div>
                    {/if}
                </button>
            </div>
            <div class="flex flex-col rounded-md py-[1vw] border border-white bg-black bg-opacity-80">
                {#if battleHistory.length > 0}
                    <div class="flex flex-col justify-start text-[0.9vw] font-normal gap-[0.2vw] min-h-[7vw] max-h-[7vw] min-w-[34vw] mx-[1vw] overflow-y-scroll hide-scrollbar">
                        {#each battleHistory as battle} 
                            <div class="flex gap-[0.5vw]">
                                <div class="flex text-[0.8vw] text-gray-500">
                                    {#if battle?.timestamp}
                                        {formatTimeLeftBattle(battle.timestamp)}
                                    {:else}
                                        ...
                                    {/if}
                                </div>
                                <!--Battle status-->
                                {#if (battle.winner === 1 && battle.caddress == address) || (battle.winner === 2 && battle.daddress == address)}
                                    <div class="flex text-[#81F328] w-[2vw]">
                                        <span>Won</span>
                                    </div>
                                {:else if (battle.winner === 2 && battle.caddress == address) || (battle.winner === 1 && battle.daddress == address)}
                                    <div class="text-red-700 w-[2vw]">
                                        Lost
                                    </div>
                                {:else if battle.winner === -1}
                                    <div class="text-white w-[2vw]">
                                        Draw
                                    </div>
                                {/if}
                                <!--Action status-->
                                {#if (battle.caddress == address)}
                                    <span class=" w-[12vw] text-gray-500">
                                        You challenge <span class="text-white">{emitBetweenText(battle.daddress, 10)}</span>
                                    </span>
                                {:else if (battle.daddress == address)}
                                    <span class=" w-[12vw] text-gray-500">
                                        You defend <span class="text-white">{emitBetweenText(battle.caddress, 10)}</span>
                                    </span>
                                {/if}
                                <!--Stake-->
                                {#if (battle.winner === 1 && battle.caddress == address) || (battle.winner === 2 && battle.daddress == address)}
                                    <div class="flex gap-[0.2vw] items-center w-[6vw]">
                                        <span class="font-semibold text-white">+ {battle.stake}</span>
                                        <img class="h-[1vw]" alt="currency" src="/icons/CORE.png"/>
                                    </div>
                                {:else if (battle.winner === 2 && battle.caddress == address) || (battle.winner === 1 && battle.daddress == address)}
                                    <div class="flex gap-[0.2vw] items-center w-[6vw]">
                                        <span class="font-semibold text-white">- {battle.stake}</span>
                                        <img class="h-[1vw]" alt="currency" src="/icons/CORE.png"/>
                                    </div>
                                {:else if battle.winner === -1}
                                    <div class="text-white w-[6.3vw]">
                                        <span class="font-semibold text-white">0</span>
                                        <img class="h-[1vw]" alt="currency" src="/icons/CORE.png"/>
                                    </div>
                                {/if}
                                <button class="flex items-center" on:click={window.open(`/game/${battle.battleID}`)}>
                                    <img/>
                                    <span class="hover:text-buttonHover text-button">
                                        Watch
                                    </span>
                                </button>
                                <button class="flex items-center" on:click={() => copyBattleLink(battle.battleID)}>
                                    <img/>
                                    <span class="hover:text-buttonHover text-button">
                                        {copiedBattleId === battle.battleID ? 'Copied link' : 'Share'}
                                    </span>
                                </button>
                            </div>
                        {/each}
                    </div>
                {:else if battleHistory.length === 0}
                    <div class="flex flex-col items-center justify-center text-[1vw] text-gray-500 font-normal gap-[0.2vw] min-h-[7vw] max-h-[7vw] min-w-[34vw] mx-[1vw] overflow-y-scroll hide-scrollbar">
                        Looks like you haven't had any PvP battles yet
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Create match Popups --->
{#if matchPopUp}
    <div class="absolute font-semibold flex flex-col items-center inset-0 bg-black bg-opacity-70 z-30 text-white z-10 w-full" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
        <div class="relative flex flex-col mt-[2vw] pt-[1vw] pb-[1vw] px-[2vw] bg-arenaBg rounded-md w-[86vw]">
            <button class="self-end" on:click={() => { matchPopUp = false}}>
                <img class="absolute h-[3vw] inline-block right-[1vw]" alt="close icon" src="/game/ui/close.svg"/>
            </button>
            
            <SelectSquad 
                {items}
                {loading}
                bind:squad
                bind:selected
                bind:showSelectedAtributes
                {selectedCollectionName}
                {chooseSquad}
                {getAttributes}
                {getEffect}
            />
            
            <!--Stake-->
            <div class="flex flex-col self-center w-fit w-[36vw] items-center justify-center gap-[0.3vw] bg-arenaMedium font-normal py-[0.5vw] my-[1.5vw] rounded-md">
                <div class="flex gap-[0.6vw] text-[1.1vw] px-[1vw]">
                    <span class="">Stake :</span>
                    <input bind:value={inputStake} type="number" max="10" min="0" 
                    class="flex justify-end text-white bg-arenaDark rounded-md w-[8vw] px-[0.4vw] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    placeholder="0"
                    on:input={(e) => {
                        if (parseFloat(e.target.value) > 10) {
                        inputStake = "10";
                        }
                    }}/>
                    <span>{config.nativeCurrency.name}</span>
                </div>
                
                <div class=" text-[0.8vw] text-darkGray px-[1vw]">
                    In this phase, the maximum stake per match is 10 $CORE
                </div>
            </div>
            <!--Create a match-->
            <button on:click={() => {
                checkSquad();
                if (!error) {
                    loadQueue(squad, address, inputStake);
                }
            }} class="flex justify-center self-center items-center h-fit py-[0.7vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[11vw]">
                <img alt="fight" src="/game/ui/fight.svg" class="h-[2vw]"/>
                <span class="text-[1vw] ">
                    CREATE A MATCH
                </span>
            </button>
        </div>
    </div>
{/if}

<!-- Challenge match popup  -->
{#if challengePopUp}
    <div class="absolute font-semibold flex flex-col items-center inset-0 bg-black bg-opacity-70 z-30 text-white z-10 w-full" in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
        <div class ="relative flex flex-col mt-[2vw]  pt-[1vw] pb-[1vw] px-[2vw] bg-arenaBg rounded-md w-[86vw]">
            <button class="self-end" on:click={()=>{ challengePopUp = false; selectedChallengeTarget = ""; selectedChallengeId=""; selectedStakeDisplay = "";}}>
                <img class="absolute h-[3vw] inline-block right-[1vw]" alt="close icon" src="/game/ui/close.svg"/>
            </button>
            <!--Squad team pop up-->
            <SelectSquad 
                {items}
                {loading}
                bind:squad
                bind:selected
                bind:showSelectedAtributes
                {selectedCollectionName}
                {chooseSquad}
                {getAttributes}
                {getEffect}
            />
            <!--Stake-->
            <div class="flex gap-[1vw] self-center w-fit items-center justify-center gap-[0.3vw] font-normal my-[1.5vw]">
                <div class="flex gap-[0.6vw] text-[1.1vw] px-[1vw] bg-arenaMedium py-[0.5vw] rounded-md">
                    <img alt="fight" src="/game/ui/fight.svg" class="h-[1.5vw]"/>
                    <span class="">Challenge</span>
                    <span class="text-button">
                        {emitBetweenText(selectedChallengeTarget,10)}
                    </span>
                </div>
                <div class="flex gap-[0.6vw] text-[1.1vw] px-[1vw] bg-arenaMedium py-[0.5vw] rounded-md">
                    <span class="">Stake :</span>
                    <span class="text-button">
                        {selectedStakeDisplay} {config.nativeCurrency.name}
                    </span>
                </div>
            </div>
            <!--Create a match-->
            <button on:click={() => {
                checkSquad();
                checkOutChallenge();
                if (!error&&!errorOutChallenge) {
                    challenge(squad, address, selectedChallengeTarget, selectedChallengeId);
                }
            }}  class="flex justify-center self-center items-center h-fit py-[0.7vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[11vw]">
                <img alt="fight" src="/game/ui/fight.svg" class="h-[2vw]"/>
                <span class="text-[1.5vw] ">
                    Challenge
                </span>
            </button>
        </div>
    </div>
{/if}

<!-- Withdraw popup  -->
{#if withDrawPopUp}
    <div class="hidden md:flex fixed justify-center font-semibold  flex-col inset-0 bg-black bg-opacity-70 z-50"> 
        <div class="relative flex flex-col justify-start min-h-[20vw] pb-[3vw] w-[45vw] bg-arenaDark rounded-md items-center self-center border-[0.2vw] border-arenaLight">
            <button class="absolute self-end right-[0.5vw]" on:click={()=>{ withDrawPopUp = false}}>
                <img class=" h-[2.5vw] inline-block " alt="close icon" src="/game/ui/close.svg"/>
            </button>   
            <span class="text-[2vw] text-button mt-[2vw]">
                Withdraw Rewards
            </span>
            <span class="font-normal mb-[0.3vw] border rounded-md px-[1vw]">
                Total withdrawable: <span class="text-button">{calculateTotalWithdrawable(withdrawList)} {config.nativeCurrency.name}</span> 
            </span>
            <span class="font-normal italic text-[0.8vw]">
                Platform Fee is 1%
            </span>
            {#if withdrawList?.length >0}
            <div class="flex flex-col justify-start text-[0.9vw] font-normal gap-[0.2vw] min-h-[10vw] max-h-[10vw] rounded-md p-[1vw] mx-[1vw] overflow-y-scroll bg-black">
                {#each withdrawList as withdrawItem} 
                    <div class="flex items-center">
                        {#if address === withdrawItem.caddress}
                            <div class="flex text-[#81F328] mr-[1vw]">
                                Challenge Success
                            </div>
                            <span class="">
                                You challenged <span class="text-button">{emitBetweenText(withdrawItem.daddress, 10)}</span>
                            </span>
                        {:else if address === withdrawItem.daddress}
                            <div class="text-[#81F328] mr-[1vw]">
                                Defend Success
                            </div>
                            <span class="">
                                You defended <span class="text-button">{emitBetweenText(withdrawItem.caddress, 10)}</span>
                            </span>
                        {/if}
                        <div class="flex gap-[0.2vw] items-center ml-[2vw]">
                            <span class=" font-semibold text-white">{withdrawItem.value*2}</span>
                            <img class="h-[1vw]" alt="currency" src="/icons/CORE.png"/>
                        </div>
                        <button class="mx-[1vw] px-[1vw] rounded-md bg-button hover:bg-black hover:border-buttonHover hover:border" on:click={()=>claimBattleWinnings(address, withdrawItem.battleID)}>
                            Withdraw
                        </button>

                    </div>
                {/each}
            </div>
            {:else}
                <span class="mt-[2vw] text-[1.1vw] font-normal">
                    Looks like you don't have any winning matches to claim stake
                </span>   
            {/if}

        </div>
    </div>
{/if}

<!-- Error messages - copy from original -->
{#if error}
    <div class="absolute text-[2vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" 
         in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
        You have to choose squad before battle
    </div>
{/if}

{#if errorOutChallenge}
    <div class="absolute text-[2vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" 
         in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
        You have used all your challenge attempts for today.
    </div>
{/if}

{#if generalError}
    <div class="absolute text-[1.5vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" 
         in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
        {generalErrorValue}
    </div>
{/if}

{#if popupLoading}
    <div class="z-50">
        <Loading/>
    </div>
{/if}