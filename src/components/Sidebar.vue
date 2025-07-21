<script setup>
import { ref } from 'vue';

defineProps({
  isMobileMenuOpen: Boolean,
});
const emit = defineEmits(['toggle-mobile-menu', 'toggle-font']);

const isSettingsSubMenuOpen = ref(false);

const menuItems = [
  { text: 'หน้าหลัก', name: 'Home', icon: 'home' },
  { text: '1. จัดการวัตถุดิบ', name: 'Ingredients', icon: 'cheese' },
  { text: '2. จัดการสูตรขนม', name: 'Recipes', icon: 'book' },
  { text: '3. คำนวณต้นทุน (Basic)', name: 'Calculator', icon: 'calculator' },
  {
    text: '4. คำนวณต้นทุน (Advance) (Coming Soon)',
    name: 'Calculator',
    icon: 'chart-line',
    disabled: true,
  },
  {
    text: 'ตั้งค่า',
    icon: 'cog',
    children: [
      { text: 'สำรอง/กู้คืนข้อมูล', name: 'SettingsData', icon: 'database' },
      { text: 'ทั่วไป', name: 'SettingsGeneral', icon: 'tools' },
    ],
  },
];

// const emit = defineEmits(['toggle-font']);
</script>

<template>
  <div
    v-if="isMobileMenuOpen"
    @click="$emit('toggle-mobile-menu')"
    class="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
  ></div>

  <aside
    :class="[
      'fixed left-0 top-0 z-50 h-full w-64 transform bg-[#1F2937] text-white shadow-lg transition-transform duration-300 ease-in-out',
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0', // ให้แสดงเสมอเมื่อเป็นจอคอม
    ]"
  >
    <div class="p-4 text-center">
      <router-link :to="{ name: 'Home' }" class="text-2xl font-bold text-white">
        ขออีกคำ
      </router-link>
    </div>

    <ul class="mt-8 flex flex-col space-y-2"></ul>

    <div class="mt-auto p-4 text-center"></div>
  </aside>
</template>
