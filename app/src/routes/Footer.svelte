<script>

    import { goto } from '$app/navigation';
</script>

<div class="flex flex-col px-4">
    <div class="flex flex-col w-full items-center self-center gap-[4px] py-[20px] z-10">
        <div class="flex w-full justify-center text-center sm:text-2xl text-normal border-b py-1">
            JOIN OUR GAMING COMMUNITIES
        </div>
        <!--Social link-->
        <div class="flex py-1 gap-4">
            <button on:click={()=>{window.open("https://x.com/corearena_xyz", "_blank")}} class="flex shrink-self-hover">
                <img class="inline-block h-[24px]" src="/icons/twitterX.svg" alt="Twitter/X icon"/>
            </button>
                        <button on:click={()=>{window.open(`https://discord.gg/eNXuhN22JX`, "_blank")}} class="flex shrink-self-hover">
                <img class="inline-block h-[26px]" src="/icons/discord.png" alt="Twitter/X icon"/>
            </button>
        </div>
        <div class="flex pt-2">
            <button on:click={()=>{window.open("https://corearena.xyz/docs", "_blank")}} class="flex underline shrink-self-hover text-button hover:text-buttonHover text-sm">
                DOCUMENTATION
            </button>
        </div>
    </div>
    <div class="flex flex-wrap justify-between items-end text-white lg:gap-[30px] gap-[10px] pb-2 z-30 ">
        <div class="flex flex-col gap-[8px]">
            <!--Logo-->
            <button class="flex items-center gap-[5px]" on:click={() =>goto('/')}>
                <img class="h-10 inline-block" src="/logo.png" alt="Core Arena logo"/>
                <span class="text-xl font-semibold">
                    Core Arena
                </span>
            </button>
            <span class="text-sm">
                PvP game for any NFTs on Core
            </span>
        </div>  
    
        <div class="flex flex-col gap-[5px] justfity-start items-start">
            <span class=" ">
                Contact
            </span>
            <span class="text-sm"> contact@corearena.xyz</span>
        </div>
    
    </div>
    <div class="flex flex-wrap justify-center items-end text-lightGray ml-[32px] pb-2 z-30 ">
        <span class="text-xs text-center">&copy; 2025 corearena.xyz . All rights reserved.</span>
    </div>
    
</div>
