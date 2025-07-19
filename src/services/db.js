import Dexie from 'dexie';

export const db = new Dexie('khoEakKhamDB');

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
