<script setup>
import { useThemeSwitcher } from '../composables/useThemeSwitcher.js';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const { theme, toggleTheme } = useThemeSwitcher();
</script>

<template>
  <button @click="toggleTheme" class="transition-colors hover:text-gray-200">
    <font-awesome-icon v-if="theme === 'light'" icon="moon" class="h-5 w-5" />
    <font-awesome-icon v-else icon="sun" class="h-5 w-5" />
  </button>
</template>
