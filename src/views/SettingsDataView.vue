<script setup>
import { ref } from 'vue';
import { db } from '../services/db.js';
import Swal from 'sweetalert2';

const activeTab = ref('data'); // แท็บเริ่มต้น
const DB_VERSION = 4; // เวอร์ชันปัจจุบันของฐานข้อมูล

// --- ฟังก์ชันสำหรับ Backup/Restore ---

// 1. ฟังก์ชัน Export (Backup)
async function exportData() {
  try {
    const ingredients = await db.ingredients.toArray();
    const recipes = await db.recipes.toArray();

    const backupObject = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        ingredients,
        recipes,
      },
    };

    const blob = new Blob([JSON.stringify(backupObject, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.download = `kho-eak-kham-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Export failed:', error);
    Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้', 'error');
  }
}

// 2. ฟังก์ชัน Import (Restore)
function triggerImport() {
  document.getElementById('import-file-input').click();
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  try {
    const backupObject = JSON.parse(text);

    // 3. เรียกใช้ฟังก์ชันแปลงข้อมูล
    const migratedData = migrateData(backupObject);

    // 4. ยืนยันก่อนทับข้อมูล
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: 'การนำเข้าข้อมูลจะลบข้อมูลที่มีอยู่ทั้งหมดและแทนที่ด้วยข้อมูลจากไฟล์ Backup!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ใช่, นำเข้าเลย!',
      cancelButtonText: 'ยกเลิก',
    });

    if (result.isConfirmed) {
      await db.transaction('rw', db.ingredients, db.recipes, async () => {
        await db.ingredients.clear();
        await db.recipes.clear();
        await db.ingredients.bulkAdd(migratedData.ingredients);
        await db.recipes.bulkAdd(migratedData.recipes);
      });
      await Swal.fire('สำเร็จ!', 'นำเข้าข้อมูลเรียบร้อยแล้ว', 'success');
      // รีโหลดหน้าเพื่อให้ข้อมูลใหม่แสดงผล
      window.location.reload();
    }
  } catch (error) {
    console.error('Import failed:', error);
    Swal.fire(
      'เกิดข้อผิดพลาด',
      'ไฟล์ Backup ไม่ถูกต้อง หรือเกิดปัญหาในการนำเข้า',
      'error'
    );
  } finally {
    // รีเซ็ต input เพื่อให้เลือกไฟล์เดิมซ้ำได้
    event.target.value = '';
  }
}

// 5. ฟังก์ชันแปลงข้อมูล (Migration)
function migrateData(backupObject) {
  let version = backupObject.version || 1;
  let data = backupObject.data;

  if (!data || !data.ingredients || !data.recipes) {
    throw new Error('Invalid backup file structure');
  }

  // ตัวอย่างการแปลงข้อมูล
  // คุณสามารถเพิ่มเงื่อนไข if (version < X) ... ได้เรื่อยๆ ในอนาคต
  if (version < 4) {
    // ในเวอร์ชัน 4 เราเปลี่ยนโครงสร้าง recipes.ingredientsList
    // แต่ไฟล์ backup จาก v.3 จะยังไม่มีโครงสร้างนี้
    // เราต้องแปลงมันก่อน
    data.recipes.forEach((recipe) => {
      if (recipe.ingredientsList && Array.isArray(recipe.ingredientsList)) {
        // สมมติฐาน: ถ้าเป็นข้อมูลเก่ามาก อาจจะเป็นแค่ array ของ ID
        // แต่ในกรณีของเรา โครงสร้างจาก v.3 ไป v.4 ไม่ได้ซับซ้อนมาก
        // โค้ดนี้เป็นเพียงตัวอย่างการแปลง
      }
    });
    version = 4;
  }

  console.log(`Data migrated from v${backupObject.version} to v${version}`);
  return data;
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-8 md:flex-row">
      <main class="flex-grow">
        <div class="rounded-lg bg-white p-6 shadow-md">
          <h2 class="mb-4 text-2xl font-semibold">สำรองและนำเข้าข้อมูล</h2>
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold">สำรองข้อมูล (Backup)</h3>
              <p class="mb-2 text-sm text-gray-500">
                บันทึกข้อมูลวัตถุดิบและสูตรทั้งหมดของคุณเป็นไฟล์ `.json`
              </p>
              <button
                @click="exportData"
                class="rounded-lg bg-secondary px-4 py-2 font-bold text-white"
              >
                สำรองข้อมูล
              </button>
            </div>
            <hr />
            <div>
              <h3 class="font-semibold">นำเข้าข้อมูล (Restore)</h3>
              <p class="mb-2 text-sm text-gray-500">
                <span class="font-bold text-red-500">คำเตือน:</span>
                การนำเข้าข้อมูลจะลบข้อมูลปัจจุบันทั้งหมดทิ้ง
              </p>
              <button
                @click="triggerImport"
                class="rounded-lg border border-primary px-4 py-2 font-bold text-primary"
              >
                นำเข้าข้อมูล
              </button>
              <input
                type="file"
                id="import-file-input"
                @change="importData"
                class="hidden"
                accept=".json"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
