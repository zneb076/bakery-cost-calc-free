<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import Swal from 'sweetalert2';

import BaseModal from '../components/BaseModal.vue';
import IngredientForm from '../components/forms/IngredientForm.vue';

const ingredients = ref([]);
const isModalOpen = ref(false);
const editingIngredient = ref(null);
const searchQuery = ref('');

const ingredientNames = computed(() => ingredients.value.map((i) => i.name));

const filteredIngredients = computed(() => {
  if (!searchQuery.value) {
    return ingredients.value;
  }
  return ingredients.value.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

async function fetchIngredients() {
  ingredients.value = await db.ingredients.orderBy('name').toArray();
}

function openAddModal() {
  editingIngredient.value = {
    name: '',
    purchaseUnit: 'กรัม',
    purchaseQuantity: null,
    purchasePrice: null,
  };
  isModalOpen.value = true;
}

function openEditModal(ingredient) {
  editingIngredient.value = { ...ingredient };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingIngredient.value = null;
}

// แก้ไขฟังก์ชันนี้ให้บันทึกข้อมูลตามโครงสร้างใหม่
async function handleSave(formData) {
  try {
    const plainData = JSON.parse(JSON.stringify(formData));

    if (plainData.id) {
      // Update
      await db.ingredients.update(plainData.id, plainData);
    } else {
      // Add
      await db.ingredients.add(plainData);
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกข้อมูลสำเร็จ',
      showConfirmButton: false,
      timer: 1000,
    });

    closeModal();
    await fetchIngredients();
  } catch (error) {
    console.error('Save failed:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
  }
}

async function deleteIngredient(id, name) {
  const result = await Swal.fire({
    title: `คุณแน่ใจหรือไม่?`,
    text: `คุณต้องการลบ "${name}" ใช่ไหม? การกระทำนี้ไม่สามารถย้อนกลับได้!`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก',
  });

  if (result.isConfirmed) {
    try {
      // ลบข้อมูลออกจากฐานข้อมูล
      await db.ingredients.delete(id);
      // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอ
      await fetchIngredients();
      // แสดงข้อความสำเร็จ
      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        showConfirmButton: false,
        timer: 1000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error('Failed to delete ingredient:', error);
      await Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถลบข้อมูลได้', 'error');
    }
  }
}

onMounted(fetchIngredients);
</script>

<template>
  <div>
    <div class="rounded-lg bg-white p-4 shadow-md">
      <div class="overflow-x-auto">
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-3xl font-bold">วัตถุดิบ</h1>
          <button
            @click="openAddModal"
            class="rounded-lg bg-primary px-4 py-2 font-bold text-white transition-opacity hover:bg-opacity-90"
          >
            + เพิ่มวัตถุดิบใหม่
          </button>
        </div>
        <div class="relative mb-4 w-full md:w-64">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="ค้นหาวัตถุดิบ..."
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
              <th class="px-4 py-2 text-left">ชื่อวัตถุดิบ</th>
              <th class="px-4 py-2 text-right font-semibold text-primary">
                ราคาต่อกรัม (บาท)
              </th>
              <th class="px-4 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredIngredients.length === 0">
              <td colspan="4" class="py-4 text-center text-gray-500">
                ไม่พบวัตถุดิบที่ตรงกัน...
              </td>
            </tr>
            <tr
              v-for="ingredient in filteredIngredients"
              :key="ingredient.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="px-4 py-2">{{ ingredient.name }}</td>
              <td class="px-4 py-2 text-right font-semibold text-primary">
                {{
                  ingredient.costPerGram
                    ? ingredient.costPerGram.toFixed(2)
                    : 'N/A'
                }}
              </td>
              <td class="px-4 py-2 text-center">
                <div class="space-x-3">
                  <button
                    @click="openEditModal(ingredient)"
                    class="text-gray-500 hover:text-secondary"
                  >
                    <font-awesome-icon icon="pencil" />
                  </button>
                  <button
                    @click="deleteIngredient(ingredient.id, ingredient.name)"
                    class="text-gray-500 hover:text-primary"
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

    <BaseModal v-if="isModalOpen" @close="closeModal">
      <IngredientForm
        :initial-data="editingIngredient"
        :existing-names="ingredientNames"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>
  </div>
</template>
