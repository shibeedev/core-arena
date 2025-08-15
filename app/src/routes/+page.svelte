<script>
    import Seo from '$lib/Seo.svelte';
    import { slide } from 'svelte/transition';
    import { fade } from 'svelte/transition';
    import { onMount, onDestroy } from "svelte";
    import { goto } from '$app/navigation';
    import config from "$lib/config.js";
    import Loading from "$lib/Loading.svelte";
    import Nav from "./Nav.svelte"
    import Footer from "./Footer.svelte"

    let gameCriterias = [
        {
            title :"Balanced Skills & Stats for all NFTs",
            img:"/landingPage/balance.svg",
            description:"- All skills and stats must be ballance<br>- Skills randomly generated from NFT trait name<br>- Rarity or price has no effect on NFT power"
        },
        {
            title :"No Pay-to-Win",
            img:"/landingPage/nop2w.svg",
            description:"- No purchasable power-ups<br>- No level progression systems<br>- Rarity or price have no effect on NFT power"
        },
        {
            title :"Strategy matters most",
            img:"/landingPage/strategic.svg",
            description:"- Victory depends on squad combination strategy<br>- No single overpowered NFT/team can dominate"
        }
    ]
    
    let gameConcepts = [
        {
            description:"Select any NFT for your squad and stake $CORE to create a match"
        },
        {
            description:"Challengers choose NFT squad and stake the same $CORE amount to join a match"
        },
        {
            description:"The match is 1v1, winners take the staked $CORE from the losing player"
        }
    ]
    
    const playVideoHandlers = new Map();
    onMount(() => {
        // Force play all videos on mobile after page is loaded
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            // Try to play immediately
            video.play().catch(error => {
                console.log("Initial autoplay prevented:", error);
            });
            
            // Retry playing videos on first user interaction
            const playVideo = () => {
                video.play().catch(error => {
                    console.log("User-initiated play prevented:", error);
                });
            };
            
            // Listen for user interactions to trigger playback
            document.addEventListener('touchstart', playVideo, { once: true });
            document.addEventListener('click', playVideo, { once: true });
        });
    });

    // Clean up event listeners when component is destroyed
    onDestroy(() => {
        // Remove any remaining event listeners
        playVideoHandlers.forEach((handler) => {
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
        });
        
        // Clear the Map
        playVideoHandlers.clear();
    });


</script>

