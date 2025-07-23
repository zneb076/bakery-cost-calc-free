<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import Swal from 'sweetalert2';
import BaseModal from '../components/BaseModal.vue';
import RecipeForm from '../components/forms/RecipeForm.vue';
import RecipeQuickViewModal from '../components/RecipeQuickViewModal.vue';
import ProductForm from '../components/forms/ProductForm.vue';
import ActionMenu from '../components/ActionMenu.vue';
import { useAppMode } from '../composables/useAppMode.js';

const recipes = ref([]);
const availableIngredients = ref([]);

const isModalOpen = ref(false);
const editingRecipe = ref(null);
const searchQuery = ref('');
const isQuickViewModalOpen = ref(false);
const recipeForQuickView = ref(null);
const isProductModalOpen = ref(false); // 2. State ใหม่
const newProductFromRecipe = ref(null); // 2. State ใหม่
const { currentMode } = useAppMode();

const isAdvanceMode = computed(() => currentMode.value === 'advance');

// Computed property to filter recipes based on search query
const filteredRecipes = computed(() => {
  if (!searchQuery.value) {
    return recipes.value;
  }
  return recipes.value.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

async function fetchData() {
  try {
    const [allDbRecipes, allIngredients] = await Promise.all([
      db.recipes.toArray(),
      db.ingredients.toArray(),
    ]);

    // Combine all recipes (main and sub) for display
    recipes.value = allDbRecipes.sort((a, b) => b.id - a.id);

    // For the dropdown, filter out main recipes and only use ingredients and sub-recipes
    const subRecipes = allDbRecipes.filter((r) => r.isSubRecipe === true);
    availableIngredients.value = [...allIngredients, ...subRecipes];
  } catch (error) {
    console.error('Failed to fetch data:', error);
    Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลได้', 'error');
  }
}

// ฟังก์ชันใหม่สำหรับเปิด Modal
function openQuickViewModal(recipe) {
  recipeForQuickView.value = recipe;
  isQuickViewModalOpen.value = true;
}

function openAddModal() {
  editingRecipe.value = {
    name: '',
    isSubRecipe: false,
    ingredientsList: [],
    notes: '',
  };
  isModalOpen.value = true;
}

function openEditModal(recipe) {
  editingRecipe.value = recipe;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingRecipe.value = null;
}

async function handleSave(recipeData) {
  const plainRecipeData = JSON.parse(JSON.stringify(recipeData));
  try {
    if (plainRecipeData.id) {
      await db.recipes.update(plainRecipeData.id, plainRecipeData);
    } else {
      await db.recipes.add(plainRecipeData);
    }

    closeModal();
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกสูตรสำเร็จ',
      showConfirmButton: false,
      timer: 1000,
    });
  } catch (error) {
    console.error('Save failed:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
  }
}

async function deleteRecipe(id, name) {
  // 1. ค้นหาสินค้าทั้งหมดที่ใช้สูตรนี้
  const productsUsingRecipe = await db.products
    .where('recipeId')
    .equals(id)
    .toArray();

  // 2. ถ้าเจอสินค้าที่ใช้งานอยู่
  if (productsUsingRecipe.length > 0) {
    const productNames = productsUsingRecipe.map((p) => p.name).join(', ');
    await Swal.fire({
      icon: 'error',
      title: 'ไม่สามารถลบสูตรนี้ได้',
      html: `เนื่องจากสูตร <strong>${name}</strong> ถูกใช้งานในสินค้า: <br><strong>${productNames}</strong><br><br>กรุณาลบสินค้าเหล่านี้ก่อน`,
    });
    return; // หยุดการทำงาน
  }

  // 3. ถ้าไม่เจอ ให้ยืนยันการลบตามปกติ
  const result = await Swal.fire({
    title: `ลบสูตร "${name}"?`,
    text: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
  });

  if (result.isConfirmed) {
    await db.recipes.delete(id);
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'ลบสำเร็จ',
      showConfirmButton: false,
      timer: 1000,
    });
  }
}

onMounted(fetchData);

