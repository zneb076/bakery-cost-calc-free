<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  creatable: { type: Boolean, default: false },
  placeholder: { type: String, default: 'ค้นหาหรือเลือก' },
  showAllOnFocus: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'selection-made']);

const searchQuery = ref(props.modelValue || '');
const showOptions = ref(false);
const inputRef = ref(null);
const activeIndex = ref(-1);

// **ส่วนที่แก้ไข:** เพิ่ม watch เพื่อให้ state ภายในตรงกับภายนอกเสมอ
watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

const filteredOptions = computed(() => {
  activeIndex.value = -1;
  if (!searchQuery.value) {
    return props.showAllOnFocus ? props.options : [];
  }
  return props.options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function selectOption(option) {
  emit('update:modelValue', option);
  showOptions.value = false;
  emit('selection-made');
}

function handleInput(event) {
  emit('update:modelValue', event.target.value);
  showOptions.value = true;
}

function handleBlur() {
  setTimeout(() => {
    if (
      !props.creatable &&
      props.modelValue &&
      !props.options.includes(props.modelValue)
    ) {
      emit('update:modelValue', '');
    }
    showOptions.value = false;
  }, 200);
}

function handleKeydown(event) {
  const optionsLength = filteredOptions.value.length;
  switch (event.key) {
    case 'ArrowDown':
      if (!optionsLength) return;
      event.preventDefault();
      activeIndex.value = (activeIndex.value + 1) % optionsLength;
      break;
    case 'ArrowUp':
      if (!optionsLength) return;
      event.preventDefault();
      activeIndex.value =
        (activeIndex.value - 1 + optionsLength) % optionsLength;
      break;
    case 'Enter':
      event.preventDefault();
      if (activeIndex.value !== -1 && optionsLength > 0) {
        selectOption(filteredOptions.value[activeIndex.value]);
      } else {
        if (
          !props.creatable &&
          props.modelValue &&
          !props.options.includes(props.modelValue)
        ) {
          emit('update:modelValue', '');
        }
        showOptions.value = false;
        emit('selection-made');
      }
      break;
    case 'Escape':
      showOptions.value = false;
      break;
  }
}

function focus() {
  inputRef.value?.focus();
}
defineExpose({ focus });
</script>

<template>
  <div class="relative">
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      :placeholder="placeholder"
      @input="handleInput"
      @focus="showOptions = true"
      @blur="handleBlur"
      @keydown="handleKeydown"
      class="w-full rounded-md border border-gray-300 px-3 py-2"
    />
    <ul
      v-if="showOptions && filteredOptions.length > 0"
      class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg"
    >
      <li
        v-for="(option, index) in filteredOptions"
        :key="option"
        @mousedown.prevent="selectOption(option)"
        :class="[
          'cursor-pointer px-3 py-2',
          { 'bg-gray-100': index === activeIndex },
        ]"
      >
        {{ option }}
      </li>
    </ul>
  </div>
</template>
