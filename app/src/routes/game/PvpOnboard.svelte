<script>
    import { fade, slide } from 'svelte/transition';
    import { ethers } from "ethers";
    import { erc721Simple } from "$lib/contract.config.js";
    import config from "$lib/config.js";
    import { addNFTToWallet } from '$lib/localWalletStorage.js';
    import Loading from "$lib/Loading.svelte";
    import { trackButtonClick } from '$lib/onboarding/onboardingEvents.js';
    import {closeOnboarding} from '$lib/onboarding/onboardingStore.js';

    //prop

    
    const pvpSlides = [
        { imgSrc: "1.webp", buttonName: "Start tutorial" },
        { imgSrc: "2.webp", buttonName: "Next" },
        { imgSrc: "3.webp", buttonName: "Next" },
        { imgSrc: "4.webp", buttonName: "Next" },
        { imgSrc: "5.webp", buttonName: "Next" },
        { imgSrc: "6.webp", buttonName: "Next" },
        { imgSrc: "7.webp", buttonName: "Next" },
        { imgSrc: "8.webp", buttonName: "Next" },
        { imgSrc: "9.webp", buttonName: "Next" },
        { imgSrc: "10.webp", buttonName: "Next" }
    ];

    let currentSlideIndex = 0;
    $: selected = pvpSlides[currentSlideIndex];

    function handleNext() {
        if (currentSlideIndex < pvpSlides.length - 1) {
            currentSlideIndex++;
        } else {
            // Handle completion - you might want to close the modal or emit an event
            console.log("Tutorial completed!");
            // Add your completion logic here
        }
    }
</script>

<div data-onboard="pvpMode" class="flex flex-col justify-center items-center fixed justify-center font-semibold inset-0 bg-black bg-opacity-100 z-50 font-geo" in:fade={{ duration: 300 }} out:fade={{ duration: 300 }}>
    <div class="relative flex w-[80vw] h-full" in:fade={{ duration: 500 }}>
        <img class="w-full h-full object-cover" src={`/game/onboardPvP/${selected.imgSrc}`} alt="PvP Tutorial Step {currentSlideIndex + 1}" in:fade={{ duration: 300 }} />
    </div>

    {#if currentSlideIndex +1 < pvpSlides.length}
        <button 
            on:click={handleNext}
            class="bottom-[4vw] absolute flex text-[1.4vw] justify-center items-center h-fit py-[0.5vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[5vw] mt-[1vw] bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600">
            {selected.buttonName}
        </button>
    {:else}
        <button 
            on:click={()=>{trackButtonClick('done-pvpOnboard'); closeOnboarding('newUser')}}
            class="bottom-[4vw] absolute flex text-[1.4vw] justify-center items-center h-fit py-[0.5vw] rounded-md border-[0.15vw] border-button hover:border-buttonHover gap-[0.5vw] w-fit px-[5vw] mt-[1vw] bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600">
            Done
        </button>
    {/if}

</div>