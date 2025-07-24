<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'default', // default, large
  },
});
const emit = defineEmits(['close']);
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
  >
    <div
      class="w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-2xl dark:bg-gray-700"
      :class="{
        'max-h-[90vh]': size === 'default',
        'h-[90vh]': size === 'large',
      }"
    >
      <slot></slot>
    </div>
  </div>
</template>
