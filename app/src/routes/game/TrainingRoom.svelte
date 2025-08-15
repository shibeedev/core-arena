<!-- TrainingRoom.svelte -->
<script>
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import SelectSquad from "$lib/SelectSquad.svelte";
    import Loading from "$lib/Loading.svelte";
    //onboard
    import { trackButtonClick, trackPopupOpen } from '$lib/onboarding/onboardingEvents.js';

    // Props from parent
    export let address;
    export let botStages;
    export let squad;
    export let items;
    export let loading;
    export let selected;
    export let showSelectedAtributes;
    export let selectedCollectionName;
    export let stageNavigation;
    
    // Functions passed from parent
    export let getAttributes;
    export let chooseSquad;
    export let getEffect;
    export let joinTrainingRoom;


    //Local
    function stageNavigate(option) {
        if (option === "next") {
            stageNavigation = stageNavigation + 1;
            stageNavigation= stageNavigation;
        } else if (option === "back") {
            stageNavigation = stageNavigation - 1;
            stageNavigation= stageNavigation;
        }
    }

    

    $: trainingStages = botStages
        ?.filter(stage => {
            return stage.mode === "training";
        })
        .sort((a, b) => a.stageNumber - b.stageNumber) || [];
    let trainingPopUp = false;
    let popupLoading = false;
    let error = false;
    let generalError = false;
    let generalErrorValue = "Error";

    function checkSquad() {
        if (!squad[0].id || !squad[1].id || !squad[2].id) {
            error = true;
        }
    }

    // Error handling
    setInterval(() => {
        if(error === true) {
            setTimeout(() => { error = false }, 2000);
        }
        if(generalError === true) {
            setTimeout(() => { generalError = false; generalErrorValue = "Error" }, 3000);
        }
    }, 100);
</script>

<div class="flex flex-col items-center justify-center mt-[6vw] z-10 gap-[0.5vw] min-h-[31vw] max-h-[31vw]" in:fade={{ duration: 300 }}>
    <!-- Training Room Header -->
    <div class="flex flex-col items-center gap-[0.2vw] w-full">
        <span class="text-[2vw] font-bold text-white">
            TRAINING ROOM
        </span>
    </div>

    <!-- Training Arena Display -->
    {#if trainingStages[stageNavigation]}
        <div class="relative flex flex-col items-center justify-center rounded-lg min-h-[28vw] w-[70vw] p-[1vw] bg-arenaDark">
            <!-- Background decorative elements -->
            <div class="relative h-[22vw] bg-black w-full">
                <!--Mob info-->
                <div class="absolute flex flex-col gap-[0.2vw] bg-black bg-opacity-70 px-[1vw] py-[0.5vw] left-0 top-0 w-[15vw] h-[5vw] rounded-b-md">
                    <span class="text-[1.2vw] text-button font-semibold">
                        {trainingStages[stageNavigation].stageName}
                    </span>
                    <div class="text-[0.9vw]">
                        <span >
                            Difficulty:
                        </span>
                        <span>
                            {'⭐'.repeat(trainingStages[stageNavigation].stageDiff)}
                        </span>
                    </div>
                </div>
                <img src={`/game/training/${trainingStages[stageNavigation].stageImg}.webp`} alt="training stage background" class="w-full h-full object-cover"/>
            </div>
            <div class="absolute flex w-full justify-between">
                {#if stageNavigation > 0}
                    <button class="flex w-fit ml-[-7vw] z-50 self-hover"
                    on:click={()=>{stageNavigate("back")}}>
                        <img src="game/ui/back.svg" class="h-[5vw] w-full" alt="next"/>
                    </button>
                {:else}
                    <div></div>
                {/if}
                {#if stageNavigation < trainingStages.length -1}
                    <button class="flex w-fit mr-[-7vw] z-50 self-hover"
                    on:click={()=>{stageNavigate("next")}}>
                        <img src="game/ui/next.svg" class="h-[5vw] w-full" alt="next"/>
                    </button>
                {:else}
                    <div></div>
                {/if}
            </div>
            <!--Chaining decoration-->
            <div class="absolute flex overflow-hidden w-full h-[1.6vw] bottom-[2.2vw]">
                <img src="game/ui/chain.svg" class="h-[1.6vw] w-full" alt="chain"/>
            </div>

            

            <!-- Fight Button -->
            <button  data-onboard="training-fight-button"
                class="flex justify-center items-center bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-[1.4vw] my-[0.5vw] px-[4vw] py-[0.4vw] rounded-lg border-[0.2vw] border-amber-300 shadow-lg transform hover:scale-105 transition-all duration-200"
                on:click={() => { 
                    trainingPopUp = true
                        trackButtonClick('training-fight-button');
                        trackPopupOpen('training-popup'); 
                    }}
            >
                <img src="/game/ui/fight.svg" alt="sword icon" class="h-[1.5vw]"/>
                <span class="flex items-center text-[1.5vw] ">
                    FIGHT
                </span>
            </button>
        </div>
    {/if}
</div>

<!-- Training Squad Selection Popup -->
{#if trainingPopUp}
    <div class="absolute font-semibold flex flex-col items-center inset-0 bg-black bg-opacity-70 z-30 text-white w-full" 
         in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
        <div class="relative flex flex-col mt-[2vw] pt-[1vw] pb-[1vw] px-[2vw] bg-arenaBg rounded-md w-[86vw]">
            <button class="self-end" on:click={() => { trainingPopUp = false }}>
                <img class="absolute h-[3vw] inline-block right-[1vw]" alt="close icon" src="/game/ui/close.svg"/>
            </button>
            
            <!-- Squad Selection -->
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
                        
            <button
                data-onboard="training-challenge-button" 
                on:click={() => {
                    checkSquad();
                    trackButtonClick('training-challenge-button');
                    if (!error) {
                        
                        joinTrainingRoom(squad, address);
                    }
                }} 
                class="flex justify-center self-center items-center mt-[1vw] h-fit py-[0.7vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[8vw] bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600"
            >
                <img src="/game/ui/fight.svg" alt="sword icon" class="h-[1.5vw]"/>
                <span class="flex items-center text-[1.4vw] ">
                    Challenge
                </span>
            </button>

        </div>
    </div>
{/if}

<!-- Error Messages -->
{#if error}
    <div class="absolute text-[2vw] bottom-0 right-[20vw] mb-[3vw] bg-red-500 px-[1vw] py-[0.5vw] rounded-md z-50" 
         in:slide={{ duration: 200 }} out:slide={{ duration: 200 }}>
        You have to choose squad before training
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

