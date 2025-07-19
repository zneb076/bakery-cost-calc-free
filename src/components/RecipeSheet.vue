<script setup>
import RecipeSheetRow from './RecipeSheetRow.vue';

defineProps({
  recipe: { type: Object, required: true },
  allIngredientsAndSubRecipes: { type: Array, required: true },
  scalingFactor: { type: Number, default: 1 },
});
</script>

<template>
  <div class="border-2 border-gray-200 bg-white p-8" style="width: 500px">
    <div class="mb-6 text-center">
      <!-- <img src="/logo.png" alt="Logo" class="mx-auto mb-2 h-20 w-20" /> -->
      <h1 class="text-3xl font-bold text-primary">{{ recipe.name }}</h1>
      <p v-if="recipe.isSubRecipe" class="text-gray-500">(สูตรย่อย)</p>
    </div>

    <table class="w-full">
      <thead class="border-b-2 border-gray-200">
        <tr>
          <th class="pb-2 text-left text-xl font-semibold">ส่วนประกอบ</th>
          <th class="pb-2 text-right text-xl font-semibold">ปริมาณ</th>
        </tr>
      </thead>
      <tbody class="text-2xl">
        <RecipeSheetRow
          v-for="(item, index) in recipe.ingredientsList"
          :key="index"
          :item="item"
          :all-ingredients-and-sub-recipes="allIngredientsAndSubRecipes"
          :scaling-factor="scalingFactor"
        />
      </tbody>
    </table>
    <!-- <p class="mt-4 text-center text-xs text-gray-400">
      สร้างโดย "ขออีกคำ" Bakery Cost Calculator
    </p> -->
  </div>
</template>
