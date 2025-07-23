<script setup>
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import ScrollToTopButton from './components/ScrollToTopButton.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';
import { useFontSwitcher } from './composables/useFontSwitcher.js';

const { loadInitialFont, toggleFont } = useFontSwitcher();

onMounted(async () => {
  loadInitialFont();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-gray-800">
    <Navbar @toggle-font="toggleFont" />

    <main class="lg:ml-[310px]">
      <div class="container mx-auto p-2 pb-12 md:p-6">
        <router-view />
      </div>
    </main>

    <ScrollToTopButton />
    <ReloadPrompt />
  </div>
</template>
