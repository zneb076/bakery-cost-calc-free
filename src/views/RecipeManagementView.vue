<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import Swal from 'sweetalert2';

import BaseModal from '../components/BaseModal.vue';
import RecipeForm from '../components/forms/RecipeForm.vue';
import RecipeQuickViewModal from '../components/RecipeQuickViewModal.vue';

const recipes = ref([]);
const availableIngredients = ref([]);

const isModalOpen = ref(false);
const editingRecipe = ref(null);
const searchQuery = ref('');
const isQuickViewModalOpen = ref(false);
const recipeForQuickView = ref(null);

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

function deleteRecipe(id, name) {
  Swal.fire({
    title: `คุณแน่ใจหรือไม่?`,
    text: `คุณต้องการลบสูตร "${name}" ใช่ไหม?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก',
  }).then(async (result) => {
    if (result.isConfirmed) {
      await db.recipes.delete(id);
      await fetchData();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'ลบสูตรแล้ว',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });
}

onMounted(fetchData);
</script>

<template>
  <div>
    <div class="rounded-lg bg-white p-4 shadow-md">
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
        <table class="min-w-full bg-white">
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
              <td class="px-4 py-3">
                {{ recipe.name }}
                <span
                  v-if="recipe.isSubRecipe"
                  class="rounded-full bg-secondary px-2 py-0.5 text-xs text-white"
                >
                  สูตรย่อย
                </span>
              </td>
              <td class="w-24 py-3 text-right">
                <div class="flex items-center justify-center space-x-4">
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

                  <button
                    @click="openEditModal(recipe)"
                    class="text-gray-500 transition-colors hover:text-secondary"
                    title="แก้ไข"
                  >
                    <font-awesome-icon icon="pencil" />
                  </button>
                  <button
                    @click="deleteRecipe(recipe.id, recipe.name)"
                    class="text-gray-500 transition-colors hover:text-primary"
                    title="ลบ"
                  >
                    <font-awesome-icon icon="trash" />
                  </button>
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
  </div>
</template>
