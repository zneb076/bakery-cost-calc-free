<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../services/db.js';
import BaseModal from '../components/BaseModal.vue';
import OverheadAnalysisForm from '../components/forms/OverheadAnalysisForm.vue';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const GROUP_TYPE = 'overhead';

const analysisGroups = ref([]);
const availableRecipes = ref([]);
const allIngredients = ref([]);
const allSubRecipes = ref([]);
const fixedCosts = ref(10000);

const calculationResult = ref(null);
const isGroupModalOpen = ref(false);
const editingGroup = ref(null);

async function fetchData() {
  const [groups, recipes, ingredients] = await Promise.all([
    db.analysisGroups.where('groupType').equals(GROUP_TYPE).toArray(),
    db.recipes.toArray(),
    db.ingredients.toArray(),
  ]);
  analysisGroups.value = groups;
  availableRecipes.value = recipes.filter((r) => !r.isSubRecipe);
  allSubRecipes.value = recipes.filter((r) => r.isSubRecipe);
  allIngredients.value = ingredients;
}
onMounted(fetchData);

function openAddModal() {
  editingGroup.value = {
    name: '',
    recipes: [{ recipeId: null, monthlySales: null }],
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
  if (!group) {
    return;
  }

  const productDetails = [];
  let totalMonthlyVariableCost = 0;

  for (const product of group.recipes) {
    const recipe = availableRecipes.value.find(
      (r) => r.id === product.recipeId
    );
    if (!recipe || !product.monthlySales) continue;

    const flatIngredients = await expandRecipe(recipe, 1);
    const variableCostPerUnit = flatIngredients.reduce(
      (sum, ing) => sum + ing.totalCost,
      0
    );
    const monthlyVariableCost =
      variableCostPerUnit * Number(product.monthlySales);

    totalMonthlyVariableCost += monthlyVariableCost;
    productDetails.push({
      ...product,
      name: recipe.name,
      variableCostPerUnit,
      monthlyVariableCost,
    });
  }

  const results = productDetails.map((p) => {
    const costRatio = p.monthlyVariableCost / totalMonthlyVariableCost;
    const allocatedFixedCost = Number(fixedCosts.value || 0) * costRatio;
    const overheadPerUnit = allocatedFixedCost / Number(p.monthlySales);
    const trueCostPerUnit = p.variableCostPerUnit + overheadPerUnit;
    return { ...p, allocatedFixedCost, overheadPerUnit, trueCostPerUnit };
  });

  calculationResult.value = { groupName: group.name, results };
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
        let appliedWholeUnit = false;

        if (
          item.costByWholeUnit &&
          baseIngredient.purchaseUnit.toLowerCase() !== 'กรัม'
        ) {
          appliedWholeUnit = true;
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
          const existing = ingredientMap.get(baseIngredient.id);
          existing.totalNetQuantity += netQuantity;
          existing.totalCost += cost;
          if (appliedWholeUnit) existing.appliedWholeUnit = true;
          if (yieldFactor < 1) existing.appliedYield = true;
        } else {
          ingredientMap.set(baseIngredient.id, {
            id: baseIngredient.id,
            name: baseIngredient.name,
            totalNetQuantity: netQuantity,
            totalCost: cost,
            appliedYield: yieldFactor < 1,
            appliedWholeUnit: appliedWholeUnit,
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
            const existing = ingredientMap.get(subItem.id);
            existing.totalNetQuantity += subItem.totalNetQuantity;
            existing.totalCost += subItem.totalCost;
            if (subItem.appliedWholeUnit) existing.appliedWholeUnit = true;
            if (subItem.appliedYield) existing.appliedYield = true;
          } else {
            ingredientMap.set(subItem.id, subItem);
          }
        });
      }
    }
  }
  return Array.from(ingredientMap.values());
}

function getRecipeName(recipeId) {
  return availableRecipes.value.find((r) => r.id === recipeId)?.name || 'N/A';
}
</script>

<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">คำนวณต้นทุนแฝงต่อชิ้น</h1>
    <div class="rounded-lg bg-white p-6 shadow-md">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold">กลุ่มวิเคราะห์สำหรับหาต้นทุนแฝง</h2>
        <button
          @click="openAddModal"
          class="rounded-lg bg-primary px-4 py-2 font-bold text-white"
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
                  group.recipes.map((r) => getRecipeName(r.recipeId)).join(', ')
                }}
              </p>
            </td>
            <td class="space-x-2 py-2 text-right">
              <button
                @click="calculateOverhead(group)"
                class="rounded bg-green-500 px-3 py-1 text-white"
              >
                เลือกใช้
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
      v-if="calculationResult"
      class="mt-6 rounded-lg bg-white p-6 shadow-md"
    >
      <h2 class="mb-4 text-2xl font-semibold">
        ผลการคำนวณสำหรับกลุ่ม:
        <span class="text-primary">{{ calculationResult.groupName }}</span>
      </h2>
      <table class="min-w-full border text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-3 py-2 text-left">ชื่อขนม</th>
            <th class="px-3 py-2 text-right">ต้นทุนวัตถุดิบ/ชิ้น</th>
            <th class="px-3 py-2 text-right">ต้นทุนแฝง/ชิ้น</th>
            <th class="px-3 py-2 text-right">ต้นทุนจริง/ชิ้น</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in calculationResult.results"
            :key="p.recipeId"
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
        :available-recipes="availableRecipes"
        @save="handleSave"
        @cancel="closeModal"
      />
    </BaseModal>
  </div>
</template>
