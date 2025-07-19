<script setup>
const emit = defineEmits(['close']);
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <div
      class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-2xl"
    >
      <slot></slot>
    </div>
  </div>
</template>
