<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../services/db.js';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

import BaseModal from '../components/BaseModal.vue';
import RecipeForm from '../components/forms/RecipeForm.vue';

const recipes = ref([]);
const availableIngredients = ref([]);

const isModalOpen = ref(false);
const editingRecipe = ref(null);

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

function openAddModal() {
  editingRecipe.value = { name: '', isSubRecipe: false, ingredientsList: [] };
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
  try {
    // Convert the reactive object to a plain JavaScript object
    const plainRecipeData = JSON.parse(JSON.stringify(recipeData));

    if (plainRecipeData.id) {
      // Use the plain object for updating
      await db.recipes.update(plainRecipeData.id, plainRecipeData);
    } else {
      // Use the plain object for adding
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
          <h1 class="text-3xl font-bold">จัดการสูตร</h1>
          <button
            @click="openAddModal"
            class="rounded-lg bg-primary px-4 py-2 font-bold text-white transition-opacity hover:bg-opacity-90"
          >
            + เพิ่มสูตรใหม่
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
            <tr v-if="recipes.length === 0">
              <td colspan="3" class="py-4 text-center text-gray-500">
                ยังไม่มีสูตร...
              </td>
            </tr>
            <tr
              v-for="recipe in recipes"
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
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-4">
                  <button
                    @click="openEditModal(recipe)"
                    class="text-gray-500 transition-colors hover:text-secondary"
                    title="แก้ไข"
                  >
                    <font-awesome-icon :icon="faPencil" size="lg" />
                  </button>
                  <button
                    @click="deleteRecipe(recipe.id, recipe.name)"
                    class="text-gray-500 transition-colors hover:text-primary"
                    title="ลบ"
                  >
                    <font-awesome-icon :icon="faTrash" size="lg" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-if="isModalOpen" @close="closeModal">
      <RecipeForm
        :initial-data="editingRecipe"
        :available-ingredients="availableIngredients"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>
  </div>
</template>
