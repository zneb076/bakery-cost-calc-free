import Dexie from 'dexie';

export const db = new Dexie('khoEakKhamDB');

// เราจะกำหนดแค่ Schema เวอร์ชันล่าสุดเวอร์ชันเดียว
// เพื่อให้แน่ใจว่าเมื่อสร้างฐานข้อมูลใหม่ จะใช้โครงสร้างนี้แน่นอน
db.version(3).stores({
  // กำหนด index ให้ชัดเจน
  // ++id: Primary Key
  // &name: Unique Index
  // isSubRecipe: Simple Index
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList',
});
