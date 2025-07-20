<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';
import Swal from 'sweetalert2';
import CustomAutocomplete from '../CustomAutocomplete.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      purchaseUnit: 'กรัม',
      purchaseQuantity: null,
      purchasePrice: null,
      defaultYield: 100,
      costByWholeUnit: false,
      standardWeightInGrams: null,
    }),
  },
  existingNames: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['save', 'cancel']);

const formData = ref({});
const autocompleteRef = ref(null);
const isEditing = computed(() => !!props.initialData.id);

const isUnitNotGrams = computed(() => {
  return (
    formData.value.purchaseUnit &&
    formData.value.purchaseUnit.trim().toLowerCase() !== 'กรัม'
  );
});

const shouldDisableCostByUnit = computed(() => {
  return (
    !formData.value.purchaseUnit ||
    formData.value.purchaseUnit.trim().toLowerCase() === 'กรัม'
  );
});

watch(
  () => props.initialData,
  (newData) => {
    formData.value = { ...newData };
    // **FIX:** Ensure defaultYield always has a value
    if (formData.value.defaultYield == null) {
      formData.value.defaultYield = 100;
    }
  },
  { immediate: true, deep: true }
);

onMounted(() => {
  autocompleteRef.value?.focus();
});

function focusNext(nextElementId) {
  nextTick(() => {
    document.getElementById(nextElementId)?.focus();
  });
}

function handleSubmit() {
  const {
    name,
    purchaseUnit,
    purchaseQuantity,
    purchasePrice,
    standardWeightInGrams,
  } = formData.value;

  if (!name || !purchaseUnit || !purchaseQuantity || !purchasePrice) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกข้อมูลหลักให้ครบ',
    });
    return;
  }

  let costPerGram = 0;
  if (isUnitNotGrams.value) {
    if (!standardWeightInGrams || standardWeightInGrams <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกน้ำหนักมาตรฐานเป็นกรัม',
      });
      return;
    }
    const totalGrams = purchaseQuantity * standardWeightInGrams;
    costPerGram = purchasePrice / totalGrams;
  } else {
    costPerGram = purchasePrice / purchaseQuantity;
  }

  const dataToSave = {
    ...formData.value,
    costPerGram: costPerGram,
  };

  emit('save', dataToSave);
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-6">
      <h3 class="mb-4 text-2xl font-semibold">
        {{ initialData.id ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่' }}
      </h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >ชื่อวัตถุดิบ</label
          >
          <CustomAutocomplete
            ref="autocompleteRef"
            v-model="formData.name"
            :options="existingNames"
            :disabled="isEditing"
            :creatable="true"
            @selection-made="focusNext('price-input')"
            class="mt-1"
          ></CustomAutocomplete>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium">ราคาที่ซื้อ (บาท)</label>
            <input
              id="price-input"
              v-model.number="formData.purchasePrice"
              @keydown.enter.prevent="focusNext('quantity-input')"
              type="number"
              step="0.01"
              class="mt-1 w-full rounded-md border p-2"
            />
          </div>
          <div>
            <label class="block text-sm font-medium">จำนวนที่ซื้อ</label>
            <input
              id="quantity-input"
              v-model.number="formData.purchaseQuantity"
              @keydown.enter.prevent="focusNext('unit-input')"
              type="number"
              class="mt-1 w-full rounded-md border p-2"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium">หน่วยที่ซื้อ</label>
          <input
            id="unit-input"
            v-model="formData.purchaseUnit"
            @keydown.enter.prevent
            type="text"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>

        <div v-if="isUnitNotGrams" class="rounded-md bg-blue-50 p-3">
          <label class="block text-sm font-medium text-blue-800"
            >น้ำหนักมาตรฐานต่อ 1 หน่วย (กรัม)</label
          >
          <p class="mb-1 text-xs text-gray-500">เช่น ไข่ 1 ฟองหนัก 50 กรัม</p>
          <input
            v-model.number="formData.standardWeightInGrams"
            type="number"
            class="mt-1 block w-full rounded-md border p-2"
          />
        </div>

        <div class="mt-4 border-t pt-4">
          <h4 class="mb-2 font-semibold text-gray-800">
            การตั้งค่าต้นทุน (ทางเลือก)
          </h4>
          <p class="mb-4 text-sm text-gray-500">
            2 ส่วนนี้เป็นค่าที่ตั้งไว้ล่วงหน้าเพื่อการคำนวณที่แม่นยำขึ้น
            หากไม่ต้องการใช้งาน สามารถเลื่อนลงไปบันทึกได้เลย
          </p>

          <div>
            <label class="block text-sm font-medium text-secondary"
              >1. Yield เริ่มต้น (%)</label
            >
            <input
              v-model.number="formData.defaultYield"
              type="number"
              min="0"
              max="100"
              class="mt-1 w-full rounded-md border p-2"
            />
            <p class="mt-1 text-xs text-gray-600">
              เปอร์เซ็นต์ส่วนที่ใช้ได้หลังการเตรียม (เช่น ปอกเปลือกแล้วเหลือ
              80%)
            </p>
          </div>

          <div class="mt-4">
            <div class="flex items-center">
              <input
                id="costByWholeUnit"
                v-model="formData.costByWholeUnit"
                :disabled="shouldDisableCostByUnit"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary disabled:bg-gray-200"
              />
              <label
                for="costByWholeUnit"
                class="ml-2 block text-sm"
                :class="
                  shouldDisableCostByUnit ? 'text-gray-400' : 'text-gray-900'
                "
              >
                2. คิดต้นทุนเต็มหน่วยเสมอ
              </label>
            </div>
            <p class="ml-6 mt-1 text-xs text-gray-600">
              (สำหรับวัตถุดิบที่ต้องใช้ทั้งหน่วย เช่น ไข่ไก่ ตอกใช้แค่ส่วนหนึ่ง
              ที่เหลือต้องทิ้ง จะคิดทุนทั้งฟอง)
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end space-x-3 rounded-b-lg bg-gray-50 px-6 py-3">
      <button
        type="button"
        @click="emit('cancel')"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        ยกเลิก
      </button>
      <button
        type="submit"
        class="rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-opacity-90"
      >
        บันทึก
      </button>
    </div>
  </form>
</template>
