<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { db } from '../services/db.js';
import { useRoute } from 'vue-router';
import ProductRecipeAutocomplete from '../components/ProductRecipeAutocomplete.vue';
import BaseModal from '../components/BaseModal.vue';
import Swal from 'sweetalert2';

const resultsSection = ref(null);
const route = useRoute();
const allProducts = ref([]);
const allRecipes = ref([]);
const allIngredients = ref([]);
const allSubRecipes = ref([]);

const selectedItemName = ref('');
const selectedItemId = ref(null);
const selectedItemInfo = ref(null);

const productionQuantity = ref(30);
const weightPerPiece = ref(50);
const laborCostPerHour = ref(50);
const workHours = ref(4);
const overheadPercent = ref(30);
const finalSellingPricePerPiece = ref(0);
const defaultProfitMargin = ref(50);

const calculationResult = ref(null);
const isLoading = ref(false);
const isSubRecipeModalOpen = ref(false);
const subRecipeToShow = ref(null);
const isLoadingData = ref(true);

async function fetchData() {
  try {
    isLoadingData.value = true;
    const [products, recipes, ingredients, settings] = await Promise.all([
      db.products.toArray(),
      db.recipes.toArray(),
      db.ingredients.toArray(),
      db.settings.toArray(),
    ]);

    allProducts.value = products;
    allRecipes.value = recipes;
    allSubRecipes.value = recipes.filter((r) => r.isSubRecipe);
    allIngredients.value = ingredients;

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));
    laborCostPerHour.value = settingsMap.get('laborCostPerHour') || 50;
    workHours.value = settingsMap.get('workHours') || 2;
    overheadPercent.value = settingsMap.get('overheadPercent') || 15;
    defaultProfitMargin.value = settingsMap.get('defaultProfitMargin') || 50;
  } catch (e) {
    console.error('Fetch Data Error:', e);
  } finally {
    isLoadingData.value = false;
  }
}

onMounted(async () => {
  await fetchData();
  if (route.query.recipeId) {
    const id = Number(route.query.recipeId);
    const recipe = allRecipes.value.find((r) => r.id === id);
    if (recipe) {
      // ตั้งค่าทั้ง ID และชื่อที่แสดงผล
      selectedItemId.value = `recipe-${id}`;
      selectedItemName.value = `สูตร: ${recipe.name}`;
    }
  }
  if (route.query.productId) {
    const id = Number(route.query.productId);
    const product = allProducts.value.find((p) => p.id === id);
    if (product) {
      selectedItemName.value = product.name;
      selectedItemId.value = `product-${id}`;
    }
  }
});

const selectionOptions = computed(() => {
  return [
    {
      label: 'สินค้า',
      options: allProducts.value.map((p) => ({
        value: `product-${p.id}`,
        label: `${p.name} (${p.weight}g) (${p.price}บาท)`, // Add prefix here
      })),
    },
    {
      label: 'สูตร',
      options: allRecipes.value
        .filter((r) => !r.isSubRecipe)
        .map((r) => ({
          value: `recipe-${r.id}`,
          label: r.name, // Add prefix here
        })),
    },
  ];
});

watch(selectedItemId, (newValue) => {
  calculationResult.value = null;
  if (!newValue) {
    selectedItemInfo.value = null;
    selectedItemName.value = '';
    return;
  }
  const [type, id] = newValue.split('-');
  if (type === 'product') {
    const product = allProducts.value.find((p) => p.id === Number(id));
    if (product) {
      selectedItemInfo.value = { type: 'product', data: product };
      weightPerPiece.value = product.weight;
      finalSellingPricePerPiece.value = product.price;
      selectedItemName.value = `สินค้า: ${product.name}`;
    }
  } else {
    const recipe = allRecipes.value.find((r) => r.id === Number(id));
    if (recipe) {
      selectedItemInfo.value = { type: 'recipe', data: recipe };
      // weightPerPiece.value = recipe.ingredientsList.reduce(
      //   (sum, item) => sum + Number(item.quantity || 0),
      //   0
      // );
      finalSellingPricePerPiece.value = 0;
      selectedItemName.value = `สูตร: ${recipe.name}`;
    }
  }
});

watch([productionQuantity, weightPerPiece], () => {
  calculationResult.value = null;
});

