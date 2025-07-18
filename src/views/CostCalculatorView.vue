<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { db } from '../services/db.js';
import Multiselect from '@vueform/multiselect';
import Swal from 'sweetalert2';

const resultsSection = ref(null);
// --- States for Input ---
const finalRecipes = ref([]);
const allIngredients = ref([]);
const allSubRecipes = ref([]);
const selectedRecipeId = ref(null);
const productionQuantity = ref(10);
const weightPerPiece = ref(50);

// --- States for Additional Costs ---
const laborCostPerHour = ref(50); // ค่าแรงต่อชั่วโมง
const workHours = ref(6); // ชั่วโมงที่ทำงาน
const overheadPercent = ref(20); // ค่าใช้จ่ายแฝง (%)
const targetFoodCostPercent = ref(30); // % Food Cost ที่ต้องการ
const customSellingPrice = ref(null); // ราคาขายที่กำหนดเอง

// --- States for Display ---
const calculationResult = ref(null);
const isLoading = ref(false);

// --- Data Fetching ---
async function fetchData() {
  try {
    const [recipes, ingredients] = await Promise.all([
      db.recipes.toArray(),
      db.ingredients.toArray(),
    ]);
    finalRecipes.value = recipes.filter((r) => !r.isSubRecipe);
    allSubRecipes.value = recipes.filter((r) => r.isSubRecipe);
    allIngredients.value = ingredients;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    Swal.fire('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลได้', 'error');
  }
}

onMounted(fetchData);

// --- Calculation Logic ---
async function calculateCost() {
  if (!selectedRecipeId.value) {
    Swal.fire({
      icon: 'info',
      title: 'โปรดเลือกสูตร',
      text: 'กรุณาเลือกสูตรที่ต้องการคำนวณ',
    });
    return;
  }
  isLoading.value = true;
  calculationResult.value = null; // Clear previous results

  try {
    const mainRecipe = await db.recipes.get(selectedRecipeId.value);

    // Initial check for ingredients list
    if (
      !mainRecipe.ingredientsList ||
      mainRecipe.ingredientsList.length === 0
    ) {
      Swal.fire({
        icon: 'error',
        title: 'สูตรไม่สมบูรณ์',
        html: 'สูตรที่คุณเลือกยังไม่มีรายการวัตถุดิบ<br>กรุณาตรวจสอบหรือไปที่หน้าสูตรขนม<br>เพื่อเพอ่มรายการวัตถุดิบ',
      });
      isLoading.value = false;
      return;
    }

    const totalWeightNeeded = productionQuantity.value * weightPerPiece.value;

    let totalRecipeWeight = mainRecipe.ingredientsList.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    if (totalRecipeWeight === 0) totalRecipeWeight = 1;

    const scalingFactor = totalWeightNeeded / totalRecipeWeight;

    const flatIngredientList = await expandRecipe(mainRecipe, scalingFactor);

    let foodCost = 0;
    const costBreakdown = flatIngredientList.map((item) => {
      const ingredientCost = item.totalQuantity * item.costPerGram;
      foodCost += ingredientCost;
      return {
        name: item.name,
        quantity: item.totalQuantity,
        cost: ingredientCost,
      };
    });

    // Final check for calculated cost
    if (foodCost <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่สามารถคำนวณต้นทุนได้',
        text: 'ต้นทุนวัตถุดิบรวมเป็นศูนย์ อาจเนื่องมาจากยังไม่ได้ใส่ปริมาณหรือราคาของวัตถุดิบในสูตร',
      });
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

  for (const item of recipe.ingredientsList) {
    const scaledQuantity = item.quantity * scalingFactor;

    const baseIngredient = allIngredients.value.find(
      (i) => i.id === item.ingredientId
    );

    if (baseIngredient) {
      if (ingredientMap.has(baseIngredient.id)) {
        ingredientMap.get(baseIngredient.id).totalQuantity += scaledQuantity;
      } else {
        ingredientMap.set(baseIngredient.id, {
          id: baseIngredient.id, // เพิ่ม id เพื่อให้ key ไม่ซ้ำ
          name: baseIngredient.name,
          costPerGram: baseIngredient.costPerGram,
          totalQuantity: scaledQuantity,
        });
      }
    } else {
      const subRecipe = allSubRecipes.value.find(
        (r) => r.id === item.ingredientId
      );
      if (subRecipe) {
        const subRecipeTotalWeight =
          subRecipe.ingredientsList.reduce(
            (sum, current) => sum + current.quantity,
            0
          ) || 1;
        const subRecipeScalingFactor = scaledQuantity / subRecipeTotalWeight;
        const subIngredients = await expandRecipe(
          subRecipe,
          subRecipeScalingFactor
        );

        subIngredients.forEach((subItem) => {
          if (ingredientMap.has(subItem.id)) {
            ingredientMap.get(subItem.id).totalQuantity +=
              subItem.totalQuantity;
          } else {
            ingredientMap.set(subItem.id, subItem);
          }
        });
      }
    }
  }
  return Array.from(ingredientMap.values());
}

