<script setup>
import { ref, watch, computed } from 'vue';
import Multiselect from '@vueform/multiselect';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: { type: Object, required: true },
  availableRecipes: { type: Array, required: true },
});
const emit = defineEmits(['save', 'cancel']);

const group = ref({});
const recipeOptions = computed(() => {
  return props.availableRecipes.map((r) => ({ value: r.id, label: r.name }));
});

watch(
  () => props.initialData,
  (newData) => {
    group.value = JSON.parse(JSON.stringify(newData));
    if (!group.value.recipes || group.value.recipes.length === 0) {
      group.value.recipes = [{ recipeId: null, monthlySales: null }];
    }
  },
  { immediate: true, deep: true }
);

function addRecipeRow() {
  group.value.recipes.push({ recipeId: null, monthlySales: null });
}
function removeRecipeRow(index) {
  group.value.recipes.splice(index, 1);
}

function handleSubmit() {
  if (!group.value.name || !group.value.name.trim()) {
    Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาใส่ชื่อกลุ่ม', 'error');
    return;
  }
  const validRecipes = group.value.recipes.filter(
    (r) => r.recipeId && r.monthlySales > 0
  );
  if (validRecipes.length === 0) {
    Swal.fire(
      'ข้อมูลไม่ครบถ้วน',
      'กรุณาเพิ่มขนมและยอดขายอย่างน้อย 1 รายการ',
      'error'
    );
    return;
  }
  emit('save', { ...group.value, recipes: validRecipes });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-6">
      <h3 class="mb-4 text-2xl font-semibold">กลุ่มสำหรับหาต้นทุนแฝง</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium">ชื่อกลุ่ม</label>
          <input
            v-model="group.name"
            type="text"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>
        <div class="border-t pt-4">
          <h4 class="mb-2 font-semibold">รายการขนมในกลุ่ม</h4>
          <div class="space-y-3">
            <div
              v-for="(recipeItem, index) in group.recipes"
              :key="index"
              class="flex items-center space-x-2"
            >
              <Multiselect
                v-model="recipeItem.recipeId"
                :options="recipeOptions"
                placeholder="เลือกสูตร"
                class="flex-grow"
              />
              <input
                v-model.number="recipeItem.monthlySales"
                type="number"
                placeholder="ยอดขาย/เดือน (ชิ้น)"
                class="w-40 rounded-md border p-2"
              />
              <button
                @click="removeRecipeRow(index)"
                type="button"
                class="text-red-500"
              >
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
          <button
            @click="addRecipeRow"
            type="button"
            class="mt-4 font-semibold text-primary"
          >
            + เพิ่มขนม
          </button>
        </div>
      </div>
    </div>
    <div class="flex justify-end space-x-3 bg-gray-50 px-6 py-3">
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-md border bg-white px-4 py-2"
      >
        ยกเลิก
      </button>
      <button type="submit" class="rounded-md bg-primary px-4 py-2 text-white">
        บันทึก
      </button>
    </div>
  </form>
</template>
<style src="@vueform/multiselect/themes/default.css"></style>
