<script setup>
import { ref, computed } from 'vue';
import { useAppMode } from '../composables/useAppMode.js';
import ToggleSwitch from './ToggleSwitch.vue';

const { currentMode, toggleMode } = useAppMode();

const isMobileMenuOpen = ref(false);
const isSettingsSubMenuOpen = ref(false);

const isAdvanceMode = computed({
  get: () => currentMode.value === 'advance',
  set: () =>
    toggleMode(() => {
      isMobileMenuOpen.value = false;
    }),
});

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const menuItems = [
  { text: 'หน้าหลัก', name: 'Home', icon: 'home' },
  { text: 'จัดการวัตถุดิบ', name: 'Ingredients', icon: 'cheese' },
  { text: 'จัดการสูตรขนม', name: 'Recipes', icon: 'book' },
  {
    text: 'จัดการสินค้า (ขนม)',
    name: 'Products',
    icon: 'box-open',
    advance: true,
  },
  { text: 'คำนวณต้นทุน (Basic)', name: 'Calculator', icon: 'calculator' },
  {
    text: 'คำนวณต้นทุน (Advance)',
    name: 'CalculatorAdvance',
    icon: 'chart-line',
    advance: true,
  },
  {
    text: 'ตั้งค่า',
    icon: 'cog',
    children: [
      { text: 'ตั้งค่าทั่วไป', name: 'SettingsGeneral', icon: 'tools' },
      { text: 'จัดการฐานข้อมูล', name: 'SettingsData', icon: 'database' },
    ],
  },
];

const visibleMenuItems = computed(() => {
  if (isAdvanceMode.value) {
    return menuItems;
  }
  return menuItems.filter((item) => !item.advance);
});

const emit = defineEmits(['toggle-font']);
</script>

<template>
  <div>
    <nav
      class="sticky top-0 z-40 bg-primary text-white shadow-md lg:ml-[310px]"
    >
      <div
        class="container mx-auto flex h-16 items-center justify-between px-3"
      >
        <router-link :to="{ name: 'Home' }" class="text-2xl font-semibold">
          Bakery Cost Calc
        </router-link>

        <div class="flex items-center space-x-4">
          <button
            @click="$emit('toggle-font')"
            class="transition-colors hover:text-gray-200"
          >
            <font-awesome-icon icon="font" class="h-5 w-5" />
          </button>
          <button @click="toggleMobileMenu" class="lg:hidden">
            <font-awesome-icon icon="bars" class="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>

    <div
      v-if="isMobileMenuOpen"
      @click="toggleMobileMenu"
      class="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
    ></div>

    <aside
      :class="[
        'fixed top-0 z-50 flex h-full w-[310px] flex-col bg-[#1F2937] text-white shadow-lg',
        'transform transition-transform duration-300 ease-in-out',
        'lg:left-0 lg:translate-x-0',
        isMobileMenuOpen ? 'right-0 translate-x-0' : 'right-0 translate-x-full',
      ]"
    >
      <div class="flex items-center justify-between p-4 lg:hidden">
        <div class="flex items-center space-x-2 pl-4 pt-2 font-semibold">
          <span>Basic</span>
          <ToggleSwitch v-model="isAdvanceMode" />
          <span>Advance</span>
        </div>
        <button @click="toggleMobileMenu" class="lg:hidden">
          <font-awesome-icon icon="xmark" class="h-6 w-6" />
        </button>
      </div>

      <div class="hidden p-4 text-center lg:block">
        <router-link
          :to="{ name: 'Home' }"
          class="text-2xl font-bold text-white"
        >
        </router-link>
      </div>

      <ul class="mt-4 flex flex-col">
        <div class="hidden items-center space-x-2 p-6 font-semibold lg:flex">
          <span>Basic</span>
          <ToggleSwitch v-model="isAdvanceMode" />
          <span>Advance</span>
        </div>
        <li v-for="item in visibleMenuItems" :key="item.text">
          <component
            :is="
              item.disabled ? 'span' : item.children ? 'button' : 'router-link'
            "
            :to="item.children ? null : { name: item.name }"
            @click="
              item.children
                ? (isSettingsSubMenuOpen = !isSettingsSubMenuOpen)
                : (isMobileMenuOpen = false)
            "
            :class="[
              'flex w-full items-center space-x-4 px-8 py-3 text-lg',
              'lg:px-6 lg:text-base',
              item.disabled
                ? 'cursor-not-allowed text-gray-500'
                : 'hover:bg-gray-700',
            ]"
            :title="item.disabled ? 'Coming Soon' : ''"
          >
            <font-awesome-icon :icon="item.icon" class="w-6" />
            <span>{{ item.text }}</span>
            <span
              v-if="item.children"
              :class="{ 'rotate-180': isSettingsSubMenuOpen }"
              class="ml-auto transition-transform"
            >
              <font-awesome-icon icon="chevron-down" />
            </span>
          </component>
          <ul v-if="item.children && isSettingsSubMenuOpen" class="bg-gray-800">
            <li v-for="child in item.children" :key="child.text">
              <router-link
                :to="{ name: child.name }"
                @click="isMobileMenuOpen = false"
                class="my-2 flex w-full items-center py-2 pl-16 pr-8 text-base hover:bg-gray-700"
              >
                {{ child.text }}
              </router-link>
            </li>
          </ul>
        </li>
      </ul>
      <div class="mt-4 px-6">
        <router-link
          :to="{ name: 'UserGuide' }"
          @click="isMobileMenuOpen = false"
          class="block w-full rounded-lg bg-gray-700 p-3 text-left transition-colors hover:bg-gray-600"
        >
          <div class="flex items-center space-x-3">
            <font-awesome-icon icon="question-circle" class="w-6" />
            <div>
              <p class="">คู่มือการใช้งาน</p>
              <p class="text-xs text-gray-300">เริ่มต้นใช้งานแอป</p>
            </div>
          </div>
        </router-link>
      </div>
      <div class="mt-auto p-4 text-center">
        <a
          href="https://www.facebook.com/profile.php?id=61556714365876"
          target="_blank"
          ><img
            src="/my-logo.png"
            alt="Logo"
            class="mx-auto mb-2 h-16 w-16 opacity-95"
          />
          <div class="text-sm text-gray-400">
            by ขออีกคำ - homemade bakery
          </div></a
        >
        <div class="text-xs text-gray-500">App v.1.0</div>
      </div>
    </aside>
  </div>
</template>
