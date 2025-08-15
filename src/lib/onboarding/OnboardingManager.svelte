<script>
  import { onboardingStore, currentStep, progress, nextStep, skipOnboarding } from './onboardingStore.js';
  import { onboardingEvents } from './onboardingEvents.js';
  import { onMount, onDestroy } from 'svelte';
  import { driver } from 'driver.js';
  import { onboardingFlows } from '$lib/onboarding/onboardingConfig.js';
  
  export let gameState = {};
  export let allLoading = true;

  let driverInstance = null;
  let currentHighlightedElement = null;

  //UI for skip tutorial
  let showSkipConfirmation = false;



  // Initialize driver.js
  onMount(() => {
    driverInstance = driver({
      showProgress: false,
      showButtons: [],
      allowClose: false,
      disableActiveInteraction: false,
      popoverClass: 'hidden', // Hide driver's default popover since we use our own
    });
  });

  onDestroy(() => {
    if (driverInstance) {
      driverInstance.destroy();
    }
  });

// Remove setTimeout, add proper initialization guards
$: if ($currentStep && 
        gameState.navigation && // ✅ Ensure navigation is initialized
        !allLoading && // ✅ Ensure components are loaded
        $currentStep.completeWhen(gameState, $onboardingEvents)) {
  
  /*console.log('✅ Step completing:', $currentStep.title, 'navigation:', gameState.navigation);*/
  nextStep(); // ✅ Direct call, no setTimeout
}

  // Calculate if current step should be visible
  $: shouldShowStep = $currentStep && $currentStep.showWhen(gameState, $onboardingEvents);

  //  If step exists but shouldn't be shown, skip to next step
  /*  $: if ($currentStep && !shouldShowStep) {
      setTimeout(() => nextStep(), 500);
    }*/

  //  autoNextTimeout
  let autoNextTimeout = null;

  // Clear existing timeout, set new one if needed
  $: {
    if (autoNextTimeout) {
      clearTimeout(autoNextTimeout);
      autoNextTimeout = null;
    }
    
    if ($currentStep?.autoNextStep && $currentStep?.timeOutNextStep && shouldShowStep) {
      autoNextTimeout = setTimeout(() => nextStep(), $currentStep.timeOutNextStep);
    }
  }

  // Clean up on destroy
  onDestroy(() => {
    if (driverInstance) {
      driverInstance.destroy();
    }
    if (autoNextTimeout) {
      clearTimeout(autoNextTimeout);
    }
  });

// Handle element highlighting with driver.js
// Handle element highlighting with driver.js
$: if ($currentStep?.targetElement && $currentStep.targetElement !== "all" && driverInstance && shouldShowStep) {
    const element = document.querySelector(`[data-onboard="${$currentStep.targetElement}"]`);
    if (element && element !== currentHighlightedElement) {
      // Clean up previous highlight
      if (currentHighlightedElement) {
        driverInstance.destroy();
        driverInstance = driver({
          showProgress: false,
          showButtons: [],
          allowClose: false,
          disableActiveInteraction: false,
          popoverClass: 'hidden',
        });
      }
      
      // Highlight new element
      driverInstance.highlight({
        element: element,
        padding: 4,
      });
      
      currentHighlightedElement = element;
    }
  } else if ((!$currentStep?.targetElement || $currentStep?.targetElement === "all") && currentHighlightedElement && shouldShowStep) {
    // Clean up when no target element or when targetElement is "all"
    if (driverInstance) {
      driverInstance.destroy();
      driverInstance = driver({
        showProgress: false,
        showButtons: [],
        allowClose: false,
        disableActiveInteraction: false,
        popoverClass: 'hidden',
      });
    }
    currentHighlightedElement = null;
  }