async function calculateCost() {
  if (!selectedItemInfo.value) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดเลือกรายการ',
      text: 'กรุณาเลือกสินค้าหรือสูตรที่ต้องการคำนวณ',
    });
    return;
  }
  isLoading.value = true;
  calculationResult.value = null;

  try {
    const recipeId =
      selectedItemInfo.value.type === 'product'
        ? selectedItemInfo.value.data.recipeId
        : selectedItemInfo.value.data.id;
    const mainRecipe = allRecipes.value.find((r) => r.id === recipeId);

    if (!mainRecipe || !mainRecipe.ingredientsList) {
      Swal.fire(
        'เกิดข้อผิดพลาด',
        'ไม่พบสูตรที่เชื่อมโยงกับรายการที่เลือก',
        'error'
      );
      isLoading.value = false;
      return;
    }

    const totalWeightNeeded =
      Number(productionQuantity.value || 0) * Number(weightPerPiece.value || 0);
    let totalRecipeWeight =
      mainRecipe.ingredientsList.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      ) || 1;
    const scalingFactor = totalWeightNeeded / totalRecipeWeight;

    const flatIngredientList = await expandRecipe(mainRecipe, scalingFactor);

    const foodCost = flatIngredientList.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );

    const costBreakdown = flatIngredientList.map((item) => ({
      name: item.name,
      quantity: item.totalNetQuantity,
      cost: item.totalCost,
      appliedYield: item.appliedYield,
      appliedWholeUnit: item.appliedWholeUnit,
      isSubRecipe: item.isSubRecipe,
      id: item.id,
    }));

    if (foodCost <= 0 && costBreakdown.length > 0) {
      Swal.fire('คำนวณไม่ได้', 'ต้นทุนรวมเป็นศูนย์', 'warning');
      isLoading.value = false;
      return;
    }

    calculationResult.value = {
      foodCost,
      costBreakdown,
      recipeName: mainRecipe.name,
      totalWeight: totalWeightNeeded,
    };
    await nextTick();
    resultsSection.value?.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Calculation Error:', error);
    Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถคำนวณต้นทุนได้', 'error');
  } finally {
    isLoading.value = false;
  }
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
            isSubRecipe: false,
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
        const subRecipeScalingFactor = netQuantity / subRecipeTotalWeight;
        const subIngredients = await expandRecipe(
          subRecipe,
          subRecipeScalingFactor
        );
        if (ingredientMap.has(`sub-${subRecipe.id}`)) {
          const existing = ingredientMap.get(`sub-${subRecipe.id}`);
          existing.totalNetQuantity += netQuantity;
          existing.totalCost += subIngredients.reduce(
            (sum, si) => sum + si.totalCost,
            0
          );
        } else {
          ingredientMap.set(`sub-${subRecipe.id}`, {
            id: subRecipe.id,
            name: subRecipe.name,
            totalNetQuantity: netQuantity,
            totalCost: subIngredients.reduce(
              (sum, si) => sum + si.totalCost,
              0
            ),
            appliedYield: false,
            appliedWholeUnit: false,
            isSubRecipe: true,
          });
        }
      }
    }
  }
  return Array.from(ingredientMap.values());
}

async function showSubRecipeDetails(subRecipeId, scaledQuantity) {
  const subRecipe = allSubRecipes.value.find((r) => r.id === subRecipeId);
  if (subRecipe) {
    const flatIngredients = await expandRecipe(
      subRecipe,
      scaledQuantity /
        (subRecipe.ingredientsList.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        ) || 1)
    );
    subRecipeToShow.value = {
      name: subRecipe.name,
      breakdown: flatIngredients.map((item) => ({
        name: item.name,
        quantity: item.totalNetQuantity,
      })),
    };
    isSubRecipeModalOpen.value = true;
  }
}

