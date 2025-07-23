<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import OverheadAnalysisForm from '../components/forms/OverheadAnalysisForm.vue';
import Swal from 'sweetalert2';
import Multiselect from '@vueform/multiselect';

const GROUP_TYPE = 'overhead';

const analysisGroups = ref([]);
const allProducts = ref([]);
const allRecipes = ref([]);
const allIngredients = ref([]);
const allSubRecipes = ref([]);
const fixedCosts = ref(10000);
const calculationResult = ref(null);
const isLoadingData = ref(true);
const isGroupModalOpen = ref(false);
const editingGroup = ref(null);
const resultsSection = ref(null);
const loadedGroupInfo = ref(null);

const liveProducts = ref([{ productId: null, monthlySales: null }]);
const productOptions = computed(() =>
  allProducts.value.map((p) => ({ value: p.id, label: p.name }))
);

async function fetchData() {
  try {
    isLoadingData.value = true;
    const [groups, products, recipes, ingredients] = await Promise.all([
      db.analysisGroups.where('groupType').equals(GROUP_TYPE).toArray(),
      db.products.toArray(),
      db.recipes.toArray(),
      db.ingredients.toArray(),
    ]);
    analysisGroups.value = groups;
    allProducts.value = products;
    allRecipes.value = recipes;
    allSubRecipes.value = recipes.filter((r) => r.isSubRecipe);
    allIngredients.value = ingredients;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    isLoadingData.value = false;
  }
}
onMounted(fetchData);

function openAddModal() {
  editingGroup.value = {
    name: '',
    products: [{ productId: null, monthlySales: null }],
  };
  isGroupModalOpen.value = true;
}
function openEditModal(group) {
  editingGroup.value = { ...JSON.parse(JSON.stringify(group)) };
  isGroupModalOpen.value = true;
}
function closeModal() {
  isGroupModalOpen.value = false;
  editingGroup.value = null;
}

async function handleSave(groupData) {
  const plainData = {
    ...JSON.parse(JSON.stringify(groupData)),
    groupType: GROUP_TYPE,
  };
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
}

async function deleteGroup(id, name) {
  const result = await Swal.fire({
    title: `ลบกลุ่ม "${name}"?`,
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

function addLiveProductRow() {
  liveProducts.value.push({ productId: null, monthlySales: null });
}
function removeLiveProductRow(index) {
  liveProducts.value.splice(index, 1);
}

watch(
  liveProducts,
  () => {
    calculationResult.value = null;
    if (loadedGroupInfo.value) {
      loadedGroupInfo.value = null; // Reset ถ้ามีการแก้ไข
    }
  },
  { deep: true }
);

function loadGroupToLive(group) {
  liveProducts.value = JSON.parse(JSON.stringify(group.products));
  loadedGroupInfo.value = { id: group.id, name: group.name }; // บันทึกข้อมูลกลุ่ม
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: `โหลดข้อมูลกลุ่ม "${group.name}" แล้ว`,
    showConfirmButton: false,
    timer: 2000,
  });
}

async function calculateFromLive() {
  const groupNameToUse = loadedGroupInfo.value
    ? loadedGroupInfo.value.name
    : ' (คำนวณชั่วคราว)';
  const tempGroup = { name: groupNameToUse, products: liveProducts.value };
  await calculateOverhead(tempGroup);
}

async function calculateOverhead(group) {
  calculationResult.value = null;
  if (!group) return;

  const productDetails = [];
  let totalMonthlyVariableCost = 0;

  for (const product of group.products) {
    const productInfo = allProducts.value.find(
      (p) => p.id === product.productId
    );
    const recipe = allRecipes.value.find((r) => r.id === productInfo?.recipeId);
    if (!recipe || !productInfo || !product.monthlySales) continue;

    const totalRecipeWeight =
      recipe.ingredientsList.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ) || 1;
    const flatIngredients = await expandRecipe(recipe);
    const totalRecipeCost = flatIngredients.reduce(
      (sum, ing) => sum + ing.totalCost,
      0
    );
    const variableCostPerGram = totalRecipeCost / totalRecipeWeight;
    const variableCostPerUnit =
      variableCostPerGram * Number(productInfo.weight);
    const monthlyVariableCost =
      variableCostPerUnit * Number(product.monthlySales);

    totalMonthlyVariableCost += monthlyVariableCost;
    productDetails.push({
      ...product,
      name: productInfo.name,
      variableCostPerUnit,
      monthlyVariableCost,
    });
  }

  if (totalMonthlyVariableCost === 0) {
    Swal.fire('คำนวณไม่ได้', 'ต้นทุนวัตถุดิบรวมของกลุ่มเป็นศูนย์', 'warning');
    return;
  }

  const results = productDetails.map((p) => {
    const costRatio = p.monthlyVariableCost / totalMonthlyVariableCost;
    const allocatedFixedCost = Number(fixedCosts.value || 0) * costRatio;
    const overheadPerUnit = allocatedFixedCost / Number(p.monthlySales);
    const trueCostPerUnit = p.variableCostPerUnit + overheadPerUnit;
    return {
      name: p.name,
      variableCostPerUnit: p.variableCostPerUnit,
      overheadPerUnit,
      trueCostPerUnit,
      productId: p.productId,
    };
  });

  calculationResult.value = { groupNameToUse: group.name, results };
  await nextTick();
  resultsSection.value?.scrollIntoView({ behavior: 'smooth' });
}