// Calculate tooltip position
$: tooltipPosition = $currentStep?.toolkitPos ? 
  { x: $currentStep.toolkitPos[0], y: $currentStep.toolkitPos[1] } :
  currentHighlightedElement ? (() => {
    const rect = currentHighlightedElement.getBoundingClientRect();
    const vw = window.innerWidth / 100;
    return { 
      x: (rect.left + rect.width / 2) / vw, 
      y: (rect.bottom + 1) / vw 
    };
  })() : { x: 5, y: 10 };


  $: {
  const store = $onboardingStore;
  /*
  console.log('Manual check:');
  console.log('store.currentFlow:', store.currentFlow);
  console.log('store.currentStepIndex:', store.currentStepIndex);
  console.log('onboardingFlows:', onboardingFlows);
  console.log('onboardingFlows[store.currentFlow]:', onboardingFlows[store.currentFlow]);*/
  
  if (onboardingFlows[store.currentFlow]) {
    const step = onboardingFlows[store.currentFlow][store.currentStepIndex];
    /*console.log('Manual step lookup:', step);
    console.log('Manual step title:', step?.title);*/
  }
}
</script>

{#if $onboardingStore.status === 'active' && $currentStep && shouldShowStep && !allLoading}
    <!-- Manual overlay when targetElement is "all" -->
  {#if $currentStep.targetElement === "all"}
    <div class="fixed inset-0 bg-black bg-opacity-50" style="z-index: 10000;"></div>
  {/if}

 <button 
   style="z-index: 99998; pointer-events: auto;" 
   class="fixed right-[14vw] bottom-[4vw] py-[0.4vw] px-[0.8vw] text-white font-semibold hover:text-button underline rounded text-[0.9vw] bg-black bg-opacity-60 hover:bg-opacity-80 border border-gray-600 shadow-lg" 
   on:click={()=>{showSkipConfirmation = true;}}
 >
   Skip Tutorial
 </button>
  {#if $currentStep.isShowToolTip}
    <div 
      class="fixed bg-arenaDark border-2 border-button rounded-lg p-[1vw] max-w-[20vw] shadow-xl"
      style="left: {tooltipPosition.x}vw; top: {tooltipPosition.y}vw; z-index: 10001;"
    >
        <!--
        <div class="flex justify-between items-center mb-[0.5vw] text-[0.8vw] text-arenaLight">
          <span>Step {$progress.current} of {$progress.total}</span>
          <span>{$progress.percentage}%</span>
        </div>
        -->
        <h3 class="text-[1.2vw] font-bold text-white mb-[0.5vw]">{$currentStep.title}</h3>
        <p class="text-[0.9vw] text-arenaLight mb-[1vw]">{$currentStep.description}</p>
        
        <div class="flex gap-[0.5vw]">
          {#if $currentStep.manualNext && !$currentStep.completeWhen(gameState, $onboardingEvents)}
            <button class="px-[1vw] py-[0.3vw] bg-button hover:bg-buttonHover rounded text-[0.8vw]" on:click={nextStep}>Next</button>
          {/if}
        </div>
    </div>
  {/if}
{/if}

<!-- Skip Tutorial Confirmation Dialog -->
{#if showSkipConfirmation && $onboardingStore.status === 'active' && $currentStep && shouldShowStep && !allLoading}
   <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" style="z-index: 99000; pointer-events: auto;">
    <div class="bg-arenaDark border-2 border-button rounded-lg p-[2vw] max-w-[25vw] shadow-xl">
      <h3 class="text-[1.4vw] font-bold text-white mb-[1vw]">Skip Tutorial?</h3>
      <p class="text-[1vw] text-arenaLight mb-[1.5vw]">
        Are you sure you want to skip the tutorial? You can always restart it later.
      </p>
      
      <div class="flex gap-[1vw] justify-end">
        <button style="z-index: 99999; pointer-events: auto;"
          class="px-[1.2vw] py-[0.4vw] bg-gray-600 hover:bg-gray-700 rounded text-[0.9vw] text-white"
          on:click={()=>{showSkipConfirmation = false;}}
        >
          Cancel
        </button>
        <button style="z-index: 99999; pointer-events: auto;"
          class="px-[1.2vw] py-[0.4vw] bg-red-600 hover:bg-red-700 rounded text-[0.9vw] text-white"
          on:click={()=>{skipOnboarding(); location.reload()}}
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  </div>
{/if}