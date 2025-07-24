<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: String,
  options: { type: Array, default: () => [] }, // Expects grouped options
});
const emit = defineEmits(['update:modelValue', 'selection']);

const searchQuery = ref(props.modelValue || '');
const showOptions = ref(false);
const inputRef = ref(null);

watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return props.options; // Show all groups and options
  }
  const lowerQuery = searchQuery.value.toLowerCase();
  const filteredGroups = [];
  props.options.forEach((group) => {
    const matchingOptions = group.options.filter((opt) =>
      opt.label.toLowerCase().includes(lowerQuery)
    );
    if (matchingOptions.length > 0) {
      filteredGroups.push({ ...group, options: matchingOptions });
    }
  });
  return filteredGroups;
});

function selectOption(option) {
  emit('update:modelValue', option.label);
  emit('selection', option.value); // Emit the 'value' (e.g., 'product-1')
  showOptions.value = false;
}

function handleInput(event) {
  emit('update:modelValue', event.target.value);
  showOptions.value = true;
}

function handleBlur() {
  setTimeout(() => {
    showOptions.value = false;
  }, 200);
}
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      placeholder="-- พิมพ์เพื่อค้นหา --"
      @input="handleInput"
      @focus="showOptions = true"
      @blur="handleBlur"
      @keydown="handleKeydown"
      class="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 dark:text-gray-600"
    />
    <button
      v-if="modelValue"
      @click="selectOption('')"
      type="button"
      class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
    >
      &times;
    </button>
    <ul
      v-if="showOptions && filteredOptions.length > 0"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
    >
      <template v-for="group in filteredOptions" :key="group.label">
        <li class="bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-500">
          {{ group.label }}
        </li>
        <li
          v-for="option in group.options"
          :key="option.value"
          @mousedown.prevent="selectOption(option)"
          class="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:text-gray-500 hover:dark:bg-slate-200"
        >
          {{ option.label }}
        </li>
      </template>
    </ul>
  </div>
</template>
