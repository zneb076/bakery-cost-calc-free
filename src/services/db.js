import Dexie from 'dexie';

export const db = new Dexie('khoEakKhamDB');

db.version(13).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
  products: '++id, &name, recipeId, weight, price',
  analysisGroups: '++id, &name, groupType, products',
});

db.version(12).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
  products: '++id, &name, recipeId', // Before weight & price
  analysisGroups: null, // Removed
});

db.version(11).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
  analysisGroups: '++id, &name, groupType, recipes',
  products: '++id, &name, recipeId',
});

db.version(10)
  .stores({
    ingredients:
      '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
    recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
    settings: '&key, value',
    analysisGroups: '++id, &name, groupType, recipes',
  })
  .upgrade((tx) => {
    // Upgrade function to add 'groupType' to existing groups from v9
    return tx
      .table('analysisGroups')
      .toCollection()
      .modify((group) => {
        group.groupType = 'general';
      });
  });

db.version(9).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
  analysisGroups: '++id, &name, recipes',
});

db.version(8)
  .stores({
    ingredients:
      '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
    recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
    settings: '&key, value',
  })
  .upgrade((tx) => {
    return tx
      .table('ingredients')
      .toCollection()
      .modify((ingredient) => {
        if (ingredient.standardWeightInGrams === undefined)
          ingredient.standardWeightInGrams = null;
        if (ingredient.defaultYield === undefined)
          ingredient.defaultYield = 100;
        if (ingredient.costByWholeUnit === undefined)
          ingredient.costByWholeUnit = false;
      });
  });

db.version(7).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
});

db.version(6).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
  settings: '&key, value',
});

db.version(5).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
});

db.version(4).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe, ingredientsList',
});

db.version(3).stores({
  ingredients:
    '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
  recipes: '++id, &name, isSubRecipe',
});

// db.version(13).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
//   products: '++id, &name, recipeId, weight, price',
//   analysisGroups: '++id, &name, groupType, products',
// });

// // คงเวอร์ชันเก่าไว้
// db.version(12).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
//   products: '++id, &name, recipeId',
//   analysisGroups: null,
// });

// db.version(11).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
//   analysisGroups: '++id, &name, groupType, recipes',
//   products: '++id, &name, recipeId', // ตารางใหม่สำหรับสินค้า
// });

// db.version(10).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
//   // เพิ่ม index 'groupType'
//   analysisGroups: '++id, &name, groupType, recipes',
// });

// // คงเวอร์ชันเก่าไว้
// db.version(9).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
//   analysisGroups: '++id, &name, recipes', // ตารางใหม่
// });

// db.version(8)
//   .stores({
//     ingredients:
//       '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit, standardWeightInGrams',
//     recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//     settings: '&key, value',
//   })
//   .upgrade((tx) => {
//     // ฟังก์ชันนี้จะทำงานสำหรับผู้ใช้ที่มีฐานข้อมูลเวอร์ชัน 7 หรือต่ำกว่า
//     // เพื่ออัปเกรดข้อมูล ingredients ให้มีโครงสร้างของเวอร์ชัน 8
//     return tx
//       .table('ingredients')
//       .toCollection()
//       .modify((ingredient) => {
//         // เพิ่มฟิลด์ใหม่เข้าไปพร้อมค่าเริ่มต้น
//         if (ingredient.standardWeightInGrams === undefined) {
//           ingredient.standardWeightInGrams = null;
//         }
//         if (ingredient.defaultYield === undefined) {
//           ingredient.defaultYield = 100;
//         }
//         if (ingredient.costByWholeUnit === undefined) {
//           ingredient.costByWholeUnit = false;
//         }
//       });
//   });

// db.version(7).stores({
//   // เพิ่ม defaultYield และ costByWholeUnit
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram, defaultYield, costByWholeUnit',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value',
// });

// db.version(6).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
//   settings: '&key, value', // ตารางใหม่: key ที่ไม่ซ้ำกัน และ value
// });

// // เพิ่มเวอร์ชันใหม่เป็น 5
// db.version(5).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
//   // เพิ่ม 'notes' ในตาราง recipes
//   recipes: '++id, &name, isSubRecipe, ingredientsList, notes',
// });

// // อัปเกรดเป็นเวอร์ชัน 4
// db.version(4).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
//   // โครงสร้างของ recipes ไม่เปลี่ยน แต่ข้อมูลใน ingredientsList จะเปลี่ยน
//   recipes: '++id, &name, isSubRecipe, ingredientsList',
// });

// // คงเวอร์ชันเก่าไว้
// db.version(3).stores({
//   ingredients:
//     '++id, &name, purchaseUnit, purchaseQuantity, purchasePrice, costPerGram',
//   recipes: '++id, &name, isSubRecipe, ingredientsList',
// });
