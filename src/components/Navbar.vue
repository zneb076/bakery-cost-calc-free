<script setup>
import { ref } from 'vue';

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Add an 'icon' property for each menu item
const menuItems = [
  { text: 'หน้าหลัก', name: 'Home', icon: 'home' },
  { text: '1. จัดการวัตถุดิบ', name: 'Ingredients', icon: 'cheese' },
  { text: '2. จัดการสูตรขนม', name: 'Recipes', icon: 'book' },
  { text: '3. คำนวณต้นทุน', name: 'Calculator', icon: 'calculator' },
  { text: 'ตั้งค่า', name: 'Settings', icon: 'cog' },
];

const emit = defineEmits(['toggle-font']);
</script>

<template>
  <nav class="sticky top-0 z-40 bg-primary text-white shadow-md">
    <div class="container mx-auto flex h-16 items-center justify-between px-4">
      <router-link :to="{ name: 'Home' }" class="text-2xl font-bold">
        Bakery Cost Calc
      </router-link>

      <ul class="hidden items-center space-x-6 md:flex">
        <li v-for="item in menuItems" :key="item.text">
          <router-link
            :to="{ name: item.name }"
            class="flex items-center space-x-2 transition-colors hover:text-gray-200"
          >
            <font-awesome-icon :icon="item.icon" />
            <span>{{ item.text }}</span>
          </router-link>
        </li>
        <li>
          <button
            @click="$emit('toggle-font')"
            class="transition-colors hover:text-gray-200"
          >
            <font-awesome-icon icon="font" class="h-4 w-4" />
          </button>
        </li>
      </ul>

      <div class="flex items-center space-x-4 md:hidden">
        <button
          @click="$emit('toggle-font')"
          class="transition-colors hover:text-gray-200"
        >
          <font-awesome-icon icon="font" class="h-4 w-4" />
        </button>
        <button @click="toggleMenu">
          <font-awesome-icon icon="bars" class="h-6 w-6" />
        </button>
      </div>
    </div>
  </nav>

  <transition
    enter-active-class="transition-opacity ease-out duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMenuOpen"
      @click="toggleMenu"
      class="fixed inset-0 z-50 bg-black bg-opacity-50"
    ></div>
  </transition>

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
      class="fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-[#1F2937] text-white shadow-lg"
    >
      <div class="flex justify-end p-4">
        <button @click="toggleMenu">
          <font-awesome-icon icon="xmark" class="h-6 w-6" />
        </button>
      </div>
      <ul class="mt-8 flex flex-col space-y-2">
        <li v-for="item in menuItems" :key="item.text">
          <router-link
            :to="{ name: item.name }"
            @click="toggleMenu"
            class="flex w-full items-center space-x-4 px-8 py-3 text-lg transition-colors hover:bg-gray-700"
          >
            <font-awesome-icon :icon="item.icon" class="w-6" />
            <span>{{ item.text }}</span>
          </router-link>
        </li>
      </ul>
      <div class="mt-auto p-4 text-center">
        <img
          src="/my-logo.png"
          alt="Logo"
          class="mx-auto mb-2 h-16 w-16 opacity-95"
        />
        <p class="mb-5 text-sm text-gray-400">by ขออีกคำ - homemade bakery</p>
      </div>
    </div>
  </transition>
</template>
