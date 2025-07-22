<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import ProductForm from '../components/forms/ProductForm.vue';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const products = ref([]);
const availableRecipes = ref([]);
const isModalOpen = ref(false);
const editingProduct = ref(null);

async function fetchData() {
  try {
    const [prods, recipes] = await Promise.all([
      db.products.toArray(),
      db.recipes.toArray(),
    ]);
    products.value = prods;
    availableRecipes.value = recipes;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}
onMounted(fetchData);

function openAddModal() {
  editingProduct.value = {
    name: '',
    recipeId: null,
    weight: null,
    price: null,
  };
  isModalOpen.value = true;
}

function openEditModal(product) {
  editingProduct.value = product;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingProduct.value = null;
}

async function handleSave(productData) {
  const plainData = JSON.parse(JSON.stringify(productData));
  try {
    if (plainData.id) {
      await db.products.update(plainData.id, plainData);
    } else {
      await db.products.add(plainData);
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

async function deleteProduct(id, name) {
  const result = await Swal.fire({
    title: `ลบสินค้า "${name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'ใช่, ลบเลย',
    cancelButtonText: 'ยกเลิก',
  });
  if (result.isConfirmed) {
    await db.products.delete(id);
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

function getRecipeName(recipeId) {
  return availableRecipes.value.find((r) => r.id === recipeId)?.name || 'N/A';
}
</script>

<template>
  <div>
    <div
      class="grid grid-cols-1 gap-6 rounded-md border bg-white p-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">จัดการสินค้า</h1>
        <button
          @click="openAddModal"
          class="rounded-lg bg-primary px-4 py-2 text-white"
        >
          + เพิ่มสินค้าใหม่
        </button>
      </div>
      <div v-if="products.length === 0" class="py-10 text-center text-gray-500">
        <p>ยังไม่มีสินค้า...</p>
      </div>
      <div
        v-for="product in products"
        :key="product.id"
        class="rounded-lg bg-white p-4 shadow-md"
      >
        <div class="mb-2 flex items-center justify-between border-b pb-2">
          <h2 class="text-lg font-semibold">{{ product.name }}</h2>
          <div class="space-x-2">
            <button
              @click="openEditModal(product)"
              class="text-gray-500 hover:text-secondary"
            >
              <font-awesome-icon icon="pencil" />
            </button>
            <button
              @click="deleteProduct(product.id, product.name)"
              class="text-gray-500 hover:text-primary"
            >
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>
        <div class="space-y-1 text-sm">
          <p>
            <strong>มาจากสูตร:</strong> {{ getRecipeName(product.recipeId) }}
          </p>
          <p><strong>น้ำหนัก:</strong> {{ product.weight }} กรัม</p>
          <p><strong>ราคาขาย:</strong> {{ product.price }} บาท</p>
        </div>
      </div>
    </div>

    <BaseModal v-if="isModalOpen" @close="closeModal">
      <ProductForm
        :initial-data="editingProduct"
        :available-recipes="availableRecipes"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>
  </div>
</template>
