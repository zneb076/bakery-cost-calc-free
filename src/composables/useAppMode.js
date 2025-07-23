import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdvanceWelcome } from './useAdvanceWelcome.js';

const MODE_STORAGE_KEY = 'user-app-mode';
const currentMode = ref(localStorage.getItem(MODE_STORAGE_KEY) || 'basic');

export function useAppMode() {
  const router = useRouter();
  const { checkToShowWelcome } = useAdvanceWelcome();

  const setMode = (mode) => {
    if (mode !== 'basic' && mode !== 'advance') {
      mode = 'basic';
    }
    const oldMode = currentMode.value; // **FIX:** Moved declaration here
    currentMode.value = mode;
    localStorage.setItem(MODE_STORAGE_KEY, mode);

    if (mode === 'advance' && oldMode === 'basic') {
      checkToShowWelcome(true);
    }

    if (mode === 'basic' && oldMode === 'advance') {
      router.push({ name: 'Home' });
    }
  };

  const toggleMode = () => {
    const nextMode = currentMode.value === 'basic' ? 'advance' : 'basic';
    setMode(nextMode);
  };

  return {
    currentMode,
    toggleMode,
  };
}
