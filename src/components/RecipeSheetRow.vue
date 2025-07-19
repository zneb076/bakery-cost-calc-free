<script setup>
import { computed } from 'vue';

const props = defineProps({
  item: { type: Object, required: true },
  allIngredientsAndSubRecipes: { type: Array, required: true },
  level: { type: Number, default: 0 },
  scalingFactor: { type: Number, default: 1 },
});

const itemDetails = computed(() => {
  if (!props.item?.itemType || !props.item?.itemId) return null;
  const uniqueId = `${props.item.itemType}-${props.item.itemId}`;
  return props.allIngredientsAndSubRecipes.find(
    (i) => `${i.isSubRecipe ? 'recipe' : 'ingredient'}-${i.id}` === uniqueId
  );
});

const itemName = computed(() => itemDetails.value?.name || 'N/A');

const itemQuantity = computed(() => {
  return Number(props.item.quantity || 0) * props.scalingFactor;
});

const subRecipeScalingFactor = computed(() => {
  if (props.item.itemType !== 'recipe' || !itemDetails.value?.ingredientsList) {
    return 1;
  }
  const baseWeight =
    itemDetails.value.ingredientsList.reduce(
      (sum, i) => sum + Number(i.quantity || 0),
      0
    ) || 1;
  return itemQuantity.value / baseWeight;
});
</script>

<template>
  <tr class="border-b">
    <td class="py-2" :style="{ paddingLeft: `${level * 24}px` }">
      {{ itemName }}
    </td>
    <td class="py-2 text-right">
      {{
        itemQuantity.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      }}
      กรัม
    </td>
  </tr>

  <template v-if="item.itemType === 'recipe' && itemDetails?.ingredientsList">
    <RecipeSheetRow
      v-for="(subItem, index) in itemDetails.ingredientsList"
      :key="index"
      :item="subItem"
      :all-ingredients-and-sub-recipes="allIngredientsAndSubRecipes"
      :level="level + 1"
      :scaling-factor="subRecipeScalingFactor"
    />
  </template>
</template>
