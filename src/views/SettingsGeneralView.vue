<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../services/db.js';
import Swal from 'sweetalert2';

// State สำหรับเก็บค่า setting ทั้งหมด
const settings = ref({
  laborCostPerHour: 50,
  workHours: 4,
  overheadPercent: 30,
  defaultProfitMargin: 50,
});

// โหลดค่าที่เคยบันทึกไว้
onMounted(async () => {
  const savedSettings = await db.settings.toArray();
  savedSettings.forEach((setting) => {
    if (settings.value.hasOwnProperty(setting.key)) {
      settings.value[setting.key] = setting.value;
    }
  });
});

async function saveSettings() {
  try {
    // แปลง object ให้อยู่ในรูปแบบ { key: '...', value: '...' }
    const settingsToSave = Object.entries(settings.value).map(
      ([key, value]) => ({
        key,
        value: typeof value === 'number' ? value : String(value),
      })
    );

    await db.settings.bulkPut(settingsToSave);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'บันทึกการตั้งค่าแล้ว',
      showConfirmButton: false,
      timer: 1000,
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้', 'error');
  }
}
</script>

<template>
  <div class="rounded-lg bg-white p-6 shadow-md">
    <h2 class="mb-4 text-2xl font-semibold">ตั้งค่าทั่วไป</h2>
    <div class="space-y-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium"
            >ค่าแรง/ชม. (ค่าเริ่มต้น)</label
          >
          <input
            type="number"
            v-model.number="settings.laborCostPerHour"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium"
            >ชั่วโมงที่ทำ (ค่าเริ่มต้น)</label
          >
          <input
            type="number"
            v-model.number="settings.workHours"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium"
            >% ทุนแฝง (ค่าเริ่มต้น)</label
          >
          <input
            type="number"
            v-model.number="settings.overheadPercent"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium"
            >% กำไรที่ต้องการ (แนะนำ)</label
          >
          <input
            type="number"
            v-model.number="settings.defaultProfitMargin"
            class="mt-1 w-full rounded-md border p-2"
          />
        </div>
      </div>
      <div class="mt-4 border-t pt-4 text-right">
        <button
          @click="saveSettings"
          class="rounded-lg bg-primary px-4 py-2 font-bold text-white"
        >
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  </div>
</template>
