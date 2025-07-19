<script setup>
import { onMounted } from 'vue';
import { useFontSwitcher } from './composables/useFontSwitcher.js';
import Navbar from './components/Navbar.vue';
import { db } from './services/db.js';
import ScrollToTopButton from './components/ScrollToTopButton.vue';

const { loadInitialFont, toggleFont } = useFontSwitcher();

onMounted(async () => {
  loadInitialFont();

  // เพิ่มข้อมูลวัตถุดิบจำลอง (ชุดนี้ถูกต้องแล้ว)
  const ingredientCount = await db.ingredients.count();
  if (ingredientCount === 0) {
    console.log('Adding mock ingredients...');
    await db.ingredients.bulkAdd([
      {
        name: 'แป้งเค้ก',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 1000,
        purchasePrice: 45,
        costPerGram: 0.045,
        id: 1,
      },
      {
        name: 'น้ำตาลไอซิ่ง',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 900,
        purchasePrice: 50,
        costPerGram: 0.0555,
        id: 2,
      },
      {
        name: 'เนยสดชนิดจืด',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 227,
        purchasePrice: 120,
        costPerGram: 0.5286,
        id: 3,
      },
      {
        name: 'ไข่ไก่ (เบอร์ 1)',
        purchaseUnit: 'ฟอง',
        purchaseQuantity: 30,
        purchasePrice: 130,
        costPerGram: 0.07222222222222222,
        id: 4,
      },
      {
        name: 'นมสดรสจืด',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 800,
        purchasePrice: 50,
        costPerGram: 0.0625,
        id: 5,
      },
      {
        name: 'ผงโกโก้',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 200,
        purchasePrice: 85,
        costPerGram: 0.425,
        id: 6,
      },
      {
        name: 'ดาร์กช็อกโกแลต 70%',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 500,
        purchasePrice: 350,
        costPerGram: 0.7,
        id: 7,
      },
      {
        name: 'กลิ่นวานิลลา',
        purchaseUnit: 'มิลลิลิตร',
        purchaseQuantity: 25,
        purchasePrice: 60,
        costPerGram: 2.4,
        id: 8,
      },

      {
        name: 'นมผงฮอกไกโด',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 480,
        purchasePrice: 140,
        costPerGram: 0.2916666666666667,
        id: 10,
      },
      {
        name: 'ยีสต์',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 500,
        purchasePrice: 140,
        costPerGram: 0.28,
        id: 11,
      },
      {
        name: 'เกลือ',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 1000,
        purchasePrice: 30,
        costPerGram: 0.03,
        id: 12,
      },
      {
        name: 'วิป',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 1000,
        purchasePrice: 240,
        costPerGram: 0.24,
        id: 13,
      },
      {
        name: 'เนยจืด',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 5000,
        purchasePrice: 1600,
        costPerGram: 0.32,
        id: 14,
      },
      {
        name: 'น้ำร้อน',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 600,
        purchasePrice: 5,
        costPerGram: 0.008333333333333333,
        id: 15,
      },
      {
        name: 'น้ำตาล',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 1000,
        purchasePrice: 31,
        costPerGram: 0.031,
        id: 16,
      },
      {
        name: 'น้ำมันพืช',
        purchaseUnit: 'ลิตร',
        purchaseQuantity: 1,
        purchasePrice: 60,
        costPerGram: 0.06315789473684211,
        id: 17,
      },
    ]);
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-gray-800">
    <Navbar @toggle-font="toggleFont" />
    <main class="container mx-auto p-2">
      <router-view />
    </main>
    <ScrollToTopButton />
  </div>
</template>

<style>
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
