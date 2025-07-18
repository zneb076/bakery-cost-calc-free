<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';

// State สำหรับเก็บข้อมูล
const finalRecipes = ref([]); // เก็บเฉพาะสูตรหลัก
const selectedRecipeId = ref(null);
const productionQuantity = ref(30); // จำนวนชิ้นที่ต้องการผลิต
const weightPerPiece = ref(50); // น้ำหนักต่อชิ้น (กรัม)

// State สำหรับแสดงผล
const calculationResult = ref(null);
const isLoading = ref(false);

// ดึงข้อมูลเฉพาะสูตรหลัก (isSubRecipe: false)
async function fetchFinalRecipes() {
  try {
    const allRecipes = await db.recipes.toArray();
    finalRecipes.value = allRecipes.filter(
      (recipe) => recipe.isSubRecipe === false
    );
    ป;
  } catch (error) {
    console.error('Failed to fetch final recipes:', error);
  }
}

// เตรียมข้อมูลสำหรับ Dropdown
const recipeOptions = computed(() => {
  return finalRecipes.value.map((recipe) => ({
    value: recipe.id,
    label: recipe.name,
  }));
});

// ฟังก์ชันคำนวณ (ตอนนี้ยังเป็นแค่โครงสร้าง)
function calculateCost() {
  if (!selectedRecipeId.value) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดเลือกสูตร',
      text: 'กรุณาเลือกสูตรที่ต้องการคำนวณ',
    });
    return;
  }

  // ในขั้นตอนต่อไป เราจะใส่ Logic การคำนวณที่ซับซ้อนที่นี่
  console.log('Calculating cost for:', {
    recipeId: selectedRecipeId.value,
    quantity: productionQuantity.value,
    weight: weightPerPiece.value,
  });

  // สมมติว่ามีผลลัพธ์แล้ว (สำหรับแสดงผลชั่วคราว)
  calculationResult.value = {
    totalCost: 123.45,
    // ... more data to come
  };
}

onMounted(fetchFinalRecipes);
</script>

<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">เครื่องคำนวณต้นทุน</h1>

    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="grid grid-cols-1 items-end gap-6 md:grid-cols-4">
        <div class="md:col-span-2">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >เลือกสูตรอาหาร</label
          >
          <Multiselect
            v-model="selectedRecipeId"
            :options="recipeOptions"
            :searchable="true"
            placeholder="-- เลือกหรือค้นหาสูตร --"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >จำนวนที่ต้องการผลิต (ชิ้น)</label
          >
          <input
            v-model.number="productionQuantity"
            type="number"
            class="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >น้ำหนักต่อชิ้น (กรัม)</label
          >
          <input
            v-model.number="weightPerPiece"
            type="number"
            class="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div class="mt-6 text-right">
        <button
          @click="calculateCost"
          class="rounded-lg bg-primary px-6 py-2 font-bold text-white transition-opacity hover:bg-opacity-90"
        >
          คำนวณต้นทุน
        </button>
      </div>
    </div>

    <div class="mt-8">
      <div v-if="!calculationResult" class="py-10 text-center text-gray-500">
        <p>กรุณาเลือกสูตรและกรอกข้อมูลเพื่อคำนวณต้นทุน</p>
      </div>
      <div v-else class="rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-4 text-2xl font-semibold">ผลการคำนวณ</h2>
        <p>ต้นทุนรวม: {{ calculationResult.totalCost }} บาท</p>
      </div>
    </div>
  </div>
</template>