async function expandRecipe(recipe, scalingFactor = 1) {
  const ingredientMap = new Map();
  if (!recipe.ingredientsList) return [];
  for (const item of recipe.ingredientsList) {
    if (
      !item.quantity ||
      typeof item.quantity !== 'number' ||
      item.quantity <= 0
    )
      continue;
    const netQuantity = Number(item.quantity) * scalingFactor;
    const yieldFactor = Number(item.yield || 100) / 100;
    const grossQuantity = netQuantity / yieldFactor;
    if (item.itemType === 'ingredient') {
      const baseIngredient = allIngredients.value.find(
        (i) => i.id === item.itemId
      );
      if (baseIngredient) {
        let cost = 0;
        if (
          item.costByWholeUnit &&
          baseIngredient.purchaseUnit.toLowerCase() !== 'กรัม'
        ) {
          const weightPerUnit = Number(
            baseIngredient.standardWeightInGrams || 1
          );
          const unitsNeeded = Math.ceil(grossQuantity / weightPerUnit);
          const costPerUnit =
            Number(baseIngredient.purchasePrice) /
            Number(baseIngredient.purchaseQuantity);
          cost = unitsNeeded * costPerUnit;
        } else {
          cost = grossQuantity * Number(baseIngredient.costPerGram || 0);
        }
        if (ingredientMap.has(baseIngredient.id)) {
          ingredientMap.get(baseIngredient.id).totalCost += cost;
        } else {
          ingredientMap.set(baseIngredient.id, {
            id: baseIngredient.id,
            name: baseIngredient.name,
            totalCost: cost,
          });
        }
      }
    } else if (item.itemType === 'recipe') {
      const subRecipe = allSubRecipes.value.find((r) => r.id === item.itemId);
      if (subRecipe) {
        const subRecipeTotalWeight =
          subRecipe.ingredientsList.reduce(
            (sum, current) => sum + Number(current.quantity || 0),
            0
          ) || 1;
        const subRecipeScalingFactor = grossQuantity / subRecipeTotalWeight;
        const subIngredients = await expandRecipe(
          subRecipe,
          subRecipeScalingFactor
        );
        subIngredients.forEach((subItem) => {
          if (ingredientMap.has(subItem.id)) {
            ingredientMap.get(subItem.id).totalCost += subItem.totalCost;
          } else {
            ingredientMap.set(subItem.id, subItem);
          }
        });
      }
    }
  }
  return Array.from(ingredientMap.values());
}

