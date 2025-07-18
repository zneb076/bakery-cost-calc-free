import { ref, onMounted, computed } from 'vue';

const FONT_STORAGE_KEY = 'user-selected-font';
const DEFAULT_FONT = 'mali';
const fonts = ['mali', 'sarabun'];

// สร้าง state นอกฟังก์ชัน setup เพื่อให้เป็น Singleton (ใช้ร่วมกันทั้งแอป)
const currentFont = ref(DEFAULT_FONT);

export function useFontSwitcher() {
  // ฟังก์ชันสำหรับเปลี่ยนฟอนต์
  const setFont = (fontName) => {
    if (!fonts.includes(fontName)) {
      fontName = DEFAULT_FONT;
    }

    // อัปเดต state
    currentFont.value = fontName;

    // บันทึกลง localStorage
    localStorage.setItem(FONT_STORAGE_KEY, fontName);

    // เปลี่ยนคลาสที่ tag <html>
    const htmlEl = document.documentElement;
    htmlEl.classList.remove(...fonts.map((f) => `font-${f}`));
    htmlEl.classList.add(`font-${fontName}`);
  };

  // ฟังก์ชันสำหรับสลับฟอนต์
  const toggleFont = () => {
    const nextFont = currentFont.value === 'mali' ? 'sarabun' : 'mali';
    setFont(nextFont);
  };

  // ฟังก์ชันสำหรับโหลดฟอนต์เมื่อแอปเริ่มทำงาน
  const loadInitialFont = () => {
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
    setFont(savedFont || DEFAULT_FONT);
  };

  // computed property สำหรับแสดงฟอนต์ที่จะเปลี่ยนไป
  const nextFontName = computed(() => {
    return currentFont.value === 'mali' ? 'สารบรรณ' : 'มาลิ';
  });

  return {
    currentFont,
    nextFontName,
    toggleFont,
    loadInitialFont,
  };
}
