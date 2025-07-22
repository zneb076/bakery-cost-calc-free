<script setup>
import { ref, computed, createApp } from 'vue';
import IngredientRow from './IngredientRow.vue';
import RecipeSheet from './RecipeSheet.vue';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

const props = defineProps({
  recipe: { type: Object, required: true },
  allIngredientsAndSubRecipes: { type: Array, required: true },
});

const numberOfPieces = ref(null);
const sizePerPiece = ref(null);

const isCalculationActive = computed(() => {
  const pieces = Number(numberOfPieces.value || 0);
  const size = Number(sizePerPiece.value || 0);
  return pieces > 0 && size > 0;
});

const baseWeight = computed(() => {
  return props.recipe.ingredientsList.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
});

const totalProductionWeight = computed(() => {
  if (isCalculationActive.value) {
    return Number(numberOfPieces.value) * Number(sizePerPiece.value);
  }
  return baseWeight.value;
});

const scalingFactor = computed(() => {
  if (isCalculationActive.value) {
    if (!baseWeight.value) return 0;
    return totalProductionWeight.value / baseWeight.value;
  }
  return 1;
});

const isRendering = ref(false);

async function saveAsImage() {
  if (isRendering.value) return;
  isRendering.value = true;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const app = createApp(RecipeSheet, {
    recipe: props.recipe,
    allIngredientsAndSubRecipes: props.allIngredientsAndSubRecipes,
    scalingFactor: scalingFactor.value,
  });
  app.mount(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const canvas = await html2canvas(container.firstChild, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const image = canvas.toDataURL('image/png');

    const link = document.createElement('a');
    link.href = image;
    link.download = `${props.recipe.name}.png`;
    link.click();
  } catch (error) {
    console.error('Error saving image:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถสร้างรูปภาพได้', 'error');
  } finally {
    app.unmount();
    document.body.removeChild(container);
    isRendering.value = false;
  }
}

function calculateRecipeCost(recipe) {
  if (!recipe?.ingredientsList) return 0;

  return recipe.ingredientsList.reduce((total, item) => {
    const uniqueId = `${item.itemType}-${item.itemId}`;
    const ingredientOrSubRecipe = props.allIngredientsAndSubRecipes.find(
      (i) => `${i.isSubRecipe ? 'recipe' : 'ingredient'}-${i.id}` === uniqueId
    );

    if (!ingredientOrSubRecipe) return total;

    let itemCost = 0;
    const quantity = Number(item.quantity || 0);

    if (ingredientOrSubRecipe.isSubRecipe) {
      // ถ้าเป็นสูตรย่อย ให้เรียกฟังก์ชันนี้ซ้ำเพื่อหาต้นทุนของมัน
      const subRecipeCost = calculateRecipeCost(ingredientOrSubRecipe);
      const subRecipeWeight =
        ingredientOrSubRecipe.ingredientsList.reduce(
          (sum, subItem) => sum + Number(subItem.quantity || 0),
          0
        ) || 1;
      const costPerGramOfSubRecipe = subRecipeCost / subRecipeWeight;
      itemCost = quantity * costPerGramOfSubRecipe;
    } else {
      // ถ้าเป็นวัตถุดิบปกติ
      itemCost = quantity * Number(ingredientOrSubRecipe.costPerGram || 0);
    }
    return total + itemCost;
  }, 0);
}

// **UPDATED:** baseCost จะเรียกใช้ฟังก์ชันใหม่
const baseCost = computed(() => {
  return calculateRecipeCost(props.recipe);
});

// **NEW:** คำนวณต้นทุนต่อกรัมของสูตร
const costPerGram = computed(() => {
  if (!baseWeight.value) return 0;
  return baseCost.value / baseWeight.value;
});

// **NEW:** คำนวณต้นทุนทั้งหมดที่จะทำ
const totalProductionCost = computed(() => {
  if (isCalculationActive.value) {
    return totalProductionWeight.value * costPerGram.value;
  }
  return baseCost.value;
});
</script>

<template>
  <div class="p-6">
    <h3 class="mb-4 text-2xl font-semibold">
      <span class="text-primary">{{ recipe.name }}</span>
    </h3>

    <div class="mb-4 grid grid-cols-2 gap-4 rounded-md bg-gray-50 p-4">
      <div>
        <label class="block text-sm font-medium text-gray-700"
          >จำนวนชิ้นที่จะทำ</label
        >
        <input
          type="number"
          v-model.number="numberOfPieces"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="เช่น 100"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700"
          >ขนาดต่อชิ้น (กรัม)</label
        >
        <input
          type="number"
          v-model.number="sizePerPiece"
          class="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="เช่น 50"
        />
      </div>
      <div class="col-span-2 rounded-md bg-white p-2 text-center">
        <span class="text-gray-600">
          {{
            isCalculationActive ? 'ปริมาณที่จะทำทั้งหมด:' : 'ปริมาณสูตรพื้นฐาน:'
          }}
        </span>
        <span class="ml-2 text-lg font-bold">{{
          totalProductionWeight.toLocaleString('en-US', {
            maximumFractionDigits: 2,
          })
        }}</span>
        <span class="text-gray-600"> กรัม</span>
        <div class="col-span-2 rounded-md bg-white p-2 text-center">
          <span class="text-gray-600">
            {{
              isCalculationActive
                ? 'ต้นทุนที่จะทำทั้งหมด:'
                : 'ต้นทุนสูตรพื้นฐาน:'
            }}
          </span>
          <span class="ml-2 text-lg font-bold text-primary">{{
            totalProductionCost.toLocaleString('en-US', {
              maximumFractionDigits: 2,
            })
          }}</span>
          <span class="text-gray-600"> บาท</span>
          <p class="mt-1 text-xs text-gray-500">
            (น้ำหนักรวม:
            {{
              totalProductionWeight.toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })
            }}
            กรัม, ต้นทุน: {{ costPerGram.toFixed(4) }} บาท/กรัม)
          </p>
        </div>
        <div class="mt-2 text-center">
          <button
            @click="saveAsImage"
            :disabled="isRendering"
            class="rounded-lg bg-secondary px-4 py-2 text-sm font-normal text-white hover:bg-blue-500 disabled:opacity-50"
          >
            <font-awesome-icon icon="floppy-disk" class="mr-1" />
            {{ isRendering ? 'กำลังสร้างรูป...' : 'เซฟภาพสูตร' }}
          </button>
        </div>
      </div>
    </div>

    <div class="max-h-100 overflow-y-auto">
      <div class="border-b">
        <div class="flex py-2 font-semibold">
          <div class="w-8"></div>
          <div class="flex-grow">ส่วนประกอบ</div>
          <div class="text-right">ปริมาณ</div>
        </div>
      </div>
      <IngredientRow
        v-for="(item, index) in recipe.ingredientsList"
        :key="index"
        :item="item"
        :all-ingredients-and-sub-recipes="allIngredientsAndSubRecipes"
        :scaling-factor="scalingFactor"
      />
    </div>
    <div v-if="recipe.notes" class="mt-4 rounded-md border p-4">
      <h4 class="mb-2 font-semibold">โน้ต / วิธีทำ:</h4>
      <p class="whitespace-pre-wrap text-gray-700">{{ recipe.notes }}</p>
    </div>
  </div>
</template>
