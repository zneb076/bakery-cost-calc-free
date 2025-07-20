<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import CustomAutocomplete from '../CustomAutocomplete.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  availableIngredients: { type: Array, required: true },
});

const emit = defineEmits(['save', 'cancel']);

const recipe = ref({});
const ingredientAutocompleteRefs = ref([]);

const autocompleteOptions = computed(() => {
  return props.availableIngredients.map((item) => {
    const isSubRecipe = !!item.isSubRecipe;
    return isSubRecipe ? `${item.name} (สูตรย่อย)` : item.name;
  });
});

watch(
  () => props.initialData,
  (newData) => {
    const deepCopy = JSON.parse(JSON.stringify(newData));
    if (!deepCopy.ingredientsList || deepCopy.ingredientsList.length === 0) {
      deepCopy.ingredientsList = [
        {
          name: '',
          quantity: null,
          yield: 100,
          costByWholeUnit: false,
          showAdvanced: false,
        },
      ];
    } else {
      deepCopy.ingredientsList = deepCopy.ingredientsList.map((item) => {
        const uniqueId = `${item.itemType}-${item.itemId}`;
        const found = props.availableIngredients.find(
          (i) =>
            i &&
            `${i.isSubRecipe ? 'recipe' : 'ingredient'}-${i.id}` === uniqueId
        );
        const displayName = found
          ? found.isSubRecipe
            ? `${found.name} (สูตรย่อย)`
            : found.name
          : 'วัตถุดิบถูกลบ';
        return {
          ...item,
          name: displayName,
          yield: item.yield == null ? 100 : item.yield,
          costByWholeUnit:
            item.costByWholeUnit == null ? false : item.costByWholeUnit,
          showAdvanced: false,
        };
      });
    }
    recipe.value = deepCopy;
  },
  { immediate: true, deep: true }
);

function onIngredientSelect(index) {
  const selectedName = recipe.value.ingredientsList[index].name;
  const selectedIngredient = props.availableIngredients.find(
    (i) => (i.isSubRecipe ? `${i.name} (สูตรย่อย)` : i.name) === selectedName
  );
  if (selectedIngredient) {
    recipe.value.ingredientsList[index].yield =
      selectedIngredient.defaultYield ?? 100;
    recipe.value.ingredientsList[index].costByWholeUnit =
      selectedIngredient.costByWholeUnit ?? false;
  }
  nextTick(() => {
    const quantityInput = document.getElementById(`quantity-${index}`);
    quantityInput?.focus();
  });
}

async function handleEnterOnQuantity(index) {
  if (index === recipe.value.ingredientsList.length - 1) {
    addIngredientRow();
    await nextTick();
    ingredientAutocompleteRefs.value[index + 1]?.focus();
  } else {
    ingredientAutocompleteRefs.value[index + 1]?.focus();
  }
}

function handleEnterOnName() {
  ingredientAutocompleteRefs.value[0]?.focus();
}

const bakerPercentage = computed(() => {
  if (!recipe.value || !recipe.value.ingredientsList) return {};
  const list = recipe.value.ingredientsList;

  const flourItem = list.find(
    (item) => item.name && item.name.includes('แป้ง')
  );
  const flourWeight = flourItem ? Number(flourItem.quantity) : 0;
  if (flourWeight === 0) return {};

  const percentages = {};
  list.forEach((item, index) => {
    const quantity = Number(item.quantity) || 0;
    percentages[index] = ((quantity / flourWeight) * 100).toFixed(1);
  });

  return percentages;
});

function addIngredientRow() {
  recipe.value.ingredientsList.push({
    name: '',
    quantity: null,
    yield: 100,
    costByWholeUnit: false,
    showAdvanced: false,
  });
}

function removeIngredientRow(index) {
  recipe.value.ingredientsList.splice(index, 1);
}

