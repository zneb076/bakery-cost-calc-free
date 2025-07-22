<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { db } from '../services/db.js';
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

async function fetchData() {
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
}
onMounted(fetchData);

function openAddModal() {
  editingGroup.value = {
    name: '',
    products: [{ productId: null, salesMix: null }],
  };
  isGroupModalOpen.value = true;
}

function openEditModal(group) {
  editingGroup.value = group;
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

async function calculateBreakEven(group) {
  calculationResult.value = null;
  if (!group) return;

  let totalMixRatio = 0;
  let totalWeightedCm = 0;
  const productDetails = [];
  try {
    for (const product of group.products) {
      const productInfo = allProducts.value.find(
        (p) => p.id === product.productId
      );
      const recipe = allRecipes.value.find(
        (r) => r.id === productInfo?.recipeId
      );
      if (!recipe || !productInfo) continue;

      const totalRecipeWeight =
        recipe.ingredientsList.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ) || 1;
      const flatIngredients = await expandRecipe(recipe, 1);
      const variableCostPerGram =
        flatIngredients.reduce((sum, ing) => sum + ing.totalCost, 0) /
        totalRecipeWeight;
      const variableCost = variableCostPerGram * Number(productInfo.weight);

      const sellingPrice = Number(productInfo.price);
      const contributionMargin = sellingPrice - variableCost;
      const mixRatio = Number(product.salesMix);

      totalMixRatio += mixRatio;
      totalWeightedCm += contributionMargin * mixRatio;
      productDetails.push({
        ...product,
        name: productInfo.name,
        variableCost,
        sellingPrice,
        contributionMargin,
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
    const breakEvenPointTotalUnits =
      Number(fixedCosts.value || 0) / weightedAverageCm;

    let breakEvenPointRevenue = 0;
    const breakEvenUnitsByProduct = productDetails.map((p) => {
      const units = breakEvenPointTotalUnits * (p.salesMix / totalMixRatio);
      breakEvenPointRevenue += units * p.sellingPrice;
      return { name: p.name, units: Math.ceil(units) };
    });

    const projections = [];
    const baseRevenue =
      breakEvenPointRevenue > 0 ? breakEvenPointRevenue : 10000;
    for (let i = 1; i <= 5; i++) {
      const projectedRevenue = baseRevenue + baseRevenue * 0.1 * i;
      const projectedUnits =
        breakEvenPointRevenue > 0
          ? breakEvenPointTotalUnits *
            (projectedRevenue / breakEvenPointRevenue)
          : 0;
      const projectedProfit =
        projectedUnits * weightedAverageCm - Number(fixedCosts.value || 0);
      projections.push({ revenue: projectedRevenue, profit: projectedProfit });
    }

    calculationResult.value = {
      groupName: group.name,
      productDetails,
      weightedAverageCm,
      breakEvenPointUnits: Math.ceil(breakEvenPointTotalUnits),
      breakEvenPointRevenue,
      breakEvenUnitsByProduct,
      projections,
    };
    await nextTick();
    resultsSection.value?.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Calculation Error:', error);
  }
}

async function expandRecipe(recipe, scalingFactor) {
  const ingredientMap = new Map();
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
    <h1 class="mb-6 text-3xl font-bold">คำนวณหาจุดคุ้มทุน</h1>
    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold">กลุ่มสินค้าสำหรับหาจุดคุ้มทุน</h2>
      </div>
      <div class="text-right">
        <button
          @click="openAddModal"
          class="mb-3 rounded-lg bg-primary px-4 py-2 text-sm text-white"
        >
          + สร้างกลุ่มใหม่
        </button>
      </div>
      <table class="mb-6 min-w-full">
        <tbody>
          <tr v-if="analysisGroups.length === 0">
            <td class="py-4 text-center text-gray-500">ยังไม่มีกลุ่ม...</td>
          </tr>
          <tr v-for="group in analysisGroups" :key="group.id" class="border-b">
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
            <td class="w-24 space-x-2 py-2 text-right">
              <button
                @click="calculateBreakEven(group)"
                class="rounded bg-green-500 px-3 py-1 text-sm text-white"
              >
                เลือกใช้
              </button>
              <br />
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
      <div class="border-t pt-4">
        <label class="block text-sm font-medium"
          >ต้นทุนคงที่ทั้งหมด/เดือน (บาท)</label
        >
        <input
          v-model.number="fixedCosts"
          type="number"
          class="mt-1 w-full rounded-md border p-2 md:w-1/2"
        />
      </div>
    </div>

    <div
      ref="resultsSection"
      v-if="calculationResult"
      class="mb-8 mt-6 space-y-6 rounded-lg bg-white p-6 shadow-md"
    >
      <div class="items-center justify-between">
        <h2 class="text-2xl font-semibold">
          ผลการคำนวณ
          <div class="text-xl text-primary">
            กลุ่มสินค้า: {{ calculationResult.groupName }}
          </div>
        </h2>
        <button
          @click="isStepsModalOpen = true"
          class="my-4 text-blue-500 hover:text-blue-700"
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
              <th class="px-3 py-2 text-left">ชื่อสินค้า</th>
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
              <td class="px-3 py-2 text-right font-mono">
                {{ p.sellingPrice.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-red-500">
                {{ p.variableCost.toFixed(2) }}
              </td>
              <td class="px-3 py-2 text-right font-mono text-green-600">
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
              calculationResult.breakEvenPointRevenue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
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
            <th class="px-4 py-2 text-right">ยอดขาย (บาท)</th>
            <th class="px-4 py-2 text-right">กำไร/ขาดทุน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="proj in calculationResult.projections"
            :key="proj.revenue"
            class="border-b"
          >
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
        </tbody>
      </table>
    </div>

    <BaseModal v-if="isGroupModalOpen" @close="closeModal" size="large">
      <BreakEvenAnalysisForm
        :initial-data="editingGroup"
        :available-products="allProducts"
        @save="handleSave"
        @cancel="closeModal"
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
              <span class="font-mono font-semibold">{{
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
              <span class="font-mono font-semibold">{{
                calculationResult.breakEvenPointUnits.toLocaleString()
              }}</span>
              หน่วย
            </p>
          </div>
          <div>
            <p class="font-semibold">4. สรุปยอดขาย ณ จุดคุ้มทุน</p>
            <p class="mt-1">
              รวมเป็นยอดขาย
              <span class="font-mono font-semibold">{{
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
</template>
