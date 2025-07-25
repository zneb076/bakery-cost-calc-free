<script setup>
import { ref, watch, computed } from 'vue';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({ name: '', recipeId: null, weight: null, price: null }),
  },
  availableRecipes: { type: Array, required: true },
});
const emit = defineEmits(['save', 'cancel']);

const product = ref({});
const recipeOptions = computed(() => {
  return props.availableRecipes.map((r) => ({
    value: r.id,
    label: r.name,
    isSubRecipe: r.isSubRecipe,
  }));
});

watch(
  () => props.initialData,
  (newData) => {
    product.value = JSON.parse(JSON.stringify(newData));
  },
  { immediate: true, deep: true }
);

function handleSubmit() {
  if (
    !product.value.name ||
    !product.value.recipeId ||
    !product.value.weight ||
    !product.value.price
  ) {
    Swal.fire(
      'ข้อมูลไม่ครบถ้วน',
      'กรุณากรอกข้อมูลสินค้าให้ครบทุกช่อง',
      'error'
    );
    return;
  }
  emit('save', product.value);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-6 dark:bg-gray-600">
      <h3 class="mb-4 text-xl font-semibold">
        {{ product.id ? 'แก้ไขรายการขนม' : 'เพิ่มรายการขนมใหม่จากสูตรนี้' }}
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium">ชื่อขนม</label>
          <input
            v-model="product.name"
            type="text"
            class="mt-1 w-full rounded-md border p-2 dark:text-gray-600"
          />
        </div>
        <div>
          <label class="block text-sm font-medium">มาจากสูตร</label>
          <Multiselect
            v-model="product.recipeId"
            :options="recipeOptions"
            placeholder="เลือกสูตรตั้งต้น"
            class="mt-1 dark:text-gray-600"
          >
            <template #option="{ option }">
              <div class="flex items-center justify-between">
                <span>{{ option.label }}</span>
                <span
                  v-if="option.isSubRecipe"
                  class="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-white"
                >
                  สูตรย่อย
                </span>
              </div>
            </template>
          </Multiselect>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium"
              >น้ำหนักต่อชิ้น (กรัม)</label
            >
            <input
              v-model.number="product.weight"
              type="number"
              class="mt-1 w-full rounded-md border p-2 dark:text-gray-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium">ราคาขาย (บาท)</label>
            <input
              v-model.number="product.price"
              type="number"
              class="mt-1 w-full rounded-md border p-2 dark:text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
    <div
      class="flex justify-end space-x-3 bg-gray-50 px-6 py-3 dark:bg-gray-600"
    >
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-md border bg-white px-4 py-2 dark:text-gray-600"
      >
        ยกเลิก
      </button>
      <button
        type="submit"
        class="dark:bg-primary-dark rounded-md bg-primary px-4 py-2 text-white dark:text-gray-600"
      >
        บันทึก
      </button>
    </div>
  </form>
</template>
<style src="@vueform/multiselect/themes/default.css"></style>
