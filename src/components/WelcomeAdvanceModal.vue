<script setup>
import { ref } from 'vue';
import BaseModal from './BaseModal.vue';

const emit = defineEmits(['close']);
const dontShowAgain = ref(false);

function close() {
  emit('close', dontShowAgain.value);
}
</script>

<template>
  <BaseModal @close="close(false)">
    <div class="p-4">
      <h2 class="mb-4 text-2xl font-bold text-secondary">
        ยินดีต้อนรับสู่โหมด Advance!
      </h2>
      <div class="space-y-3 text-gray-700">
        <p>
          โหมดนี้ปลดล็อกฟังก์ชันการวิเคราะห์ต้นทุนเชิงลึก
          เหมาะสำหรับผู้ที่ต้องการวางแผนธุรกิจอย่างจริงจัง
        </p>
        <div>
          <p class="font-semibold">สิ่งที่คุณต้องทำก่อน:</p>
          <ul class="list-inside list-disc pl-4 text-sm">
            <li>
              เนื่องจากการคำนวนต้นทุนแฝงและจุดคุ้มทุน
              จำเป็นต้องสร้างสินค้าขึ้นมาจากสูตรที่คุณมี ให้ไปที่หน้า
              <router-link
                :to="{ name: 'Products' }"
                @click="close()"
                class="font-semibold text-primary hover:underline"
                >'จัดการสินค้า'</router-link
              >

              เพื่อสร้างรายการสินค้าที่จะขาย โดยอ้างอิงจากสูตรที่คุณมี
            </li>
          </ul>
        </div>
        <div>
          <p class="font-semibold">ฟังก์ชันที่เพิ่มเข้ามา:</p>
          <ul class="list-inside list-disc pl-4 text-sm">
            <li>**คำนวณต้นทุนแฝง:** หาต้นทุนที่แท้จริงของสินค้าแต่ละชิ้น</li>
            <li>**หาจุดคุ้มทุน:** คำนวณว่าต้องขายเท่าไหร่ถึงจะเริ่มมีกำไร</li>
          </ul>
        </div>
      </div>

      <div class="mt-3 border-l-4 border-yellow-400 bg-yellow-50 p-3">
        <p class="font-semibold text-yellow-800">สิ่งสำคัญที่ต้องรู้:</p>
        <p class="text-sm text-yellow-700">
          การคำนวณทั้งสองโหมดนี้จำเป็นต้องใช้ **"ต้นทุนคงที่รวมต่อเดือน"** (เช่น
          ค่าเช่าร้าน, ค่าน้ำ-ค่าไฟ, เงินเดือน) เพื่อนำมาคำนวณหาผลลัพธ์ที่แม่นยำ
        </p>
      </div>

      <div class="mt-6 border-t pt-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="dont-show"
              type="checkbox"
              v-model="dontShowAgain"
              class="h-4 w-4 rounded text-primary"
            />
            <label for="dont-show" class="ml-2 text-sm text-gray-600"
              >ไม่ต้องแสดงอีก</label
            >
          </div>
          <button
            @click="close(true)"
            class="rounded-lg bg-primary px-4 py-2 font-bold text-white"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
