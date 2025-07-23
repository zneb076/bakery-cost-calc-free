<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { db } from '../services/db.js';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';
import BaseModal from '../components/BaseModal.vue';
import BreakEvenAnalysisForm from '../components/forms/BreakEvenAnalysisForm.vue';

const GROUP_TYPE = 'breakeven';

const analysisGroups = ref([]);
const allProducts = ref([]);
const allRecipes = ref([]);
const allIngredients = ref([]);
const allSubRecipes = ref([]);
const fixedCosts = ref(10000);

const calculationResult = ref(null);
const isGroupModalOpen = ref(false);
const editingGroup = ref(null);
const isStepsModalOpen = ref(false);

const resultsSection = ref(null);
const isLoadingData = ref(true);

const expandedProjectionIndex = ref(null);
const loadedGroup = ref(null);

// **NEW:** Add this computed property back in
const projectionDetails = computed(() => {
  if (expandedProjectionIndex.value === null || !calculationResult.value)
    return [];

  const projection =
    calculationResult.value.projections[expandedProjectionIndex.value];
  if (!projection) return [];

  return calculationResult.value.productDetails.map((p) => {
    const units =
      projection.units * (p.salesMix / calculationResult.value.totalMixRatio);
    return { name: p.name, units: Math.ceil(units) };
  });
});

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

