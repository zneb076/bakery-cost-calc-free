<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import ProductForm from '../components/forms/ProductForm.vue';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ActionMenu from '../components/ActionMenu.vue';

const products = ref([]);
const availableRecipes = ref([]);
const isModalOpen = ref(false);
const editingProduct = ref(null);

const searchQuery = ref('');
const expandedRowId = ref(null); // State for accordion

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

const filteredProducts = computed(() => {
  if (!searchQuery.value) {
    return products.value;
  }
  return products.value.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function toggleRow(id) {
  expandedRowId.value = expandedRowId.value === id ? null : id;
}

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
  <div class="rounded-lg bg-white p-4 shadow-md">
    <div
      class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >
      <h1 class="text-3xl font-bold">จัดการสินค้า (ขนม)</h1>
      <button
        @click="openAddModal"
        class="rounded-lg bg-primary px-4 py-2 text-white"
      >
        + เพิ่มราการขนมใหม่
      </button>
      <div class="relative w-full md:w-64">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="ค้นหารายการขนม..."
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
    </div>

    <div class="overflow-hidden rounded-lg bg-white shadow-sm">
      <table class="mb-[100px] min-w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="w-full px-4 py-2 text-left">ชื่อสินค้า</th>
            <th class="px-4 py-2 text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody v-if="filteredProducts.length === 0">
          <tr>
            <td colspan="2" class="py-4 text-center text-gray-500">
              ไม่พบข้อมูล...
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <template v-for="product in filteredProducts" :key="product.id">
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-3">{{ product.name }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center space-x-3">
                  <button
                    class="text-gray-500 transition-colors hover:text-green-600"
                    @click="toggleRow(product.id)"
                  >
                    <font-awesome-icon icon="eye" />
                  </button>
                  <router-link
                    :to="{
                      name: 'Calculator',
                      query: { productId: product.id },
                    }"
                    class="text-gray-500 hover:text-yellow-600"
                    title="คำนวณต้นทุน (Basic)"
                  >
                    <font-awesome-icon icon="calculator" size="lg" />
                  </router-link>
                  <ActionMenu>
                    <div class="py-1">
                      <button
                        @click="openEditModal(product)"
                        class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        แก้ไข
                      </button>
                      <button
                        @click="deleteProduct(product.id, product.name)"
                        class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                      >
                        ลบ
                      </button>
                    </div>
                  </ActionMenu>
                </div>
              </td>
            </tr>
            <tr v-if="expandedRowId === product.id">
              <td colspan="2" class="bg-gray-50 p-4 text-sm">
                <ul class="space-y-1">
                  <li>
                    <strong>มาจากสูตร:</strong>
                    {{ getRecipeName(product.recipeId) }}
                  </li>
                  <li><strong>น้ำหนัก:</strong> {{ product.weight }} กรัม</li>
                  <li><strong>ราคาขาย:</strong> {{ product.price }} บาท</li>
                </ul>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
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
