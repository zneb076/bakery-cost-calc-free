<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import OverheadAnalysisForm from '../components/forms/OverheadAnalysisForm.vue';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const GROUP_TYPE = 'overhead';

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
    products: [{ productId: null, monthlySales: null }],
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

async function calculateOverhead(group) {
  calculationResult.value = null;
  if (!group) return;

  const productDetails = [];
  let totalMonthlyVariableCost = 0;
  try {
    for (const product of group.products) {
      const productInfo = allProducts.value.find(
        (p) => p.id === product.productId
      );
      const recipe = allRecipes.value.find(
        (r) => r.id === productInfo?.recipeId
      );
      if (!recipe || !productInfo || !product.monthlySales) continue;

      const totalRecipeWeight =
        recipe.ingredientsList.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ) || 1;
      const flatIngredients = await expandRecipe(recipe, 1);
      const variableCostPerGram =
        flatIngredients.reduce((sum, ing) => sum + ing.totalCost, 0) /
        totalRecipeWeight;
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
        costRatio,
        monthlySales: p.monthlySales,
        productId: p.productId,
        monthlyVariableCost: p.monthlyVariableCost,
      };
    });

    calculationResult.value = {
      groupName: group.name,
      results,
      totalMonthlyVariableCost,
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
    <h1 class="mb-6 text-2xl font-bold">คำนวณต้นทุนแฝงต่อชิ้น</h1>
    <div class="rounded-lg bg-white p-4 shadow-md">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold">กลุ่มสินค้าสำหรับหาต้นทุนแฝง</h2>
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
            <td class="space-x-2 py-2 text-right">
              <button
                @click="calculateOverhead(group)"
                class="rounded bg-green-500 px-3 py-1 text-xs text-white"
              >
                คำนวน</button
              ><br />
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
    <div class="mt-4 rounded-lg bg-green-50 p-4 shadow-md">
      <div>
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
      class="mb-8 mt-6 rounded-lg bg-white p-4 shadow-md"
    >
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

      <table class="min-w-full border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-1 py-2 text-left">ชื่อสินค้า</th>
            <th class="px-1 py-2 text-right">ต้นทุนวัตถุดิบ/ชิ้น</th>
            <th class="px-1 py-2 text-right">ต้นทุนแฝง/ชิ้น</th>
            <th class="px-1 py-2 text-right">ต้นทุนจริง/ชิ้น</th>
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

    <BaseModal
      v-if="isStepsModalOpen"
      @close="isStepsModalOpen = false"
      size="large"
    >
      <div v-if="calculationResult" class="p-6">
        <h3 class="mb-4 text-2xl font-semibold">ขั้นตอนการคำนวณต้นทุนแฝง</h3>
        <div class="space-y-4 text-sm">
          <div>
            <p class="font-semibold">
              1. หาต้นทุนวัตถุดิบรวมของแต่ละชนิด (ต่อเดือน)
            </p>
            <ul class="mt-1 list-inside list-disc pl-4">
              <li v-for="p in calculationResult.results" :key="p.productId">
                {{ p.name }}: {{ p.variableCostPerUnit.toFixed(2) }} x
                {{ p.monthlySales }} ชิ้น =
                {{ p.monthlyVariableCost.toFixed(2) }} บาท
              </li>
            </ul>
          </div>
          <div>
            <p class="font-semibold">2. หา "สัดส่วนต้นทุน" ของแต่ละชนิด</p>
            <p class="text-xs text-gray-500">
              (ต้นทุนรวมของชนิดนั้น / ต้นทุนรวมทั้งหมด)
            </p>
            <ul class="mt-1 list-inside list-disc pl-4">
              <li v-for="p in calculationResult.results" :key="p.productId">
                {{ p.name }}: {{ p.monthlyVariableCost.toFixed(2) }} /
                {{ calculationResult.totalMonthlyVariableCost.toFixed(2) }} =
                {{ (p.costRatio * 100).toFixed(2) }}%
              </li>
            </ul>
          </div>
          <div>
            <p class="font-semibold">
              3. ปันส่วนต้นทุนคงที่ และหาต้นทุนแฝงต่อชิ้น
            </p>
            <ul class="mt-1 list-inside list-disc pl-4">
              <li v-for="p in calculationResult.results" :key="p.productId">
                {{ p.name }}: ({{ Number(fixedCosts).toLocaleString() }} x
                {{ (p.costRatio * 100).toFixed(2) }}%) /
                {{ p.monthlySales }} ชิ้น =
                <span class="font-semibold">{{
                  p.overheadPerUnit.toFixed(2)
                }}</span>
                บาท/ชิ้น
              </li>
            </ul>
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
