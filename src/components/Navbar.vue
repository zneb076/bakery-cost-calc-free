<script setup>
import { ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
// 1. เพิ่มไอคอนสำหรับสลับฟอนต์
import { faBars, faXmark, faLanguage } from '@fortawesome/free-solid-svg-icons';

// State สำหรับเปิด/ปิดเมนูบนมือถือ
const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// รายการเมนู (เพื่อให้จัดการง่าย)
const menuItems = [
  { text: 'หน้าหลัก', name: 'Home' },
  { text: 'คำนวณต้นทุน', name: 'Calculator' },
  { text: 'จัดการสูตร', name: 'Recipes' },
  { text: 'จัดการวัตถุดิบ', name: 'Ingredients' },
  { text: 'ตั้งค่า', name: 'Settings' },
];

// ทำให้ Component สามารถส่ง event ออกไปได้
const emit = defineEmits(['toggle-font']);
</script>

<template>
  <nav class="sticky top-0 z-50 bg-primary text-white shadow-md">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <router-link :to="{ name: 'Home' }" class="text-lg font-bold">
        ขออีกคำ
      </router-link>

      <ul class="hidden items-center space-x-6 md:flex">
        <li v-for="item in menuItems" :key="item.text">
          <router-link
            :to="{ name: item.name }"
            class="transition-colors hover:text-gray-200"
          >
            {{ item.text }}
          </router-link>
        </li>
        <li>
          <button
            @click="$emit('toggle-font')"
            class="transition-colors hover:text-gray-200"
          >
            <font-awesome-icon :icon="faLanguage" class="h-6 w-6" />
          </button>
        </li>
      </ul>

      <div class="flex items-center space-x-4 md:hidden">
        <button
          @click="$emit('toggle-font')"
          class="transition-colors hover:text-gray-200"
        >
          <font-awesome-icon :icon="faLanguage" class="h-6 w-6" />
        </button>
        <button @click="toggleMenu">
          <font-awesome-icon :icon="faBars" class="h-6 w-6" />
        </button>
      </div>
    </div>

    <transition
      enter-active-class="transition ease-in-out duration-300 transform"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition ease-in-out duration-300 transform"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isMenuOpen"
        class="fixed right-0 top-0 z-50 h-full w-64 bg-[#1F2937] text-white shadow-lg"
      >
        <div class="flex justify-end p-4">
          <button @click="toggleMenu">
            <font-awesome-icon :icon="faXmark" class="h-6 w-6" />
          </button>
        </div>
        <ul class="mt-8 flex flex-col items-center space-y-6">
          <li v-for="item in menuItems" :key="item.text">
            <router-link
              :to="{ name: item.name }"
              @click="toggleMenu"
              class="w-full rounded-md p-2 text-center text-xl transition-colors hover:bg-gray-700"
            >
              {{ item.text }}
            </router-link>
          </li>
        </ul>
      </div>
    </transition>
  </nav>
</template>
