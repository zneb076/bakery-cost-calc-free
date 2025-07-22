<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import AnalysisGroupForm from '../components/forms/BreakEvenAnalysisForm.vue';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const analysisGroups = ref([]);
const availableRecipes = ref([]);
const isModalOpen = ref(false);
const editingGroup = ref(null);

// ## ส่วนที่แก้ไข: เปลี่ยนวิธีดึงข้อมูล recipes ##
async function fetchData() {
  try {
    const [groups, allRecipes] = await Promise.all([
      db.analysisGroups.toArray(),
      db.recipes.toArray(), // ดึงสูตรมาทั้งหมดก่อน
    ]);
    analysisGroups.value = groups;
    // กรองเฉพาะสูตรหลักด้วย .filter()
    availableRecipes.value = allRecipes.filter((r) => !r.isSubRecipe);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
onMounted(fetchData);

function openAddModal() {
  editingGroup.value = {
    name: '',
    recipes: [{ recipeId: null, monthlySales: null, price: null }],
  };
  isModalOpen.value = true;
}

function openEditModal(group) {
  editingGroup.value = group;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingGroup.value = null;
}

async function handleSave(groupData) {
  const plainData = JSON.parse(JSON.stringify(groupData));
  try {
    if (plainData.id) {
      await db.analysisGroups.update(plainData.id, plainData);
    } else {
      await db.analysisGroups.add(plainData);
    }
    closeModal();
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกสำเร็จ',
      showConfirmButton: false,
      timer: 3000,
    });
  } catch (error) {
    console.error('Save failed:', error);
  }
}

async function deleteGroup(id, name) {
  const result = await Swal.fire({
    title: `ลบกลุ่ม "${name}"?`,
    text: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
  });

  if (result.isConfirmed) {
    await db.analysisGroups.delete(id);
    await fetchData();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'ลบสำเร็จ',
      showConfirmButton: false,
      timer: 3000,
    });
  }
}

// ฟังก์ชันสำหรับหาชื่อสูตรจาก ID
function getRecipeName(recipeId) {
  return availableRecipes.value.find((r) => r.id === recipeId)?.name || 'N/A';
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">กลุ่มวิเคราะห์ต้นทุน</h1>
      <button
        @click="openAddModal"
        class="rounded-lg bg-primary px-4 py-2 font-bold text-white"
      >
        + สร้างกลุ่มใหม่
      </button>
    </div>

    <div
      v-if="analysisGroups.length === 0"
      class="py-10 text-center text-gray-500"
    >
      <p>ยังไม่มีกลุ่มวิเคราะห์...</p>
      <p>คลิก 'สร้างกลุ่มใหม่' เพื่อเริ่มต้น</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="group in analysisGroups"
        :key="group.id"
        class="rounded-lg bg-white p-4 shadow-md"
      >
        <div class="mb-2 flex items-center justify-between border-b pb-2">
          <h2 class="text-lg font-semibold">{{ group.name }}</h2>
          <div class="space-x-2">
            <button
              @click="openEditModal(group)"
              class="text-gray-500 hover:text-secondary"
            >
              <font-awesome-icon icon="pencil" />
            </button>
            <button
              @click="deleteGroup(group.id, group.name)"
              class="text-gray-500 hover:text-primary"
            >
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
        <ul class="space-y-1 text-sm">
          <li
            v-for="recipe in group.recipes"
            :key="recipe.recipeId"
            class="flex justify-between"
          >
            <span>- {{ getRecipeName(recipe.recipeId) }}</span>
            <span v-if="recipe.monthlySales" class="font-mono"
              >{{ recipe.monthlySales }} ชิ้น/เดือน</span
            >
          </li>
        </ul>
      </div>
    </div>

    <BaseModal v-if="isModalOpen" @close="closeModal" size="large">
      <AnalysisGroupForm
        :initial-data="editingGroup"
        :available-recipes="availableRecipes"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>
  </div>
</template>
