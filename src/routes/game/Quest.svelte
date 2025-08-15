<!-- lib/Quest.svelte -->
<script>
    import { formatTimeLeft } from "$lib/index.js";
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    let onetimeQuestStart
    let onetimeQuestEnds = 1748120400000;
    // Direct props from parent
    export let isQuestLoading = false;
    export let questList = [];
    export let resetChallengeHours;
    export let resetChallengeMinutes;       
    export let userAddress;
    export let questPopUp;
    
    // Functions passed from parent
    export let claimQuestReward;
    export let getUserQuests;
    
    // Local state for Quest component
    let selectedQuestType = "daily";
    
    // Get quest types that have at least one quest
    $: questTypes = Array.from(new Set((Array.isArray(questList) ? questList : []).map(quest => quest.type)));

    
    // Simple filter for the current type
    $: filteredQuests = Array.isArray(questList) ? questList.filter(quest => quest.type === selectedQuestType) : [];

    
    // Format quest type for display
    function formatQuestType(type) {
      if(type ==="daily"){
         return "Daily"
      }
      else if(type ==="one-time"){
        return "Event"
      }
      return type;
    }

    let dateNow;
    setInterval(() => {
        dateNow = Date.now();
    }, 1000);
     $: onetimeQuestTimeLeft = onetimeQuestEnds - dateNow;
</script>

<!-- Quest popup dialog -->
<div class="hidden md:flex fixed justify-center font-semibold flex-col inset-0 bg-black bg-opacity-70 z-50 font-geo" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}> 
    
    {#if isQuestLoading}
    <div class="flex items-center justify-center w-full h-full">
        <div class="text-linearGreen text-[1.5vw]">Loading quests...</div>
    </div>
    {:else}
        <div class="relative flex flex-col justify-start min-h-[26vw] max-h-[26vw] overflow-y-scroll hide-scrollbar pb-[3vw] w-[40vw] bg-arenaDark rounded-md items-center self-center border-[0.2vw] border-arenaLight">
            <button class="absolute self-end right-[0.5vw]" on:click={() => { questPopUp = false }}>
                <img class="h-[2.5vw] inline-block" alt="close icon" src="/game/ui/close.svg"/>
            </button>   
            
            <!-- Quest Type Tabs - only show if we have multiple types -->
            {#if questTypes.length > 1}
                <div class="flex gap-[0.5vw] mt-[1vw]">
                    {#each questTypes as type}
                        <button 
                            class="px-[1vw] py-[0.3vw] rounded-md text-[1.6vw] font-semibold {selectedQuestType === type ? 'bg-linearGreen text-button' : 'bg-arenaMedium text-white hover:bg-button'}"
                            on:click={() => selectedQuestType = type}
                        >
                            {formatQuestType(type)}
                        </button>
                    {/each}
                </div>
            {/if}
            
            <!-- <span class="text-[2vw] text-linearGreen mt-[2vw]">
                {formatQuestType(selectedQuestType)} Quests
            </span> -->
            
            <!-- Only show reset timer for daily quests -->
            {#if selectedQuestType === "daily"}
                <div class="flex justify-center relative w-full h-[10vw]">
                    <img alt="event" class="h-full w-full object-cover" src="./game/events/daily.webp"/>
                    <div class="absolute bottom-0 bg-black bg-opacity-50 p-[0.2vw] rounded-md text-button">
                        <span class="font-normal mb-[1vw] mt-[1vw]">
                            Reset in {resetChallengeHours}h:{resetChallengeMinutes}m
                        </span>
                    </div>
                </div>
            {/if}
            <!--
            {#if selectedQuestType === "one-time"}
                <div class="flex justify-center relative w-full h-[10vw]">
                    <img alt="event" class="h-full w-full object-cover" src="./game/events/event.webp"/>
                    <div class="absolute bottom-0 bg-black bg-opacity-50 p-[0.2vw] rounded-md text-button">
                        <span class="font-normal mb-[1vw] mt-[1vw]">
                            {#if onetimeQuestTimeLeft > 0}
                                Ends in {formatTimeLeft(onetimeQuestTimeLeft)}
                            {:else}
                                Event has ended
                            {/if}
                        </span>
                    </div>
                </div>
            {/if}
            -->
            <!-- Quest list -->
            <div class="flex flex-col gap-[0.5vw] min-h-[20vw] max-h-[20vw] overflow-y-scroll hide-scrollbar mt-[1vw]">
                {#each filteredQuests as quest}
                <div class="rounded-md flex items-center bg-arenaMedium border border-arenaLight rounded-md w-[38vw] h-[3vw] px-[1vw] py-[0.3vw] justify-between">
                    <div class="flex gap-[0.2vw]">
                        <span>{quest.mission} </span>
                        <span>({quest.currentProgress}/{quest.target}) </span>
                    </div>
                    <div class="flex gap-[0.2vw]">
                        <div class="flex gap-[0.2vw] items-center">
                            <span class="text-linearGreen">{quest.rewardFire} </span>
                            <img alt="Arena Fire" class="h-[1.5vw] mb-[0.6vw] inline" src="/game/ui/arenaFire.png"/>
                        </div>
                        {#if !quest.isClaimReward}
                            <button 
                                class="flex items-center gap-[0.5vw] hover:text-yellow-400 {quest.currentProgress < quest.target ? 'bg-[#8C8C8C]' : 'bg-darkGreen hover:bg-green'} text-[1vw] px-[1vw] py-[0.2vw] rounded-md" 
                                disabled={quest.currentProgress < quest.target}
                                on:click={() => { claimQuestReward(quest.id) }}
                            >
                                Claim
                            </button>
                        {:else if quest.isClaimReward}
                            <div class="flex items-center gap-[0.5vw] hover:text-yellow-400 bg-gray-700 text-[1vw] px-[1vw] py-[0.2vw] rounded-md">
                                Claimed
                            </div>
                        {/if}
                    </div>
                </div>
                {/each}
            </div>
        </div>
    {/if}
</div>


