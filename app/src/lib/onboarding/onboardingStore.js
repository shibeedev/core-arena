import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { onboardingFlows } from './onboardingConfig.js';
import { onboardingEvents } from './onboardingEvents.js';

// Simple default state
const defaultState = {
   status: 'not-started',
   currentStepIndex: 0,
   currentFlow: null,
   userAddress: null
};

// Load saved state from localStorage (if exists)
const initialState = defaultState;

// Create the main store
export const onboardingStore = writable(initialState);


// Auto-save to localStorage whenever store changes
if (browser) {
   onboardingStore.subscribe(state => {
     if (state.userAddress) {
       const key = `coreArena_onboarding_${state.userAddress}`;
       localStorage.setItem(key, JSON.stringify(state));
     }
   });
}

export function setUserAddress(userAddress) {
   if (!browser || !userAddress) return;
   
   const key = `coreArena_onboarding_${userAddress}`;
   const savedState = localStorage.getItem(key);
   
   if (savedState) {
     // Load existing state for this user
     const userState = JSON.parse(savedState);
     onboardingStore.set({ ...userState, userAddress });
   } else {
     // First time for this user, reset to default
     onboardingStore.set({ ...defaultState, userAddress });
   }
}



// CHANGE 5: Update startOnboarding to ensure userAddress is set
export function startOnboarding(flowType) {
   onboardingStore.update(state => {
     if (state.status === 'active' && state.currentFlow === flowType) {
       return state;
     }
     return {
       ...state,
       status: 'active',
       currentFlow: flowType,
       currentStepIndex: 0
     };
   });
}

// Check user's onboarding status from localStorage
export function getUserOnboardingStatus(userAddress) {
   if (!browser || !userAddress) return null;
   
   try {
     const key = `coreArena_onboarding_${userAddress}`;
     const savedState = localStorage.getItem(key);
     
     if (!savedState) return null; // Not found
     
    const userState = JSON.parse(savedState);
     return userState.status || null;
     
   } catch (error) {
     console.error('Error reading onboarding status:', error);
     return 'error'; // Indicates corrupted data
   }
}

export function closeOnboarding(flowType) {
   onboardingStore.update(state => ({
     ...state,
     status: 'finished',
     currentStepIndex: 0,
     currentFlow: flowType
   }));
}



export function resetOnboarding(flowType) {
   onboardingStore.update(state => ({
     ...state,
     status: 'active',
     currentStepIndex: 0,
     currentFlow: flowType
   }));
}


export function nextStep() {
  onboardingStore.update(state => {
    const flow = onboardingFlows[state.currentFlow];
    const nextIndex = state.currentStepIndex + 1;
    const isComplete = nextIndex >= flow.length;
    console.log(state.status === 'active', "isActiveisActiveisActive")
    return {
      ...state,
      currentStepIndex: isComplete ? state.currentStepIndex : nextIndex,
      status: isComplete ? 'finished' : 'active'
    };
  });
}


export function skipOnboarding() {
  onboardingStore.update(state => ({
    ...state,
    status: 'finished'
  }));
}

// Get current step info
//onboardingStore = the main onboarding store
//onboardingEvents = the events tracking store
//$store = current value of onboardingStore
// $events = current value of onboardingEvents
export const currentStep = derived(
  [onboardingStore, onboardingEvents], 
  ([$store, $events]) => {
    if (!$store.currentFlow || $store.status !== 'active') return null;
    return onboardingFlows[$store.currentFlow]?.[$store.currentStepIndex] || null;
  }
);

// Get progress info
export const progress = derived(onboardingStore, $store => {
  if (!$store.currentFlow) return { current: 0, total: 0, percentage: 0 };
  
  const total = onboardingFlows[$store.currentFlow]?.length || 0;
  const current = $store.currentStepIndex + 1;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return { current, total, percentage };
});

