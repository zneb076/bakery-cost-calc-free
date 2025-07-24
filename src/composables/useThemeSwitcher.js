import { ref, onMounted } from 'vue';

const THEME_KEY = 'user-selected-theme';
const theme = ref(localStorage.getItem(THEME_KEY) || 'light');

export function useThemeSwitcher() {
  const setTheme = (newTheme) => {
    theme.value = newTheme;
    localStorage.setItem(THEME_KEY, newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  };

  const loadInitialTheme = () => {
    setTheme(theme.value);
  };

  onMounted(loadInitialTheme);

  return {
    theme,
    toggleTheme,
  };
}
