<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
</script>

<template>
  <div class="relative">
    <button
      @click.stop="isOpen = !isOpen"
      class="rounded-full p-2 hover:bg-gray-200"
    >
      <font-awesome-icon icon="ellipsis-vertical" />
    </button>
    <div
      v-if="isOpen"
      class="absolute right-0 z-10 mt-2 w-40 rounded-md bg-white shadow-lg"
      @mouseleave="isOpen = false"
    >
      <slot></slot>
    </div>
  </div>
</template>