function getProductName(productId) {
  return allProducts.value.find((p) => p.id === productId)?.name || 'N/A';
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">คำนวณต้นทุนแฝงต่อชิ้น</h1>

    <div v-if="isLoadingData" class="py-10 text-center">
      <p>กำลังโหลดข้อมูล...</p>
    </div>
    <div v-else>
      <div class="mb-4 rounded-lg bg-white p-4 shadow-md">
        <h2 class="mb-4 text-2xl font-semibold">พื้นที่คำนวณ (Live)</h2>
        <div class="border-t pt-4">
          <div class="mb-4">
            <label class="block text-sm font-medium"
              >ต้นทุนคงที่ทั้งหมด/เดือน (บาท)</label
            >
            <input
              v-model.number="fixedCosts"
              type="number"
              class="mt-1 w-full rounded-md border p-2 md:w-1/2"
            />
          </div>
          <h4 class="mb-2 font-semibold">รายการสินค้า</h4>
          <div class="space-y-3">
            <div
              v-for="(item, index) in liveProducts"
              :key="index"
              class="rounded-lg bg-gray-50 p-2"
            >
              <div class="flex items-end space-x-1">
                <div class="flex-grow">
                  <label class="block text-xs font-medium text-gray-600"
                    >สินค้า</label
                  >
                  <Multiselect
                    v-model="item.productId"
                    :options="productOptions"
                    placeholder="เลือกสินค้า"
                    class="mt-1"
                  />
                </div>
                <div class="w-16 flex-shrink-0">
                  <label class="block text-xs font-medium text-gray-600"
                    >ยอดขาย (ชิ้น/เดือน)</label
                  >
                  <input
                    v-model.number="item.monthlySales"
                    type="number"
                    placeholder="ชิ้น"
                    class="mt-1 w-16 rounded-md border p-2"
                  />
                </div>
                <button
                  @click="removeLiveProductRow(index)"
                  type="button"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center py-5 text-red-500"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
            </div>
          </div>
          <div class="mt-4 flex items-center space-x-4">
            <button
              @click="addLiveProductRow"
              type="button"
              class="font-semibold text-primary"
            >
              + เพิ่มสินค้า
            </button>
          </div>
          <div class="mt-4 flex justify-end space-x-2 border-t pt-4">
            <button
              @click="saveLiveGroup"
              class="rounded-lg border border-blue-500 px-4 py-2 text-blue-500 transition hover:bg-blue-500 hover:text-white"
            >
              บันทึกเป็นกลุ่ม
            </button>
            <button
              @click="calculateFromLive"
              class="rounded-lg bg-primary px-4 py-2 font-bold text-white"
            >
              คำนวณ
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-md">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-2xl font-semibold">กลุ่มที่บันทึกไว้</h2>
          <button
            @click="openAddModal"
            class="rounded-md bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
          >
            + สร้างกลุ่มใหม่
          </button>
        </div>
        <table class="min-w-full">
          <tbody>
            <tr v-if="analysisGroups.length === 0">
              <td class="py-4 text-center text-gray-500">
                ยังไม่มีกลุ่มที่บันทึกไว้...
              </td>
            </tr>
            <tr
              v-for="group in analysisGroups"
              :key="group.id"
              class="border-b"
            >
              <td class="py-2">
                <p class="font-semibold">{{ group.name }}</p>
                <p class="text-xs text-gray-500">
                  ประกอบด้วย:
                  {{
                    group.products
                      .map((p) => getProductName(p.productId))
                      .join(', ')
                  }}
                </p>
              </td>
              <td class="space-x-2 py-2 text-right">
                <button
                  @click="loadGroupToLive(group)"
                  class="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                >
                  โหลด
                </button>
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        ref="resultsSection"
        v-if="calculationResult"
        class="mb-8 mt-6 rounded-lg bg-white p-6 shadow-md"
      >
        <h2 class="mb-4 text-2xl font-semibold">
          ผลการคำนวณสำหรับกลุ่ม:
          <span class="text-primary">{{
            calculationResult.groupNameToUse
          }}</span>
        </h2>
        <table class="min-w-full border text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-3 py-2 text-left">ชื่อสินค้า</th>
              <th class="px-3 py-2 text-right">ต้นทุนวัตถุดิบ/ชิ้น</th>
              <th class="px-3 py-2 text-right">ต้นทุนแฝง/ชิ้น</th>
              <th class="px-3 py-2 text-right">ต้นทุนจริง/ชิ้น</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in calculationResult.results"
              :key="p.productId"
              class="border-b"
            >
              <td class="px-3 py-2">{{ p.name }}</td>
              <td class="px-3 py-2 text-right font-mono">
                {{ p.variableCostPerUnit.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-orange-500">
                {{ p.overheadPerUnit.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono font-bold text-primary">
                {{ p.trueCostPerUnit.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BaseModal v-if="isGroupModalOpen" @close="closeModal" size="large">
        <OverheadAnalysisForm
          :initial-data="editingGroup"
          :available-products="allProducts"
          @save="handleSave"
          @cancel="closeModal"
        />
      </BaseModal>
    </div>
  </div>
</template>
