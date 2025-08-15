<script>
    import { fade, slide } from 'svelte/transition';
    export let isShowTutorialPopUp = false;
    export let resetEvents;
    export let resetOnboarding;
    export let navigation;
</script>

<div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" style="z-index: 10002;" transition:fade={{duration: 200}}>
    <div class="bg-arenaDark border-2 border-button rounded-lg p-[2vw] max-w-[28vw] shadow-xl" transition:slide={{duration: 300}}>
        <h3 class="text-[1.4vw] font-bold text-white mb-[1vw]">Welcome player 👋</h3>
        <p class="text-[1vw] text-arenaLight mb-[1.5vw]">
            Do you want to start the tutorial?
        </p>
        
        <div class="flex flex-col gap-[1vw]">
            <!-- Start Tutorial Button (Primary) -->
            <button 
                class="w-full px-[1.2vw] py-[0.5vw] bg-button hover:bg-buttonHover rounded text-[0.9vw] text-white font-semibold transition-colors duration-200"
                on:click={()=>{navigation = "hall"; resetEvents();resetOnboarding('newUser'); isShowTutorialPopUp = false}}
            >
                Start Tutorial
            </button>
            
            <!-- Secondary Actions -->
            <div class="flex gap-[1vw] justify-between items-center">
                <button 
                    class="px-[1.2vw] py-[0.4vw] bg-gray-600 hover:bg-gray-700 rounded text-[0.9vw] text-white transition-colors duration-200"
                    on:click={()=>{isShowTutorialPopUp = false}}
                >
                    Skip for Now
                </button>
                
                <a 
                    href="https://corearena.xyz/docs/quick-start/" target="_blank"
                    class="text-[0.8vw] text-arenaLight hover:text-white underline transition-colors duration-200"
                    on:click={()=>{}}
                >
                    or watch more on our documentation
                </a>
            </div>
        </div>
    </div>
</div>