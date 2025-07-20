<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

const close = async () => {
  offlineReady.value = false;
  needRefresh.value = false;
};
</script>

<template>
  <div
    v-if="offlineReady || needRefresh"
    class="fixed bottom-0 right-0 z-50 m-4 rounded-lg border bg-white p-4 shadow-lg"
    role="alert"
  >
    <div class="flex items-start gap-4">
      <div class="flex-grow">
        <p v-if="offlineReady" class="font-semibold">
          แอปพร้อมทำงานแบบออฟไลน์แล้ว
        </p>
        <p v-else class="font-semibold">มีอัปเดตใหม่พร้อมใช้งาน</p>
      </div>
      <div>
        <button
          v-if="needRefresh"
          @click="updateServiceWorker()"
          class="mr-2 rounded-md bg-primary px-3 py-1 text-white"
        >
          รีโหลด
        </button>
        <button @click="close()" class="rounded-md border px-3 py-1">
          ปิด
        </button>
      </div>
    </div>
  </div>
</template>
