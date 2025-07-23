import { ref } from 'vue';

const STORAGE_KEY = 'advance-welcome-dismissed';
const showWelcome = ref(false);

export function useAdvanceWelcome() {
  function checkToShowWelcome(forceShow = false) {
    const isDismissed = localStorage.getItem(STORAGE_KEY);

    if (forceShow && !isDismissed) {
      showWelcome.value = true;
      return;
    }

    // **FIX:** Moved this line inside the function
    const urlParams = new URLSearchParams(window.location.search);
    if (!isDismissed && urlParams.has('modeSwitched')) {
      showWelcome.value = true;
    }
  }

  function dismissWelcome(permanently) {
    if (permanently) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    showWelcome.value = false;
  }

  return {
    showWelcome,
    checkToShowWelcome,
    dismissWelcome,
  };
}
