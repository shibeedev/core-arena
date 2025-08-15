// $lib/notificationStore.js
import { writable } from 'svelte/store';

const createNotificationStore = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // Initial state - all notifications visible
  const initialState = {
    quest: true,
    rewards: true,
    tutorial: true
  };
  
  // Try to load from localStorage if available
  let storedState = initialState;
  if (isBrowser) {
    try {
      // Check for session identifier to know if browser was restarted
      const currentSessionId = Date.now().toString();
      const storedSessionId = localStorage.getItem('notification_session_id');
      
      // If session ID doesn't exist or is different, this is a new session
      if (!storedSessionId) {
        localStorage.setItem('notification_session_id', currentSessionId);
      } else if (storedSessionId !== currentSessionId) {
        localStorage.setItem('notification_session_id', currentSessionId);
        localStorage.removeItem('notification_state');
      } else {
        // Same session - try to get stored notification state
        const stored = localStorage.getItem('notification_state');
        if (stored) {
          storedState = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }
  
  const { subscribe, set, update } = writable(storedState);
  
  return {
    subscribe,
    dismiss: (key) => {
      update(state => {
        const newState = { ...state, [key]: false };
        if (isBrowser) {
          try {
            localStorage.setItem('notification_state', JSON.stringify(newState));
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        }
        return newState;
      });
    },
    reset: () => {
      set(initialState);
      if (isBrowser) {
        try {
          localStorage.setItem('notification_state', JSON.stringify(initialState));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    }
  };
};

export const notifications = createNotificationStore();