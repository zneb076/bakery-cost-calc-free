import Dexie from 'dexie';

export const db = new Dexie('khoEakKhamDB');

db.version(8).stores({
  // เพิ่ม standardWeightInGrams
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
});

db.version(7).stores({
  // เพิ่ม defaultYield และ costByWholeUnit
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
});

db.version(6).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value', // ตารางใหม่: key ที่ไม่ซ้ำกัน และ value
});

// เพิ่มเวอร์ชันใหม่เป็น 5
db.version(5).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  // เพิ่ม 'notes' ในตาราง recipes
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
});

// อัปเกรดเป็นเวอร์ชัน 4
db.version(4).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  // โครงสร้างของ recipes ไม่เปลี่ยน แต่ข้อมูลใน ingredientsList จะเปลี่ยน
  recipes: '++id, &name, isSubRecipe, ingredientsList',
});

// คงเวอร์ชันเก่าไว้
db.version(3).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList',
});
