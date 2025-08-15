import { writable } from 'svelte/store';



//A reactive store containing an object
//Two Set collections that track unique items:
//clickedButtons: Stores unique button IDs that were clicked
//openedPopups: Stores unique popup IDs that were opened 
export const onboardingEvents = writable({
  clickedButtons: new Set(),
  openedPopups: new Set()
});


export function trackButtonClick(buttonId) {
  onboardingEvents.update(events => ({
    ...events,
    clickedButtons: new Set([...events.clickedButtons, buttonId])
  }));
}

export function trackPopupOpen(popupId) {
  onboardingEvents.update(events => ({
    ...events,
    openedPopups: new Set([...events.openedPopups, popupId])
  }));
}

export function resetEvents() {
  onboardingEvents.set({
    clickedButtons: new Set(),
    openedPopups: new Set()
  });
}