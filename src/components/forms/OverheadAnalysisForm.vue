<script setup>
import { ref, watch, computed } from 'vue';
import Multiselect from '@vueform/multiselect';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Swal from 'sweetalert2';

const props = defineProps({
  initialData: { type: Object, required: true },
  availableProducts: { type: Array, required: true },
});
const emit = defineEmits(['save', 'cancel']);

const group = ref({});
const productOptions = computed(() => {
  return props.availableProducts.map((p) => ({ value: p.id, label: p.name }));
});

watch(
  () => props.initialData,
  (newData) => {
    group.value = JSON.parse(JSON.stringify(newData));
    if (!group.value.products || group.value.products.length === 0) {
      group.value.products = [{ productId: null, monthlySales: null }];
    }
  },
  { immediate: true, deep: true }
);

function addRow() {
  group.value.products.push({ productId: null, monthlySales: null });
}
function removeRow(index) {
  group.value.products.splice(index, 1);
}

function handleSubmit() {
  if (!group.value.name || !group.value.name.trim()) {
    Swal.fire('ข้อมูลไม่ครบถ้วน', 'กรุณาใส่ชื่อกลุ่ม', 'error');
    return;
  }
  const validProducts = group.value.products.filter(
    (p) => p.productId && p.monthlySales > 0
  );
  if (validProducts.length === 0) {
    Swal.fire(
      'ข้อมูลไม่ครบถ้วน',
      'กรุณาเลือกสินค้าและใส่ยอดขายอย่างน้อย 1 รายการ',
      'error'
    );
    return;
  }
  emit('save', { ...group.value, products: validProducts });
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
          <h4 class="mb-2 font-semibold">รายการสินค้าในกลุ่ม</h4>
          <div class="space-y-3">
            <div
              v-for="(item, index) in group.products"
              :key="index"
              class="flex items-center space-x-2"
            >
              <Multiselect
                v-model="item.productId"
                :options="productOptions"
                placeholder="เลือกสินค้า"
                class="flex-grow"
              />
              <input
                v-model.number="item.monthlySales"
                type="number"
                placeholder="ยอดขาย/เดือน (ชิ้น)"
                class="w-40 rounded-md border p-2"
              />
              <button
                @click="removeRow(index)"
                type="button"
                class="text-red-500"
              >
                <font-awesome-icon icon="trash" />
              </button>
            </div>
          </div>
          <button
            @click="addRow"
            type="button"
            class="mt-4 font-semibold text-primary"
          >
            + เพิ่มสินค้า
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
