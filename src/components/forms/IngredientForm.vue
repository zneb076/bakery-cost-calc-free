<script setup>
import { ref, watch, computed } from 'vue';
import Swal from 'sweetalert2';
import Multiselect from '@vueform/multiselect';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      purchaseUnit: 'กรัม',
      purchaseQuantity: '',
      purchasePrice: '',
    }),
  },
  existingNames: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['save', 'cancel']);

const formData = ref({ ...props.initialData });
// เพิ่ม state สำหรับเก็บน้ำหนักมาตรฐาน
const standardWeight = ref(50); // ค่าเริ่มต้นสำหรับไข่/ของเหลว

// computed property เพื่อเช็คว่าหน่วยเป็นกรัมหรือไม่
const isUnitGrams = computed(
  () => formData.value.purchaseUnit.trim().toLowerCase() === 'กรัม'
);

watch(
  () => props.initialData,
  (newData) => {
    formData.value = { ...newData };
  }
);

const isEditing = computed(() => !!props.initialData.id);

function handleSubmit() {
  const { name, purchaseUnit, purchaseQuantity, purchasePrice } =
    formData.value;

  if (!name || !purchaseUnit || !purchaseQuantity || !purchasePrice) {
    Swal.fire({
      icon: 'error',
      title: 'ข้อมูลไม่ครบถ้วน',
      text: 'กรุณากรอกข้อมูลวัตถุดิบให้ครบทุกช่อง',
    });
    return;
  }

  let costPerGram = 0;
  if (isUnitGrams.value) {
    costPerGram = purchasePrice / purchaseQuantity;
  } else {
    // คำนวณสำหรับหน่วยอื่นๆ
    if (!standardWeight.value || standardWeight.value <= 0) {
      alert('กรุณากรอกน้ำหนักมาตรฐานเป็นกรัม');
      return;
    }
    const totalGrams = purchaseQuantity * standardWeight.value;
    costPerGram = purchasePrice / totalGrams;
  }

  // ส่งข้อมูลที่คำนวณแล้วกลับไป
  emit('save', {
    ...formData.value,
    costPerGram: costPerGram,
  });
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
          <label for="name" class="block text-sm font-medium"
            >ชื่อวัตถุดิบ</label
          >
          <Multiselect
            v-model="formData.name"
            :options="existingNames"
            :searchable="true"
            :create-option="true"
            :disabled="isEditing"
            placeholder="ค้นหาหรือพิมพ์เพื่อเพิ่มใหม่"
            class="mt-1"
          />
          <p v-if="isEditing" class="mt-1 text-xs text-gray-500">
            ไม่สามารถแก้ไขชื่อวัตถุดิบได้
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="price" class="block text-sm font-medium"
              >ราคาที่ซื้อ (บาท)</label
            >
            <input
              v-model.number="formData.purchasePrice"
              type="number"
              step="0.01"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>
          <div>
            <label for="quantity" class="block text-sm font-medium"
              >จำนวนที่ซื้อ</label
            >
            <input
              v-model.number="formData.purchaseQuantity"
              type="number"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label for="unit" class="block text-sm font-medium"
            >หน่วยที่ซื้อ (เช่น กรัม, ฟอง, กล่อง)</label
          >
          <input
            v-model="formData.purchaseUnit"
            type="text"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
          <div class="mt-2 px-2 text-xs text-gray-700">
            (ค่าพื้นฐานคือ "กรัม" ถ้ากรอกหน่วยอื่นๆจะมีช่องให้กรอกหน่วยกรัมเพิ่ม
            เพื่อให้ในการคำนวนต้นทุน)
          </div>
        </div>

        <div v-if="!isUnitGrams" class="rounded-md bg-blue-50 p-3">
          <label
            for="standard-weight"
            class="block text-sm font-medium text-blue-800"
            >น้ำหนักมาตรฐานต่อ 1 หน่วย (กรัม)</label
          >
          <p class="mb-1 text-xs text-gray-500">
            เช่น ไข่ 1 ฟองหนัก 50 กรัม, นม 1 กล่องมี 200 กรัม
          </p>
          <input
            v-model.number="standardWeight"
            type="number"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
          />
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