<Seo title={""} description={""} keywords={""}/>
<div class="flex justify-center text-white font-Hoves bg-black w-full">
    <div class="relative flex flex-col w-full max-w-screen-2xl min-h-screen">
        <div class=" mr-4">
            <Nav/>
        </div>
        <!--First page-->
        <div class="relative  flex justify-center font-semibold flex-col bg-black bg-opacity-90 z-20 font-geo overflow-hidden w-full mx-auto">
            <!-- Battle scene -->
            <div class="relative flex flex-col justify-center h-[713px] min-w-[1384px] left-1/2 -translate-x-1/2 overflow-hidden mt-[-60px]">        
                <img loading="lazy" class="absolute min-h-full w-full object-cover" alt="background" src="/game/load/bgLoad.webp"/>
                <img alt="nft" class="absolute left-[79px] bottom-[333px] z-10 h-[238px] w-auto object-contain floating" src="/game/load/coolCat.png"/>
                
                <div class="flex absolute left-[269px] bottom-[206px] w-[792px] h-[238px] floating3">
                    <div class="flex justify-start relative w-full h-full">
                        <img alt="nft" class="absolute z-10 h-[230px] w-auto object-contain" src="/game/load/coretoshi.png"/>
                        <img alt="fire" class="absolute left-[48px] top-[16px] z-20 h-[190px] w-[444px] widthPulse" src="/game/load/fire.png"/>
                    </div>
                </div>
                
                <div class="flex absolute left-[79px] bottom-[48px] z-10 h-[190px] w-[174px] floating">
                    <div class="flex relative w-full h-full">
                        <img alt="random nft" class="absolute z-10 h-[190px] w-auto object-contain" src="/game/load/punk.png"/>
                        <img alt="hit effect" class="absolute left-[95px] top-[32px] z-20 h-auto w-[158px] object-contain glitch" src="/game/load/hit.png"/>
                    </div>
                </div>
                
                <div class="flex absolute right-[79px] bottom-[333px] w-[792px] h-[206px] floating">
                    <div class="flex relative w-full h-full">
                        <img alt="random nft" class="absolute right-0 bottom-[16px] h-[206px] w-auto object-contain" src="/game/load/a1.png"/>
                        <img alt="thunder" class="absolute right-[95px] top-[16px] z-20 h-[111px] w-[602px] widthPulse" src="/game/load/thunder.png"/>
                    </div>
                </div>
                
                <div class="flex absolute right-[269px] bottom-[206px] h-[254px] w-[174px]">
                    <div class="flex relative w-full h-full">
                        <img alt="random nft" class="absolute z-10 h-[254px] w-auto object-contain floating4" src="/game/load/cryptoPunk.png"/>
                        <img alt="spell" class="absolute right-[32px] top-[48px] z-10 h-auto w-[158px] object-contain floating2" src="/game/load/wkSpel.png"/>
                    </div>
                </div>
                
                <div class="flex absolute right-[79px] bottom-[48px] h-[206px] w-[174px] floating">
                    <div class="flex relative w-full h-full">
                        <img alt="random nft" class="absolute z-10 h-[206px] w-auto object-contain" src="/game/load/t1.png"/>
                        <img alt="explode" class="absolute right-[79px] top-[79px] z-20 h-auto w-[127px] object-contain shrink" src="/game/load/explode.png"/>
                    </div>
                </div>

                <!-- Black overlay -->
                <div class="absolute opacity-60 w-full h-full bg-black z-10">
                </div>
                <!-- Keep your card elements exactly as they were -->
                <div class="flex absolute left-1/2 -translate-x-[calc(50%+50px)] z-10">
                    <div class="flex ">
                        <div class="absolute h-[170px] w-[308px] bottom-[150px] right-[100px]">
                            <img class="h-full object-fill" src="/landingPage/topThunder.webp" alt="Thunder skill"/>
                        </div>
                        <div class="absolute h-[250px] w-[216px] top-[150px] right-[100px]">
                            <img class="h-full object-fill" src="/landingPage/bottomThunder.webp" alt="Thunder skill"/>
                        </div>
                        <img alt="Cryptopunk NFT card" class="h-[250px] z-10" src="/landingPage/bigLeftCard.webp"/>
                    </div>
                </div>
                <div class="flex absolute left-1/2 -translate-x-[calc(50%-1000px)] z-10 floatingFixed2">
                    <div class="flex ">
                        <img alt="Coretoshi NFT card" class="h-[265px] z-10" src="/landingPage/bigRightCard.webp"/>
                        <div class="absolute left-[60px] h-[300px] w-[400px] z-10 overflow-hidden">
                            <img class="w-full h-full object-fill" src="/landingPage/bigFire.webp" alt="Thunder skill"/>
                        </div>                
                    </div>
                </div>
            </div>
            <div class="flex flex-col absolute md:w-[600px] sm:w-[600px] w-full py-4 sm:pl-8 sm:pr-4 z-10 bg-black bg-opacity-70 bottom-12 sm:right-10 px-[20px] gap-[10px] sm:text-2xl text-sm font-normal border border-button rounded-md">
                <p>Battle with any NFTs on Core chain</p>
                <p>Skill auto-generated based on your NFT traits</p>
                <p>Solo other, winner takes $CORE from loser</p>
                <button class="w-full pb-1 pt-2 sm:my-[15px] my-[10px] flex justify-center items-center font-semibold pt-[6px] bg-linearOrange2 hover:bg-linearOrange2Hover rounded-md sm:text-2xl" on:click={() =>goto('/game')}>
                    PLAY NOW
                </button>
                <div class="flex items-center gap-1 self-center text-base font-normal">
                    <span>
                        Built on Core chain
                    </span>
                    <img src="COREsm.png" alt="Core chain logo"/>
                </div>
            </div>
        </div>
        <!--Second page-->
        <div class="flex flex-col relative min-h-screen justify-center ">
            <div class="absolute inset-0 min-h-full overflow-hidden">
                <img loading="lazy" class="w-full min-h-full object-cover object-center" 
                     src="/landingPage/bgPage2.webp" 
                     alt="Core Magic Portal"/>
            </div>
            <div class="relative flex flex-wrap sm:flex-row flex-col justify-center items-center mx-auto md:gap-[50px] gap-[10px] gap-0 px-1 sm:text-normal text-sm">
                <!--Video goes here-->
                <div class="flex  md:w-[700px] w-full bg-black overflow-hidden rounded-md border border-button">
                    <video 
                        class="w-full h-full object-contain" 
                        loop 
                        muted 
                        playsinline
                        preload="metadata">
                        <source src="/landingPage/generateSkill.mp4" type="video/mp4">
                    </video>
                </div>
                <div class="flex flex-col md:gap-[40px] gap-[20px] mt-[30px] px-1">
                    <div class="flex flex-col gap-[6px]">
                        <span class="font-bold md:text-2xl sm:text-xl text-linearOrange2">
                            Automated and Unique Skills Generation for any NFT
                        </span>
                        <span class="sm:text-medium text-xs">
                            Your NFTs gain unique in-game skills automatically created from their trait names.
                        </span>
                    </div>
                    <div class="flex flex-col gap-[6px]">
                        <span class="font-bold md:text-2xl sm:text-xl  text-linearOrange2">
                            Compatible with any NFT
                        </span>
                        <span class="sm:text-medium text-xs">
                            Use any NFT you own to battle, no gaming-specific NFTs needed.
                        </span>
                    </div>
                </div>
            </div>
            
        </div>

        <!--Third page-->
        <div class="flex flex-col relative min-h-screen justify-center">
            <img loading="lazy" class="absolute sm:min-h-full h-full w-full  object-cover object-center" src="/landingPage/bgPage3.webp" alt="Core Arena background"/>
            <h1 class="self-center text-3xl font-bold text-button z-10 text-linearOrange2">
                GAME CONCEPT
            </h1>
            <div class="relative flex flex-wrap md:flex-row flex-col justify-center items-center mx-auto md:gap-[50px] gap-[10px] gap-0 px-1 sm:text-normal text-sm mt-[80px] mb-[60px]">
                <!--Video goes here-->
                <div class="flex  md:w-[700px] w-full bg-black overflow-hidden rounded-md border border-button">
                    <video 
                        class="w-full h-full object-contain" 
                        loop 
                        muted 
                        playsinline
                        preload="metadata">
                        <source src="/landingPage/battle.mp4" type="video/mp4">
                    </video>
                </div>
                <div class="flex flex-col md:gap-[40px] gap-[20px] xl:mt-[20px] sm:mt-[0px] mt-[20px] px-1">
                    {#each gameConcepts as gameConcept, index}
                        <div class="flex items-center gap-[6px] md:w-[500px] w-full bg-black bg-opacity-60 px-2 py-1 border border-button rounded-full">
                            <div class="text-2xl h-full pl-2 sm:pr-4 pr-2 font-bold">
                                {index + 1}
                            </div>
                            <span class="font-semibold sm:text-xl text-xs text-button">
                                {gameConcept.description}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
            
        </div>
        


        <!--Game criteria page-->
        <div class="flex flex-col relative min-h-screen justify-center sm:my-[20px]">
            <img loading="lazy" class="absolute min-h-full w-full  object-cover object-center" src="/landingPage/bgPage4.webp" alt="Core Arena background"/>
            <h1 class="self-center text-3xl font-bold text-linearOrange2 z-10">
                GAME CRITERIA
            </h1>
            <div class="flex w-full px-4 overflow-x-scroll custom-scrollbar z-10 mt-[60px]">
                <div class="flex mx-auto  md:gap-[40px] sm:gap-[30px] gap-[20px] pt-[40px] mt-[20px]">
                {#each gameCriterias as gameCriteria}
                    <div class="flex flex-col sm:min-w-[390px] sm:max-w-[390px] min-w-[330px] max-w-[330px] px-2 w-fit bg-black bg-opacity-80 border border-white rounded-md">
                        <div class="flex flex-col items-center justify-start h-[150px]  border-b">
                            <img class="h-[80px] rounded-full mt-[-40px]" 
                            src={gameCriteria.img} alt="Game Criteria icon"/>
                            <h1 class="text-linearOrange2 text-2xl font-semibold text-center mt-[20px] pb-[10px]">
                                {gameCriteria.title}
                            </h1>
                        </div>
                        <div class="flex justify-center px-[5px] py-2 sm:text-normal text-sm">
                            <p>
                                {@html gameCriteria.description}
                            </p>
                        </div>

                    </div>
                {/each}
                </div>
            </div>
            
        </div>
        <Footer/>
    </div>
</div>





