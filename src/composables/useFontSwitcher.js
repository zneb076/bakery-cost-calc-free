import { ref, computed } from 'vue';

const FONT_STORAGE_KEY = 'user-selected-font';
const DEFAULT_FONT = 'sarabun';

const activeFontName = ref(DEFAULT_FONT);

export function useFontSwitcher() {
  const setFont = (fontName) => {
    if (fontName !== 'mali' && fontName !== 'sarabun') {
      fontName = DEFAULT_FONT;
    }

    activeFontName.value = fontName;
    localStorage.setItem(FONT_STORAGE_KEY, fontName);

    // ควบคุมคลาสบน <body> โดยตรง
    document.body.classList.remove('font-mali', 'font-sarabun');
    document.body.classList.add(`font-${fontName}`);
  };

  const toggleFont = () => {
    const nextFont = activeFontName.value === 'sarabun' ? 'mali' : 'sarabun';
    setFont(nextFont);
  };

  const loadInitialFont = () => {
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
    setFont(savedFont);
  };

  const nextFontName = computed(() => {
    return activeFontName.value === 'sarabun' ? 'มาลิ' : 'สารบรรณ';
  });

  return {
    activeFontName,
    nextFontName,
    toggleFont,
    loadInitialFont,
  };
}