const productOptions = computed(() => {
  return allProducts.value.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.price} บาท)`,
  }));
});

const liveProducts = ref([{ productId: null, salesMix: null }]);

watch(
  liveProducts,
  (newValue) => {
    calculationResult.value = null;
    newValue.forEach((item) => {
      if (item.productId && !item.price) {
        const product = allProducts.value.find((p) => p.id === item.productId);
        if (product) {
          item.price = product.price;
        }
      }
    });
  },
  { deep: true }
);

function addLiveProductRow() {
  liveProducts.value.push({ productId: null, salesMix: null, price: null });
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

async function saveLiveGroup() {
  const { value: groupName } = await Swal.fire({
    title: 'บันทึกกลุ่มวิเคราะห์',
    input: 'text',
    inputLabel: 'ชื่อกลุ่ม',
    inputPlaceholder: 'ใส่ชื่อกลุ่มที่ต้องการบันทึก',
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
  });

  if (groupName) {
    // **FIX:** Convert reactive array to plain array before filtering
    const plainLiveProducts = JSON.parse(JSON.stringify(liveProducts.value));

    const validProducts = plainLiveProducts.filter(
      (p) => p.productId && p.salesMix > 0
    );

    if (validProducts.length > 0) {
      const newGroup = {
        name: groupName,
        products: validProducts,
        groupType: GROUP_TYPE,
      };
      await db.analysisGroups.add(newGroup);
      await fetchData();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'บันทึกกลุ่มสำเร็จ',
        showConfirmButton: false,
        timer: 3000,
      });
    } else {
      Swal.fire(
        'เกิดข้อผิดพลาด',
        'กรุณาเลือกสินค้าและใส่สัดส่วนการขาย',
        'error'
      );
    }
  }
}
async function calculateFromLive() {
  const groupNameToUse = loadedGroupInfo.value
    ? loadedGroupInfo.value.name
    : ' (คำนวณชั่วคราว)';

  const productsForCalc = liveProducts.value
    .map((item) => {
      const productInfo = allProducts.value.find(
        (p) => p.id === item.productId
      );
      if (!productInfo || !item.salesMix) return null;
      return { ...productInfo, salesMix: item.salesMix };
    })
    .filter(Boolean);
  if (productsForCalc.length === 0) {
    Swal.fire(
      'ข้อมูลไม่ครบถ้วน',
      'กรุณาเลือกสินค้าและใส่สัดส่วนการขาย',
      'warning'
    );
    return;
  }
  const tempGroup = { name: groupNameToUse, products: productsForCalc };
  await calculateBreakEven(tempGroup);
  await nextTick();
  resultsSection.value?.scrollIntoView({ behavior: 'smooth' });
}

async function calculateBreakEven(group) {
  calculationResult.value = null;
  if (!group || !group.products) return;

  const productsForCalc = group.products
    .map((p) => {
      const info = allProducts.value.find((prod) => prod.id === p.productId);
      return { ...info, ...p };
    })
    .filter((p) => p.id && p.salesMix && p.price);
  if (productsForCalc.length === 0) {
    Swal.fire(
      'ข้อมูลไม่ครบถ้วน',
      'กรุณาเลือกสินค้า, ใส่สัดส่วน และราคาขายให้ครบ',
      'warning'
    );
    return;
  }

  let totalMixRatio = 0;
  let totalWeightedCm = 0;
  let totalWeightedPrice = 0;
  const productDetails = [];
  for (const product of productsForCalc) {
    const recipe = allRecipes.value.find((r) => r.id === product.recipeId);
    if (!recipe) continue;
    const flatIngredients = await expandRecipe(recipe, 1);
    const totalRecipeWeight =
      recipe.ingredientsList.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ) || 1;
    const costPerGram =
      flatIngredients.reduce((sum, ing) => sum + ing.totalCost, 0) /
      totalRecipeWeight;
    const variableCost = costPerGram * Number(product.weight);
    const sellingPrice = Number(product.price);
    const contributionMargin = sellingPrice - variableCost;
    const mixRatio = Number(product.salesMix);
    totalMixRatio += mixRatio;
    totalWeightedCm += contributionMargin * mixRatio;
    totalWeightedPrice += sellingPrice * mixRatio;
    productDetails.push({
      name: product.name,
      variableCost,
      sellingPrice,
      contributionMargin,
      salesMix: mixRatio,
      productId: product.id,
    });
  }

  if (totalMixRatio === 0 || totalWeightedCm <= 0) {
    Swal.fire(
      'คำนวณไม่ได้',
      'ข้อมูลไม่ถูกต้อง หรือกำไรส่วนเกินติดลบ',
      'warning'
    );
    return;
  }

  const weightedAverageCm = totalWeightedCm / totalMixRatio;
  const weightedAveragePrice = totalWeightedPrice / totalMixRatio;
  const breakEvenPointTotalUnits =
    Number(fixedCosts.value || 0) / weightedAverageCm;
  const breakEvenPointRevenue = breakEvenPointTotalUnits * weightedAveragePrice;
  const breakEvenUnitsByProduct = productDetails.map((p) => {
    const units = breakEvenPointTotalUnits * (p.salesMix / totalMixRatio);
    return { name: p.name, units: Math.ceil(units) };
  });
  const projections = [];
  const baseUnits = Math.ceil(breakEvenPointTotalUnits);
  for (let i = 0; i <= 5; i++) {
    const projectedUnits = baseUnits + 50 * i;
    const projectedRevenue = projectedUnits * weightedAveragePrice;
    const projectedProfit =
      projectedUnits * weightedAverageCm - Number(fixedCosts.value || 0);
    projections.push({
      units: projectedUnits,
      revenue: projectedRevenue,
      profit: projectedProfit,
    });
  }

  calculationResult.value = {
    groupName: group.name,
    productDetails,
    weightedAverageCm,
    totalMixRatio,
    breakEvenPointUnits: Math.ceil(breakEvenPointTotalUnits),
    breakEvenPointRevenue,
    breakEvenUnitsByProduct,
    projections,
  };

  await nextTick();
  resultsSection.value?.scrollIntoView({ behavior: 'smooth' });
}

async function expandRecipe(recipe, scalingFactor) {
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

function toggleProjectionDetails(index) {
  if (expandedProjectionIndex.value === index) {
    expandedProjectionIndex.value = null;
  } else {
    expandedProjectionIndex.value = index;
  }
}

// **FIX:** Renamed functions for consistency
function openAddGroupModal() {
  editingGroup.value = {
    name: '',
    products: [{ productId: null, salesMix: null }],
  };
  isGroupModalOpen.value = true;
}
function openEditGroupModal(group) {
  editingGroup.value = { ...JSON.parse(JSON.stringify(group)) };
  isGroupModalOpen.value = true;
}
function closeGroupModal() {
  isGroupModalOpen.value = false;
  editingGroup.value = null;
}
async function handleGroupSave(groupData) {
  const plainData = {
    ...JSON.parse(JSON.stringify(groupData)),
    groupType: GROUP_TYPE,
  };
  if (plainData.id) {
    await db.analysisGroups.update(plainData.id, plainData);
  } else {
    await db.analysisGroups.add(plainData);
  }
  closeGroupModal();
  await fetchData();
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: 'บันทึกกลุ่มสำเร็จ',
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
</script>

<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">คำนวณหาจุดคุ้มทุน</h1>

    <div v-if="isLoadingData" class="py-10 text-center">
      <p>กำลังโหลดข้อมูล...</p>
    </div>
    <div v-else>
      <div class="mb-6 rounded-lg bg-white p-6 shadow-md">
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
              class="rounded-lg bg-gray-50 p-3"
            >
              <div class="flex items-end space-x-2">
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
                <div class="w-32 flex-shrink-0">
                  <label class="block text-xs font-medium text-gray-600"
                    >สัดส่วนการขาย</label
                  >
                  <input
                    v-model.number="item.salesMix"
                    type="number"
                    placeholder="สัดส่วน"
                    class="mt-1 w-full rounded-md border p-2"
                  />
                </div>
                <button
                  @click="removeLiveProductRow(index)"
                  type="button"
                  class="flex h-10 w-10 flex-shrink-0 items-center justify-center text-red-500"
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
              บันทึกเป็นกลุ่มใหม่
            </button>
            <button
              @click="calculateFromLive"
              class="rounded-lg bg-primary px-4 py-2 text-white"
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
            @click="openAddGroupModal"
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
                  @click="openEditGroupModal(group)"
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
        class="mt-6 space-y-6 rounded-lg bg-white p-6 shadow-md"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold">
            ผลการคำนวณสำหรับ:
            <span class="text-primary">{{ calculationResult.groupName }}</span>
          </h2>
          <button
            @click="isStepsModalOpen = true"
            class="text-blue-500 hover:text-blue-700"
          >
            <font-awesome-icon icon="circle-info" />
            <span class="ml-1 text-sm">ดูขั้นตอนการคำนวณ</span>
          </button>
        </div>
        <div>
          <h3 class="mb-2 font-semibold">รายละเอียดต้นทุนและกำไรต่อหน่วย</h3>
          <table class="min-w-full border text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-3 py-2 text-left">สินค้า</th>
                <th class="px-3 py-2 text-right">ราคาขาย</th>
                <th class="px-3 py-2 text-right">ต้นทุนผันแปร</th>
                <th class="px-3 py-2 text-right">กำไรส่วนเกิน</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in calculationResult.productDetails"
                :key="p.productId"
                class="border-b"
              >
                <td class="px-3 py-2">{{ p.name }}</td>
                <td class="px-3 py-2 text-right">
                  {{ p.sellingPrice.toFixed(2) }}
                </td>
                <td class="px-3 py-2 text-right text-red-500">
                  {{ p.variableCost.toFixed(2) }}
                </td>
                <td class="px-3 py-2 text-right text-green-600">
                  {{ p.contributionMargin.toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="grid grid-cols-1 gap-4 text-center md:grid-cols-2">
          <div class="rounded-lg bg-green-100 p-4">
            <p class="text-sm text-gray-600">ต้องขายทั้งหมด</p>
            <p class="text-3xl font-bold text-green-700">
              {{ calculationResult.breakEvenPointUnits.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-600">หน่วยผสม (Mixed Units)</p>
          </div>
          <div class="rounded-lg bg-blue-100 p-4">
            <p class="text-sm text-gray-600">คิดเป็นยอดขาย</p>
            <p class="text-3xl font-bold text-blue-700">
              {{
                calculationResult.breakEvenPointRevenue.toLocaleString(
                  'en-US',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )
              }}
            </p>
            <p class="text-sm text-gray-600">บาท ถึงจะคุ้มทุน</p>
          </div>
        </div>
        <h3 class="mb-2 font-semibold">จำนวนที่ต้องขาย (โดยประมาณ)</h3>
        <ul class="list-inside list-disc">
          <li
            v-for="product in calculationResult.breakEvenUnitsByProduct"
            :key="product.name"
          >
            {{ product.name }}: {{ product.units.toLocaleString() }} ชิ้น
          </li>
        </ul>
        <h3 class="mb-2 font-semibold">ตารางคาดการณ์กำไร</h3>
        <table class="min-w-full border">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-right">จำนวนขายรวม (หน่วยผสม)</th>
              <th class="px-4 py-2 text-right">ยอดขาย (บาท)</th>
              <th class="px-4 py-2 text-right">กำไร/ขาดทุน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="(proj, index) in calculationResult.projections"
              :key="index"
            >
              <tr
                @click="toggleProjectionDetails(index)"
                class="cursor-pointer border-b hover:bg-gray-100"
              >
                <td class="px-4 py-2 text-right">
                  {{ proj.units.toLocaleString() }}
                </td>
                <td class="px-4 py-2 text-right">
                  {{
                    proj.revenue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </td>
                <td
                  class="px-4 py-2 text-right"
                  :class="proj.profit < 0 ? 'text-red-500' : 'text-green-600'"
                >
                  {{
                    proj.profit.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </td>
              </tr>
              <tr v-if="expandedProjectionIndex === index">
                <td colspan="3" class="bg-gray-50 p-4">
                  <p class="mb-2 text-sm font-semibold">
                    รายละเอียดจำนวนขายโดยประมาณ:
                  </p>
                  <ul class="list-inside list-disc space-y-1 text-sm">
                    <li v-for="item in projectionDetails" :key="item.name">
                      {{ item.name }}:
                      <span class="font-bold">{{
                        item.units.toLocaleString()
                      }}</span>
                      ชิ้น
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <BaseModal v-if="isGroupModalOpen" @close="closeGroupModal" size="large">
        <BreakEvenAnalysisForm
          :initial-data="editingGroup"
          :available-products="allProducts"
          @save="handleGroupSave"
          @cancel="closeGroupModal"
        />
      </BaseModal>
      <BaseModal
        v-if="isStepsModalOpen"
        @close="isStepsModalOpen = false"
        size="large"
      >
        <div v-if="calculationResult" class="p-6">
          <h3 class="mb-4 text-2xl font-semibold">ขั้นตอนการคำนวณจุดคุ้มทุน</h3>
          <div class="space-y-4 text-sm">
            <div>
              <p class="font-semibold">
                1. หากำไรส่วนเกิน (Contribution Margin) ต่อหน่วย
              </p>
              <ul class="mt-1 list-inside list-disc pl-4">
                <li
                  v-for="p in calculationResult.productDetails"
                  :key="p.productId"
                >
                  {{ p.name }}: {{ p.sellingPrice.toFixed(2) }} -
                  {{ p.variableCost.toFixed(2) }} =
                  <span class="font-semibold">{{
                    p.contributionMargin.toFixed(2)
                  }}</span>
                  บาท
                </li>
              </ul>
            </div>
            <div>
              <p class="font-semibold">
                2. หากำไรส่วนเกินถัวเฉลี่ย (Weighted Avg. CM)
              </p>
              <p class="mt-1">
                คำนวณได้:
                <span class="font-semibold">{{
                  calculationResult.weightedAverageCm.toFixed(2)
                }}</span>
                บาท/หน่วย
              </p>
            </div>
            <div>
              <p class="font-semibold">3. หาจุดคุ้มทุน (หน่วยผสม)</p>
              <p class="mt-1">
                {{ Number(fixedCosts).toLocaleString() }} /
                {{ calculationResult.weightedAverageCm.toFixed(2) }} =
                <span class="font-semibold">{{
                  calculationResult.breakEvenPointUnits.toLocaleString()
                }}</span>
                หน่วย
              </p>
            </div>
            <div>
              <p class="font-semibold">4. สรุปยอดขาย ณ จุดคุ้มทุน</p>
              <p class="mt-1">
                รวมเป็นยอดขาย
                <span class="font-semibold">{{
                  calculationResult.breakEvenPointRevenue.toLocaleString(
                    'en-US',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )
                }}</span>
                บาท
              </p>
            </div>
          </div>
          <div class="mt-6 text-right">
            <button
              @click="isStepsModalOpen = false"
              class="rounded-md bg-primary px-4 py-2 text-white"
            >
              ปิด
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  </div>
</template>
