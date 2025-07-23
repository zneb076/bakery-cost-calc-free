<script setup>
defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <label class="relative inline-flex cursor-pointer items-center">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="emit('update:modelValue', $event.target.checked)"
      class="peer sr-only"
    />
    <div
      class="peer h-6 w-11 rounded-full bg-gray-400 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-secondary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none rtl:peer-checked:after:-translate-x-full"
    ></div>
  </label>
</template>