const isYieldApplied = computed(() => {
  return calculationResult.value?.costBreakdown.some(
    (item) => item.appliedYield
  );
});
const isWholeUnitCostApplied = computed(() => {
  return calculationResult.value?.costBreakdown.some(
    (item) => item.appliedWholeUnit
  );
});
const totalLaborCost = computed(
  () => Number(laborCostPerHour.value || 0) * Number(workHours.value || 0)
);
const totalOverheadCost = computed(() => {
  if (!calculationResult.value) return 0;
  return (
    calculationResult.value.foodCost *
    (Number(overheadPercent.value || 0) / 100)
  );
});
const totalCostWithOverhead = computed(() => {
  if (!calculationResult.value) return 0;
  return (
    calculationResult.value.foodCost +
    totalLaborCost.value +
    totalOverheadCost.value
  );
});
const costPerPiece = computed(() => {
  if (!productionQuantity.value || !totalCostWithOverhead.value) return 0;
  return totalCostWithOverhead.value / Number(productionQuantity.value || 1);
});
const suggestedSellingPricePerPiece = computed(() => {
  return (
    costPerPiece.value * (1 + Number(defaultProfitMargin.value || 0) / 100)
  );
});
watch(
  suggestedSellingPricePerPiece,
  (newValue) => {
    if (selectedItemInfo.value?.type !== 'product') {
      finalSellingPricePerPiece.value = parseFloat(newValue.toFixed(2));
    }
  },
  { immediate: true }
);
const totalRevenue = computed(
  () => finalSellingPricePerPiece.value * Number(productionQuantity.value || 0)
);
const totalProfit = computed(() => {
  if (!calculationResult.value) return 0;
  return totalRevenue.value - totalCostWithOverhead.value;
});
const profitPerPiece = computed(() => {
  if (!productionQuantity.value) return 0;
  return totalProfit.value / Number(productionQuantity.value || 1);
});
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div v-if="isLoadingData" class="py-10 text-center">
      <p>กำลังโหลดข้อมูล...</p>
    </div>
    <div v-else>
      <div class="rounded-lg bg-white p-4 shadow-md">
        <h1 class="mb-6 text-3xl font-bold">คำนวณต้นทุน</h1>
        <div class="grid grid-cols-1 items-end gap-6 md:grid-cols-4">
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >เลือกสินค้าหรือสูตร</label
            >
            <ProductRecipeAutocomplete
              v-model="selectedItemName"
              :options="selectionOptions"
              @selection="selectedItemId = $event"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >จำนวนที่ต้องการผลิต (ชิ้น)</label
            >
            <input
              v-model.number="productionQuantity"
              type="number"
              class="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700"
              >น้ำหนักต่อชิ้น (กรัม)</label
            >
            <input
              v-model.number="weightPerPiece"
              :disabled="selectedItemInfo?.type === 'product'"
              type="number"
              class="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-200"
            />
          </div>
        </div>
        <div ref="resultsSection" class="mt-5 text-right">
          <button
            @click="calculateCost"
            :disabled="isLoading"
            class="rounded-lg bg-primary px-6 py-2 font-bold text-white transition-opacity hover:bg-opacity-90 disabled:opacity-50"
          >
            <span v-if="isLoading">กำลังคำนวณ...</span>
            <span v-else>คำนวณต้นทุน</span>
          </button>
        </div>
      </div>

      <div
        v-if="calculationResult"
        class="mt-5 rounded-lg bg-white p-4 shadow-md"
      >
        <h2 class="mb-4 text-xl font-semibold">
          ต้นทุนสำหรับ
          <span class="capitalize">{{
            selectedItemInfo.type === 'product' ? 'สินค้า' : 'สูตร'
          }}</span
          >:
          <span class="text-primary">{{ selectedItemInfo.data.name }}</span>
        </h2>
        <p class="mb-6 text-gray-600">
          สำหรับขนมจำนวน {{ productionQuantity }} ชิ้น, ขนาด
          {{ weightPerPiece }} กรัม/ชิ้น (น้ำหนักรวม
          {{
            calculationResult.totalWeight.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
          กรัม)
        </p>
        <div class="overflow-x-auto">
          <div
            v-if="isYieldApplied || isWholeUnitCostApplied"
            class="mb-2 flex items-center space-x-4 text-xs text-gray-500"
          >
            <span>*ต้นทุนรวมได้คำนวณตาม:</span>
            <div v-if="isYieldApplied" class="flex items-center space-x-1">
              <span class="h-2 w-2 rounded-full bg-yellow-400"></span>
              <span>Yield</span>
            </div>
            <div
              v-if="isWholeUnitCostApplied"
              class="flex items-center space-x-1"
            >
              <span class="h-2 w-2 rounded-full bg-orange-400"></span>
              <span>หน่วยเต็ม</span>
            </div>
          </div>
          <table class="min-w-full">
            <thead>
              <tr class="border-b-2 border-gray-300">
                <th
                  class="px-2 py-2 text-left text-sm font-semibold text-gray-700"
                >
                  วัตถุดิบ
                </th>
                <th
                  class="px-2 py-2 text-right text-sm font-semibold text-gray-700"
                >
                  ปริมาณ (กรัม)
                </th>
                <th
                  class="px-2 py-2 text-right text-sm font-semibold text-gray-700"
                >
                  ต้นทุน (บาท)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in calculationResult.costBreakdown"
                :key="item.name"
                class="border-b border-gray-200"
              >
                <td class="px-2 py-2">
                  <div class="flex items-center">
                    <span>{{ item.name }}</span>
                    <span
                      v-if="item.appliedYield"
                      title="มีการคำนวณ Yield"
                      class="ml-2 h-2 w-2 rounded-full bg-yellow-400"
                    ></span>
                    <span
                      v-if="item.appliedWholeUnit"
                      title="คิดต้นทุนเต็มหน่วย"
                      class="ml-2 h-2 w-2 rounded-full bg-orange-400"
                    ></span>
                    <button
                      v-if="item.isSubRecipe"
                      @click="showSubRecipeDetails(item.id, item.quantity)"
                      class="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <font-awesome-icon icon="circle-info" />
                    </button>
                  </div>
                </td>
                <td class="px-2 py-2 text-right">
                  {{
                    item.quantity.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </td>
                <td class="px-2 py-2 text-right">
                  {{
                    item.cost.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-gray-300">
                <td colspan="2" class="px-2 py-3 text-right text-lg font-bold">
                  ต้นทุนวัตถุดิบรวม
                </td>
                <td class="px-2 py-3 text-right text-lg font-bold text-primary">
                  {{
                    calculationResult.foodCost.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div
        v-if="calculationResult"
        class="mt-5 rounded-lg bg-white p-4 shadow-md"
      >
        <h3 class="mb-1 text-xl font-semibold text-secondary">
          ต้นทุนเพิ่มเติม
        </h3>
        <div class="mb-4 mt-4 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >ค่าแรง (บาท/ชม.)</label
              >
              <input
                v-model.number="laborCostPerHour"
                type="number"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >เวลาที่ใช้ (ชม.)</label
              >
              <input
                v-model.number="workHours"
                type="number"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >ต้นทุนแฝง (%)</label
              >
              <input
                v-model.number="overheadPercent"
                type="number"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div class="self-end pb-2 text-gray-600">% ของต้นทุนวัตถุดิบ</div>
          </div>
        </div>
      </div>

      <!-- สรุปต้นทุนและกำหนดราคาขาย -->
      <div
        v-if="calculationResult"
        class="mb-8 mt-5 rounded-lg bg-white p-4 shadow-md"
      >
        <div>
          <h3 class="mb-4 text-xl font-semibold">สรุปต้นทุนและกำหนดราคาขาย</h3>
          <div
            class="grid grid-cols-1 gap-6 md:grid-cols-1 md:px-36 lg:grid-cols-1 lg:px-48"
          >
            <div>
              <span class="text-xl font-bold text-primary"
                >ตั้งราคาขายต่อชิ้น
              </span>
              <input
                type="number"
                step="0.25"
                v-model.number="finalSellingPricePerPiece"
                class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-center text-3xl font-bold text-secondary"
              />
              <div class="mt-2 pl-1 text-xs">
                - ราคาขายที่คำนวนมาเป็นราคา +{{ defaultProfitMargin }}%
                จากต้นทุน<br />
                - สามารถตั้งราคาใหม่ได้เพื่อดูกำไรที่ต้องการ
                <div class="pr-1 text-xs text-red-600">
                  - (ราคาขายต่ำกว่า {{ costPerPiece.toFixed(2) }} บาทจะขาดทุน)
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 space-y-1"></div>

          <div class="mt-5 space-y-1">
            <div
              class="flex items-center justify-between border-b pb-2 pt-2 text-base"
            >
              <div>
                <span class="text-lg text-gray-700">ยอดขายทั้งหมด:</span>

                <div class="text-xs text-gray-600">
                  (จำนวนขนม {{ productionQuantity }} ชิ้น)
                </div>
              </div>
              <span class="text-xl font-bold text-secondary"
                >{{
                  totalRevenue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                บาท</span
              >
            </div>
            <div
              class="flex items-center justify-between border-b py-2 text-base"
            >
              <div>
                <div class="font-medium text-gray-600">ต้นทุนรวมทั้งหมด:</div>
                <div class="text-xs text-gray-600">(วัตถุดิบ+น้ำไฟ+ค่าแรง)</div>
              </div>

              <span class="text-xl font-bold text-red-600"
                >{{
                  totalCostWithOverhead.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                บาท</span
              >
            </div>

            <div
              class="flex items-center justify-between border-b py-2 text-base"
            >
              <span class="font-medium text-gray-600">กำไรทั้งหมด:</span>
              <span class="text-2xl font-bold text-green-600"
                >{{
                  totalProfit.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                บาท</span
              >
            </div>

            <div
              class="flex items-center justify-between border-b py-2 text-base"
            >
              <span class="text-gray-600">กำไรต่อชิ้น:</span>
              <span class="text-lg font-bold text-green-600"
                >{{
                  profitPerPiece.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }}
                บาท</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="!calculationResult && !isLoading"
      class="py-10 text-center text-gray-500"
    >
      <p>กรุณาเลือกสูตรและกรอกข้อมูลเพื่อคำนวณต้นทุน</p>
    </div>
    <BaseModal
      v-if="isSubRecipeModalOpen"
      @close="isSubRecipeModalOpen = false"
    >
      <div v-if="subRecipeToShow" class="p-6">
        <h3 class="mb-4 text-2xl font-semibold">
          ส่วนประกอบของ: {{ subRecipeToShow.name }}
        </h3>
        <ul class="list-inside list-disc space-y-2">
          <li v-for="item in subRecipeToShow.breakdown" :key="item.name">
            {{ item.name }}:
            <span class="font-bold">{{ item.quantity.toFixed(2) }}</span> กรัม
          </li>
        </ul>
        <div class="mt-6 text-right">
          <button
            @click="isSubRecipeModalOpen = false"
            class="rounded-md bg-primary px-4 py-2 text-white"
          >
            ปิด
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