// --- CORRECTED: Computed Properties for Final Calculation ---

const totalLaborCost = computed(() => laborCostPerHour.value * workHours.value);

const totalOverheadCost = computed(() => {
  if (!calculationResult.value) return 0;
  return calculationResult.value.foodCost * (overheadPercent.value / 100);
});

const totalCostWithOverhead = computed(() => {
  if (!calculationResult.value) return 0;
  return (
    calculationResult.value.foodCost +
    totalLaborCost.value +
    totalOverheadCost.value
  );
});

// **NEW:** คำนวณต้นทุนต่อชิ้น
const costPerPiece = computed(() => {
  if (!productionQuantity.value || !totalCostWithOverhead.value) return 0;
  return totalCostWithOverhead.value / productionQuantity.value;
});

// **NEW:** คำนวณราคาแนะนำขายจาก ต้นทุนต่อชิ้น + 50%
const suggestedSellingPricePerPiece = computed(() => {
  return costPerPiece.value * 1.5;
});

// This ref will now hold the final price, defaulting to the suggestion
const finalSellingPricePerPiece = ref(0);

// **NEW:** Watch for changes in the suggestion and update the final price
watch(suggestedSellingPricePerPiece, (newValue) => {
  finalSellingPricePerPiece.value = parseFloat(
    newValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
});

const totalRevenue = computed(() => {
  return finalSellingPricePerPiece.value * productionQuantity.value;
});

// **CORRECTED:** Calculates profit based on the new totalRevenue
const totalProfit = computed(() => {
  if (!calculationResult.value) return 0;
  return totalRevenue.value - totalCostWithOverhead.value;
});

const profitPerPiece = computed(() => {
  if (!productionQuantity.value) return 0;
  return totalProfit.value / productionQuantity.value;
});

// --- Computed Properties for UI ---
const recipeOptions = computed(() => {
  return finalRecipes.value.map((recipe) => ({
    value: recipe.id,
    label: recipe.name,
  }));
});
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="rounded-lg bg-white p-4 shadow-md">
      <h1 class="mb-6 text-3xl font-bold">คำนวณต้นทุน</h1>
      <div class="grid grid-cols-1 items-end gap-6 md:grid-cols-4">
        <div class="md:col-span-2">
          <label class="mb-1 block text-sm font-medium text-gray-700"
            >เลือกสูตรอาหาร</label
          >
          <Multiselect
            v-model="selectedRecipeId"
            :options="recipeOptions"
            :searchable="true"
            placeholder="-- เลือกหรือค้นหาสูตร --"
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
            type="number"
            class="w-full rounded-md border border-gray-300 px-3 py-2"
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

    <div class="mt-5" v-if="calculationResult">
      <div class="rounded-lg bg-white p-4 shadow-md">
        <h2 class="mb-4 text-xl font-semibold">
          ต้นทุนสูตร:
          <span class="text-primary">{{ calculationResult.recipeName }}</span>
        </h2>

        <p class="mb-6 text-gray-600">
          สำหรับขนมจำนวน {{ productionQuantity }} ชิ้น<br />
          ขนาด
          {{ weightPerPiece }} กรัม/ชิ้น <br />
          (น้ำหนักรวม
          {{
            calculationResult.totalWeight.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          }}
          กรัม)
        </p>

        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead class="border-t-2 border-gray-300">
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
                <td class="px-2 py-2">{{ item.name }}</td>
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
          </table>
          <div class="mt-2 pr-2 text-right text-base font-bold">
            <span class="pr-2">ต้นทุนวัตถุดิบรวม</span>
            {{
              calculationResult.foodCost.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }}
          </div>
        </div>
      </div>

      <!-- ต้นทุนเพิ่มเติม -->
      <div class="mt-5 rounded-lg bg-white p-4 shadow-md">
        <h3 class="mb-1 text-xl font-semibold text-secondary">
          ต้นทุนเพิ่มเติม
        </h3>
        <div class="text-sm text-gray-700">
          (ใส่ 0 หรือปล่อยว่าง ในช่องที่ไม่ต้องการคิดทุน)
        </div>
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
                >ต้นทุนแฝง</label
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
      <div class="mb-8 mt-5 rounded-lg bg-white p-4 shadow-md">
        <div>
          <h3 class="mb-4 text-xl font-semibold">สรุปต้นทุนและกำหนดราคาขาย</h3>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                - ราคาขายที่คำนวนมาเป็นราคา +50% จากต้นทุน<br />
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
              <span class="text-xl font-bold text-green-600"
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
  </div>
</template>
