<script setup>
import { ref, watch, computed } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  availableIngredients: { type: Array, required: true },
});
const emit = defineEmits(['save', 'cancel']);

const recipe = ref({});

watch(
  () => props.initialData,
  (newData) => {
    recipe.value = JSON.parse(JSON.stringify(newData));
    if (
      !recipe.value.ingredientsList ||
      recipe.value.ingredientsList.length === 0
    ) {
      recipe.value.ingredientsList = [{ ingredientId: null, quantity: null }];
    }
  },
  { immediate: true, deep: true }
);

function addIngredientRow() {
  recipe.value.ingredientsList.push({ ingredientId: null, quantity: null });
}
function removeIngredientRow(index) {
  recipe.value.ingredientsList.splice(index, 1);
}

const bakerPercentage = computed(() => {
  const list = recipe.value.ingredientsList;
  if (!list || list.length === 0) return {};

  const flourItem = list.find((item) => {
    const ingredient = props.availableIngredients.find(
      (i) => i.id === item.ingredientId
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

const ingredientOptions = computed(() => {
  return props.availableIngredients.map((item) => ({
    label: item.isSubRecipe ? `${item.name} (สูตรย่อย)` : item.name,
    value: item.id,
  }));
});

function handleSubmit() {
  if (!recipe.value.name) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกชื่อสูตร',
    });
    return;
  }

  // ============================================
  // ## ส่วนที่แก้ไข: เพิ่มการตรวจสอบที่ซับซ้อนขึ้น ##
  // ============================================

  // 1. ตรวจสอบแต่ละแถวที่ยังไม่ได้กรอง
  for (const item of recipe.value.ingredientsList) {
    const hasIngredient = !!item.ingredientId;
    const hasQuantity = !!item.quantity && item.quantity > 0;

    // กรณีที่ 1: มีชื่อ แต่ไม่มีปริมาณ
    if (hasIngredient && !hasQuantity) {
      const ingredientName =
        ingredientOptions.value.find((opt) => opt.value === item.ingredientId)
          ?.label || 'วัตถุดิบที่เลือก';
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: `กรุณากรอกปริมาณสำหรับ "${ingredientName}"`,
      });
      return; // หยุดการทำงาน
    }

    // กรณีที่ 2: มีปริมาณ แต่ไม่มีชื่อ
    if (!hasIngredient && hasQuantity) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: `กรุณาเลือกวัตถุดิบสำหรับปริมาณ "${item.quantity}" กรัม`,
      });
      return; // หยุดการทำงาน
    }
  }

  // 2. กรองเฉพาะแถวที่กรอกครบแล้วจริงๆ (เหมือนเดิม)
  const filteredIngredients = recipe.value.ingredientsList.filter(
    (item) => item.ingredientId && item.quantity && item.quantity > 0
  );

  // 3. ตรวจสอบว่าหลังจากกรองแล้ว ต้องมีอย่างน้อย 1 รายการ (เหมือนเดิม)
  if (filteredIngredients.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ และกรอกข้อมูลให้ครบถ้วน',
    });
    return;
  }

  // 4. สร้าง object ใหม่เพื่อบันทึก (เหมือนเดิม)
  const recipeToSave = {
    ...recipe.value,
    ingredientsList: filteredIngredients,
  };

  emit('save', recipeToSave);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-6">
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
                v-model="item.ingredientId"
                :options="ingredientOptions"
                :searchable="true"
                placeholder="เลือกวัตถุดิบ"
                class="flex-grow"
              />

              <input
                v-model.number="item.quantity"
                type="number"
                step="0.01"
                placeholder="กรัม"
                class="w-[70px] appearance-none rounded-md border border-gray-300 px-3 py-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                <font-awesome-icon :icon="faTrash" />
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
</style>
