<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  allIngredientsAndSubRecipes: { type: Array, required: true },
  scalingFactor: { type: Number, default: 1 },
  level: { type: Number, default: 0 },
});

const isExpanded = ref(false);

const isSubRecipe = computed(() => props.item.itemType === 'recipe');

const subRecipeDetails = computed(() => {
  if (!isSubRecipe.value) return null;
  return props.allIngredientsAndSubRecipes.find(
    (r) => r.id === props.item.itemId && r.isSubRecipe
  );
});

const itemName = computed(() => {
  const uniqueId = `${props.item.itemType}-${props.item.itemId}`;
  const found = props.allIngredientsAndSubRecipes.find(
    (i) => `${i.isSubRecipe ? 'recipe' : 'ingredient'}-${i.id}` === uniqueId
  );
  return found ? found.name : 'N/A';
});

const itemQuantity = computed(() => {
  return Number(props.item.quantity || 0) * props.scalingFactor;
});

const requiredQuantity = computed(() => {
  return Number(props.item.quantity || 0) * props.scalingFactor;
});
</script>

<template>
  <div>
    <div
      class="flex items-center border-b py-2"
      :style="{ paddingLeft: `${level * 20}px` }"
    >
      <button
        v-if="isSubRecipe"
        @click="isExpanded = !isExpanded"
        class="mr-2 w-6 text-gray-500"
      >
        <span>{{ isExpanded ? '−' : '+' }}</span>
      </button>
      <div v-else class="w-8"></div>

      <span class="flex-grow">{{ itemName }}</span>
      <span class="text-right"
        >{{
          itemQuantity.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        }}
        กรัม</span
      >
    </div>

    <div v-if="isSubRecipe && isExpanded">
      <IngredientRow
        v-for="(subItem, index) in subRecipeDetails.ingredientsList"
        :key="index"
        :item="subItem"
        :all-ingredients-and-sub-recipes="allIngredientsAndSubRecipes"
        :scaling-factor="
          itemQuantity /
          subRecipeDetails.ingredientsList.reduce(
            (sum, i) => sum + Number(i.quantity || 0),
            1
          )
        "
        :level="level + 1"
      />
    </div>
  </div>
</template>