function openQuickAddProductModal(recipe) {
  newProductFromRecipe.value = {
    name: '', // ใช้ชื่อสูตรเป็นชื่อสินค้าเริ่มต้น
    recipeId: recipe.id,
    weight: null,
    price: null,
  };
  isProductModalOpen.value = true;
}

// 4. ฟังก์ชันใหม่สำหรับบันทึกสินค้า
async function handleProductSave(productData) {
  const plainData = JSON.parse(JSON.stringify(productData));
  try {
    await db.products.add(plainData);
    isProductModalOpen.value = false;
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `เพิ่มสินค้า "${plainData.name}" เรียบร้อยแล้ว`,
      showConfirmButton: false,
      timer: 3000,
    });
  } catch (error) {
    console.error('Save failed:', error);
    Swal.fire(
      'เกิดข้อผิดพลาด',
      'มีสินค้าชื่อนี้อยู่แล้ว หรือเกิดปัญหาในการบันทึก',
      'error'
    );
  }
}
</script>

<template>
  <div>
    <div class="rounded-lg bg-white p-3 pb-8 shadow-md">
      <div class="overflow-x-auto">
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-2xl font-bold">จัดการสูตรขนม</h1>

          <button
            @click="openAddModal"
            class="rounded-lg bg-primary px-4 py-2 text-white transition-opacity hover:bg-opacity-90"
          >
            + เพิ่มสูตรใหม่
          </button>
        </div>
        <div class="relative mb-4 w-full md:w-64">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ค้นหาสูตร..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
          >
            <font-awesome-icon icon="xmark" />
          </button>
        </div>
        <table class="mb-[120px] min-w-full bg-white">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left">ชื่อสูตร</th>
              <th class="px-4 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRecipes.length === 0">
              <td colspan="3" class="py-4 text-center text-gray-500">
                ไม่พบสูตรที่ตรงกัน...
              </td>
            </tr>
            <tr
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="px-2 py-2">
                {{ recipe.name }}
                <div v-if="recipe.isSubRecipe">
                  <span
                    class="rounded-full bg-secondary px-2 py-0.5 text-xs text-white"
                  >
                    สูตรย่อย
                  </span>
                </div>
              </td>
              <td class="w-24 py-3 text-right">
                <div class="flex items-center justify-end space-x-3">
                  <button
                    @click="openQuickViewModal(recipe)"
                    class="text-gray-500 transition-colors hover:text-green-600"
                    title="ดูสูตรด่วน"
                  >
                    <font-awesome-icon icon="eye" />
                  </button>
                  <router-link
                    :to="{ name: 'Calculator', query: { recipeId: recipe.id } }"
                    class="text-gray-500 transition-colors hover:text-yellow-600"
                    title="คำนวณต้นทุนสูตรนี้"
                  >
                    <font-awesome-icon icon="calculator" size="lg" />
                  </router-link>

                  <ActionMenu>
                    <div class="py-1">
                      <button
                        v-if="!recipe.isSubRecipe && isAdvanceMode"
                        @click.stop="openQuickAddProductModal(recipe)"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        สร้างสินค้าจากสูตรนี้
                      </button>
                      <button
                        @click.stop="openEditModal(recipe)"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        แก้ไข
                      </button>
                      <button
                        @click.stop="deleteRecipe(recipe.id, recipe.name)"
                        class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                      >
                        ลบ
                      </button>
                    </div>
                  </ActionMenu>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-if="isModalOpen" @close="closeModal" size="large">
      <RecipeForm
        :initial-data="editingRecipe"
        :available-ingredients="availableIngredients"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>

    <BaseModal
      v-if="isQuickViewModalOpen"
      @close="isQuickViewModalOpen = false"
    >
      <RecipeQuickViewModal
        v-if="recipeForQuickView"
        :recipe="recipeForQuickView"
        :all-ingredients-and-sub-recipes="availableIngredients"
      />
    </BaseModal>
    <BaseModal v-if="isProductModalOpen" @close="isProductModalOpen = false">
      <ProductForm
        v-if="newProductFromRecipe"
        :initial-data="newProductFromRecipe"
        :available-recipes="recipes"
        @save="handleProductSave"
        @cancel="isProductModalOpen = false"
      />
    </BaseModal>
  </div>
</template>
