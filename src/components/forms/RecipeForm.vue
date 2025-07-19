<script setup>
import { ref, watch, computed } from 'vue';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  availableIngredients: { type: Array, required: true },
});
const emit = defineEmits(['save', 'cancel']);

const recipe = ref({});

const ingredientOptions = computed(() => {
  return props.availableIngredients.map((item) => {
    const isSubRecipe = !!item.isSubRecipe;
    return {
      label: item.name,
      value: `${isSubRecipe ? 'recipe' : 'ingredient'}-${item.id}`,
      isSubRecipe: isSubRecipe, // ส่งค่า isSubRecipe ไปให้ template ใช้
    };
  });
});

watch(
  () => props.initialData,
  (newData) => {
    const deepCopy = JSON.parse(JSON.stringify(newData));
    if (!deepCopy.ingredientsList || deepCopy.ingredientsList.length === 0) {
      deepCopy.ingredientsList = [{ compositeId: null, quantity: null }];
    } else {
      deepCopy.ingredientsList = deepCopy.ingredientsList.map((item) => ({
        ...item,
        compositeId: `${item.itemType}-${item.itemId}`,
      }));
    }
    recipe.value = deepCopy;
  },
  { immediate: true, deep: true }
);

// ## ส่วนที่แก้ไข: การคำนวณ Baker's Percentage ##
const bakerPercentage = computed(() => {
  const list = recipe.value.ingredientsList;
  if (!list || list.length === 0) return {};

  // หาแป้งโดยใช้ compositeId
  const flourItem = list.find((item) => {
    if (!item.compositeId) return false;
    const [type, id] = item.compositeId.split('-');
    if (type !== 'ingredient') return false;

    const ingredient = props.availableIngredients.find(
      (i) => i.id === Number(id) && !i.isSubRecipe
    );
    return ingredient && ingredient.name.includes('แป้ง');
  });

  const flourWeight = flourItem ? Number(flourItem.quantity) : 0;
  if (flourWeight === 0) return {};

  const percentages = {};
  list.forEach((item, index) => {
    const quantity = Number(item.quantity) || 0;
    percentages[index] = ((quantity / flourWeight) * 100).toFixed(1);
  });

  return percentages;
});

function addIngredientRow() {
  recipe.value.ingredientsList.push({ compositeId: null, quantity: null });
}
function removeIngredientRow(index) {
  recipe.value.ingredientsList.splice(index, 1);
}

// ## ส่วนที่แก้ไข: ฟังก์ชัน handleSubmit ที่ปรับปรุงใหม่ ##
function handleSubmit() {
  if (!recipe.value.name) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกชื่อสูตร',
    });
    return;
  }

  // 1. กรองแถวที่กรอกข้อมูลครบถ้วนเท่านั้น
  const validIngredients = recipe.value.ingredientsList.filter(
    (item) =>
      item.compositeId && typeof item.quantity === 'number' && item.quantity > 0
  );

  // 2. ตรวจสอบแถวที่กรอกข้อมูลไม่สมบูรณ์
  const partiallyFilled = recipe.value.ingredientsList.find(
    (item) =>
      (item.compositeId &&
        !(typeof item.quantity === 'number' && item.quantity > 0)) ||
      (!item.compositeId &&
        typeof item.quantity === 'number' &&
        item.quantity > 0)
  );

  if (partiallyFilled) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกข้อมูลวัตถุดิบให้ครบทุกแถว หรือลบแถวที่ไม่ต้องการออก',
    });
    return;
  }

  // 3. ตรวจสอบว่ามีวัตถุดิบที่สมบูรณ์อย่างน้อย 1 รายการ
  if (validIngredients.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ',
    });
    return;
  }

  // 4. แปลงข้อมูลกลับไปเป็นรูปแบบที่ถูกต้องสำหรับบันทึก
  const finalIngredientsList = validIngredients.map((item) => {
    const [type, id] = item.compositeId.split('-');
    return {
      itemType: type,
      itemId: Number(id),
      quantity: item.quantity,
    };
  });

  const recipeToSave = {
    ...recipe.value,
    ingredientsList: finalIngredientsList,
  };

  emit('save', recipeToSave);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-3">
      <h3 class="mb-6 text-2xl font-semibold">
        {{ recipe.id ? 'แก้ไขสูตร' : 'เพิ่มสูตรใหม่' }}
      </h3>
      <div class="space-y-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >ชื่อสูตร</label
            >
            <input
              v-model="recipe.name"
              type="text"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>
          <div class="flex items-end pb-2">
            <div class="flex items-center">
              <input
                v-model="recipe.isSubRecipe"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <label class="ml-2 block text-sm text-gray-900"
                >เป็นสูตรย่อย</label
              >
            </div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h4 class="mb-4 text-lg font-medium">รายการวัตถุดิบ</h4>
          <div class="space-y-3">
            <div
              v-for="(item, index) in recipe.ingredientsList"
              :key="index"
              class="flex items-center space-x-2"
            >
              <Multiselect
                v-model="item.compositeId"
                :options="ingredientOptions"
                :searchable="true"
                placeholder="เลือกวัตถุดิบ"
                class="flex-grow"
              >
                <template #option="{ option }">
                  <div class="flex items-center justify-between">
                    <span>{{ option.label }} </span>
                    <span
                      v-if="option.isSubRecipe"
                      class="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-white"
                    >
                      สูตรย่อย
                    </span>
                  </div>
                </template>
              </Multiselect>
              <input
                v-model.number="item.quantity"
                type="number"
                step="0.01"
                placeholder="กรัม"
                class="w-[70px] appearance-none rounded rounded-md border border-gray-300 p-2 px-3 py-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <div class="w-24 text-center text-xs text-gray-600">
                <span v-if="bakerPercentage[index]"
                  >{{ bakerPercentage[index] }} %</span
                >
              </div>
              <button
                @click="removeIngredientRow(index)"
                type="button"
                class="text-red-500 hover:text-red-700"
              >
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
          <button
            @click="addIngredientRow"
            type="button"
            class="mt-4 font-semibold text-primary"
          >
            + เพิ่มวัตถุดิบ
          </button>
        </div>
      </div>
    </div>
    <div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-3">
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-md border border-gray-300 bg-white px-4 py-2"
      >
        ยกเลิก
      </button>
      <button type="submit" class="rounded-md bg-primary px-4 py-2 text-white">
        บันทึก
      </button>
    </div>
  </form>
</template>

<style src="@vueform/multiselect/themes/default.css"></style>

<style>
:root {
  --ms-border-color: #d1d5db;
  --ms-radius: 0.375rem;
  --ms-ring-color: rgba(255, 112, 129, 0.2); /* primary color with opacity */
}

.multiselect-dropdown {
  min-width: 250px; /* สามารถปรับความกว้างได้ตามต้องการ */
}
</style>
