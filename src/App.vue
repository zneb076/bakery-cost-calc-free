<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';
import ScrollToTopButton from './components/ScrollToTopButton.vue';
import ReloadPrompt from './components/ReloadPrompt.vue';
import { useFontSwitcher } from './composables/useFontSwitcher.js';
import { useAppMode } from './composables/useAppMode.js';
import { useAdvanceWelcome } from './composables/useAdvanceWelcome.js';
import WelcomeAdvanceModal from './components/WelcomeAdvanceModal.vue';
import { useThemeSwitcher } from './composables/useThemeSwitcher.js';
import VideoModal from './components/VideoModal.vue';

useThemeSwitcher();

const { loadInitialFont, toggleFont } = useFontSwitcher();
const { currentMode } = useAppMode();
const { showWelcome, checkToShowWelcome, dismissWelcome } = useAdvanceWelcome();
const showVideoModal = ref(false);
const route = useRoute();

const currentVideoUrl = computed(() => route.meta.videoUrl);

onMounted(async () => {
  loadInitialFont();
  if (currentMode.value === 'advance') {
    checkToShowWelcome();
  }
});
</script>

<template>
  <div
    class="min-h-screen bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  >
    <Navbar @toggle-font="toggleFont" />

    <main class="lg:ml-[310px]">
      <div class="container mx-auto p-2 pb-12 md:p-6">
        <div v-if="currentVideoUrl" class="mb-4 text-right">
          <button
            @click="showVideoModal = true"
            class="text-secondary hover:text-primary"
          >
            <font-awesome-icon icon="play-circle" />
            <span class="ml-2 text-sm font-semibold">ดูวิดีโอสอนใช้งาน</span>
          </button>
        </div>
        <router-view />
      </div>
    </main>

    <ScrollToTopButton />
    <ReloadPrompt />
  </div>
  <div>
    <WelcomeAdvanceModal v-if="showWelcome" @close="dismissWelcome" />
    <VideoModal
      v-if="showVideoModal && currentVideoUrl"
      :video-url="currentVideoUrl"
      @close="showVideoModal = false"
    />
  </div>
</template>
