<script>
    import { goto } from '$app/navigation';
    import {fade, slide} from 'svelte/transition';
    let navMenu = false;
    let isToggle = false;

    let navItems = [
        {
            name:"How to play",
            method:"windowOpen",
            target:"/docs/quick-start",
        },
        {
            name:"Docs",
            method:"windowOpen",
            target:"/docs"
        },

    ]

    let buttonHandlers = {
        windowOpen: (target) => {
            window.open(target);
        },
        goto: (target) => {
            goto(target);
        },
        toggleNav: () => {
            navMenu = !navMenu;
        },
    };
</script>
<!--Nav bar-->
<div class="flex flex-col pt-1">
    <div class="flex text-white justify-between items-center z-30 text-sm ">
        <!--Logo-->
        <button class="flex sm:flex-row flex-col items-center gap-[10px]" on:click={() =>goto('/')}>
            <img class="sm:h-[80px] h-[40px] inline-block" src="/corearena-textLogo.svg"  alt="Core Arena Logo"/>
            <div class="sm:flex hidden text-sm">
                ver 1.26
            </div>
        </button>
        <div class="flex items-center md:gap-[60px] sm:gap-[30px] gap-[20px] sm:text-lg  text-sm">
            <!--Big screen items-->
            {#each navItems as navItem}
                <button class="sm:flex hidden items-center hover:text-buttonHover" on:click={() =>buttonHandlers[navItem.method](navItem.target)}>
                    {navItem.name}
                </button>
            {/each}
            <button class="flex bg-linearOrange2 hover:bg-linearOrange2Hover items-center px-2 pb-1 pt-[10px] rounded-md" on:click={() =>buttonHandlers["goto"]("/game")}>
                PLAY GAME
            </button>
            <!--SM screen Toggle-->
            <button class="sm:hidden flex items-center " on:click={() =>buttonHandlers["toggleNav"]()}>
                {#if navMenu}
                    <div class="h-[26px] w-[26px] inline-block" >
                    </div>
                {:else}
                    <img class="h-[26px] inline-block " src="/landingPage/toggle.svg" alt="close"  in:fade={{ duration: 200 }} />
                {/if}
            </button>

        </div>
    </div>
</div>
<!--Nav Menu-->
{#if navMenu}
    <div class="absolute fixed font-semibold flex flex-col inset-0 bg-black bg-opacity-80 z-30 min-h-screen " in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
        <div class="flex flex-col w-full" in:slide={{ duration: 300, y: 300 }} out:slide={{ duration: 300, y: 300 }}>
            <button class="p-4 self-end" on:click={()=>{navMenu = false}}>
                <img class="h-[26px] inline-block" src="/icons/xSM.svg" alt="close"/>
            </button>
            <div class="flex flex-col mt-[30px] gap-[30px] text-xl">
                {#each navItems as navItem}
                    <button class="" on:click={() =>buttonHandlers[navItem.method](navItem.target)}>
                        {navItem.name}
                    </button>
                {/each}
            </div>
        </div>
    </div>
{/if}

