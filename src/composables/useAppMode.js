import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdvanceWelcome } from './useAdvanceWelcome.js';

const MODE_STORAGE_KEY = 'user-app-mode';
const currentMode = ref(localStorage.getItem(MODE_STORAGE_KEY) || 'basic');

export function useAppMode() {
  const router = useRouter();
  const { checkToShowWelcome } = useAdvanceWelcome();

  const setMode = (mode, callback) => {
    const oldMode = currentMode.value;
    if (mode === oldMode) return;

    if (mode !== 'basic' && mode !== 'advance') {
      mode = 'basic';
    }

    currentMode.value = mode;
    localStorage.setItem(MODE_STORAGE_KEY, mode);

    if (mode === 'advance' && oldMode === 'basic') {
      if (callback) callback(); // เรียก callback (ปิดเมนู)
      checkToShowWelcome(true);
    } else {
      // For simplicity and to ensure all states reset, reload is a safe option.
      if (mode === 'basic') {
        router.push({ name: 'Home' }).then(() => window.location.reload());
      } else {
        window.location.reload();
      }
    }
  };

  const toggleMode = (callback) => {
    const nextMode = currentMode.value === 'basic' ? 'advance' : 'basic';
    setMode(nextMode, callback);
  };

  return {
    currentMode,
    toggleMode,
  };
}
