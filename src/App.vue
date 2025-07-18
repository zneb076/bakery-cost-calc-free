<script setup>
import { onMounted } from 'vue';
import { useFontSwitcher } from './composables/useFontSwitcher.js';
import Navbar from './components/Navbar.vue';
import { db } from './services/db.js';

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
      },
      {
        name: 'น้ำตาลไอซิ่ง',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 900,
        purchasePrice: 50,
        costPerGram: 0.0555,
      },
      {
        name: 'เนยสดชนิดจืด',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 227,
        purchasePrice: 120,
        costPerGram: 0.5286,
      },
      {
        name: 'ไข่ไก่ (เบอร์ 2)',
        purchaseUnit: 'ฟอง',
        purchaseQuantity: 10,
        purchasePrice: 55,
        costPerGram: 0.11,
      },
      {
        name: 'นมสดรสจืด',
        purchaseUnit: 'มิลลิลิตร',
        purchaseQuantity: 200,
        purchasePrice: 13,
        costPerGram: 0.065,
      },
      {
        name: 'ผงโกโก้',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 200,
        purchasePrice: 85,
        costPerGram: 0.425,
      },
      {
        name: 'ดาร์กช็อกโกแลต 70%',
        purchaseUnit: 'กรัม',
        purchaseQuantity: 500,
        purchasePrice: 350,
        costPerGram: 0.7,
      },
      {
        name: 'กลิ่นวานิลลา',
        purchaseUnit: 'มิลลิลิตร',
        purchaseQuantity: 25,
        purchasePrice: 60,
        costPerGram: 2.4,
      },
    ]);
  }

  // เพิ่มข้อมูลสูตรจำลอง (แก้ไขให้มี ingredientsList)
  const recipeCount = await db.recipes.count();
  if (recipeCount === 0) {
    console.log('Adding mock recipes with new structure...');
    await db.recipes.bulkAdd([
      // เพิ่ม property 'ingredientsList: []' เข้าไปในแต่ละ object
      { name: 'บราวนี่หนึบ', isSubRecipe: false, ingredientsList: [] },
      { name: 'บัตเตอร์ครีม', isSubRecipe: true, ingredientsList: [] },
      { name: 'คัพเค้กช็อกโกแลต', isSubRecipe: false, ingredientsList: [] },
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
  </div>
</template>

<style>
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