function handleSubmit() {
  if (!recipe.value.name) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกชื่อสูตร',
    });
    return;
  }
  const finalIngredientsList = recipe.value.ingredientsList
    .map((item) => {
      const selected = props.availableIngredients.find(
        (i) =>
          i && (i.isSubRecipe ? `${i.name} (สูตรย่อย)` : i.name) === item.name
      );
      if (selected && item.quantity > 0) {
        return {
          itemType: selected.isSubRecipe ? 'recipe' : 'ingredient',
          itemId: selected.id,
          quantity: Number(item.quantity),
          yield: Number(item.yield || 100),
          costByWholeUnit: !!item.costByWholeUnit,
        };
      }
      return null;
    })
    .filter((item) => item !== null);
  if (finalIngredientsList.length === 0) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ',
    });
    return;
  }
  const recipeToSave = {
    ...recipe.value,
    ingredientsList: finalIngredientsList,
  };
  emit('save', recipeToSave);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-2">
      <h3 class="mb-6 text-2xl font-semibold">
        {{ recipe.id ? 'แก้ไขสูตร' : 'เพิ่มสูตรใหม่' }}
      </h3>
      <div class="space-y-6">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >ชื่อสูตร</label
            >
            <input
              v-model="recipe.name"
              @keydown.enter.prevent="handleEnterOnName"
              type="text"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>
          <div class="flex items-end pb-2">
            <div class="flex items-center">
              <input
                v-model="recipe.isSubRecipe"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <label class="ml-2 block text-sm text-gray-900"
                >เป็นสูตรย่อย</label
              >
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >โน้ต / วิธีทำ</label
          >
          <textarea
            v-model="recipe.notes"
            rows="4"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            placeholder="ใส่รายละเอียดวิธีทำหรือข้อความเตือนความจำ..."
          ></textarea>
        </div>
        <div class="border-t pt-6">
          <h4 class="mb-4 text-lg font-medium">รายการวัตถุดิบ</h4>
          <div class="space-y-1">
            <div
              v-for="(item, index) in recipe.ingredientsList"
              :key="index"
              class="rounded-lg bg-gray-50 p-2"
            >
              <div class="flex items-center space-x-1">
                <span
                  @click="item.showAdvanced = !item.showAdvanced"
                  title="ตั้งค่าเพิ่มเติม"
                  class="h-3 w-3 flex-shrink-0 cursor-pointer rounded-full transition-colors"
                  :class="{
                    'bg-green-500 hover:bg-green-600':
                      item.yield < 100 || item.costByWholeUnit,
                    'bg-gray-400 hover:bg-gray-600': !(
                      item.yield < 100 || item.costByWholeUnit
                    ),
                  }"
                ></span>
                <div class="w-[180px]">
                  <CustomAutocomplete
                    :ref="
                      (el) => {
                        if (el) ingredientAutocompleteRefs[index] = el;
                      }
                    "
                    :model-value="item.name"
                    @update:model-value="item.name = $event"
                    :options="autocompleteOptions"
                    @selection-made="onIngredientSelect(index)"
                    class="flex-grow"
                  ></CustomAutocomplete>
                </div>
                <input
                  :id="`quantity-${index}`"
                  v-model.number="item.quantity"
                  @keydown.enter.prevent="handleEnterOnQuantity(index)"
                  type="number"
                  step="0.01"
                  placeholder="กรัม"
                  class="w-[65px] rounded-md border px-3 py-2"
                />
                <div class="w-[50px] text-center text-xs text-gray-600">
                  <span v-if="bakerPercentage && bakerPercentage[index]"
                    >{{ bakerPercentage[index] }} %</span
                  >
                </div>
                <button
                  @click="removeIngredientRow(index)"
                  type="button"
                  class="text-red-500 hover:text-red-700"
                >
                  <font-awesome-icon icon="trash" />
                </button>
              </div>
              <div
                v-if="item.showAdvanced"
                class="mt-2 flex items-center space-x-4 border-t pl-6 pt-2"
              >
                <div>
                  <label class="block text-xs font-medium text-gray-600"
                    >Yield (%)</label
                  >
                  <input
                    v-model.number="item.yield"
                    type="number"
                    class="mt-1 w-24 rounded-md border p-1"
                  />
                </div>
                <div class="flex items-center pt-5">
                  <input
                    :id="`costByWholeUnit-${index}`"
                    v-model="item.costByWholeUnit"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <label
                    :for="`costByWholeUnit-${index}`"
                    class="ml-2 text-sm text-gray-700"
                  >
                    คิดต้นทุนเต็มหน่วย
                  </label>
                </div>
              </div>
            </div>
          </div>
          <button
            @click="addIngredientRow"
            type="button"
            class="mt-4 font-semibold text-primary"
          >
            + เพิ่มวัตถุดิบ
          </button>
        </div>
      </div>
    </div>
    <div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-3">
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-md border border-gray-300 bg-white px-4 py-2"
      >
        ยกเลิก
      </button>
      <button type="submit" class="rounded-md bg-primary px-4 py-2 text-white">
        บันทึก
      </button>
    </div>
  </form>
</template>
