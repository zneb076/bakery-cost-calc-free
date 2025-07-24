<template>
  <div class="rounded-lg bg-white p-2 shadow-md md:p-8">
    <h1 class="mb-4 text-3xl font-bold text-primary">คู่มือการใช้งาน</h1>
    <p class="mb-6 text-gray-600">
      เริ่มต้นใช้งาน "ขออีกคำ" ง่ายๆ ตามขั้นตอนต่อไปนี้
    </p>

    <div
      class="mb-6 rounded-lg border-2 border-dashed border-secondary p-4 text-center"
    >
      <div class="text-sm text-gray-600">
        คุณสามารถโหลดข้อมูลตัวอย่าง (วัตถุดิบและสูตร) เพื่อทดลองเล่นได้ที่หน้า
        <router-link
          :to="{ name: 'SettingsData' }"
          class="font-bold text-secondary"
        >
          <div class="mt-2 text-base">จัดการฐานข้อมูล</div>
        </router-link>
        <div class="mt-2 text-sm font-normal text-red-700">
          ** ถ้ามีข้อมูลที่คุณเพิ่มเองอยู่แล้ว
          การโหลดข้อมูลตัวอย่างจะทำให้ข้อมูลของคุณหายไป **
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="rounded-lg border p-4">
        <h2 class="mb-3 text-2xl font-semibold text-secondary">
          โหมด Basic (สำหรับผู้เริ่มต้น)
        </h2>
        <ol class="list-inside list-decimal space-y-2">
          <li>
            <strong>จัดการวัตถุดิบ:</strong> ไปที่เมนู `จัดการวัตถุดิบ`
            แล้วเพิ่มรายการวัตถุดิบทั้งหมดของคุณ พร้อมราคาและปริมาณที่ซื้อมา
          </li>
          <li>
            <strong>จัดการสูตร:</strong> ไปที่เมนู `จัดการสูตรขนม`
            เพื่อสร้างสูตรของคุณโดยเลือกจากวัตถุดิบที่เพิ่มไว้
          </li>
          <li>
            <strong>คำนวณต้นทุน:</strong> ไปที่เมนู `คำนวณต้นทุน (Basic)`
            เลือกสูตร, ใส่จำนวนและน้ำหนักที่จะทำ,
            ระบบจะคำนวณต้นทุนและราคาขายแนะนำให้ทันที
          </li>
        </ol>
      </div>

      <div class="rounded-lg border p-4">
        <h2 class="mb-3 text-2xl font-semibold text-secondary">
          โหมด Advance (สำหรับวางแผนธุรกิจ)
        </h2>
        <p class="mb-2 text-sm text-gray-600">
          (เปิดใช้งานได้จากสวิตช์ที่เมนู Sidebar)
        </p>
        <ol class="list-inside list-decimal space-y-2">
          <li>
            <strong>จัดการสินค้า:</strong> ไปที่เมนู `จัดการสินค้า`
            เพื่อสร้างรายการขนมที่ขายจริง โดยอ้างอิงจาก "สูตร"
            พร้อมกำหนดน้ำหนักและราคาขาย
          </li>
          <li>
            <strong>คำนวณขั้นสูง:</strong> ไปที่เมนู `คำนวณต้นทุน (Advance)`
            ซึ่งมี 2 โหมด:
            <ul class="ml-5 mt-1 list-inside list-disc">
              <li>
                <strong>หาต้นทุนแฝง:</strong> เหมาะสำหรับคนที่มีร้านและรู้ยอดขาย
                เพื่อหาต้นทุนที่แท้จริงต่อชิ้น
              </li>
              <li>
                <strong>หาจุดคุ้มทุน:</strong>
                เหมาะสำหรับคนที่กำลังวางแผนเปิดร้าน
                เพื่อดูว่าต้องขายเท่าไหร่ถึงจะเริ่มมีกำไร
              </li>
            </ul>
          </li>
        </ol>
      </div>

      <div class="rounded-lg border p-4">
        <h2 class="mb-3 text-2xl font-semibold text-secondary">
          ฟังก์ชันเสริม
        </h2>
        <ul class="list-inside list-disc">
          <li>
            <strong>ตั้งค่า:</strong> สามารถสำรอง/กู้คืนข้อมูล
            และตั้งค่าเริ่มต้นต่างๆ ได้
          </li>
          <li>
            <strong>ติดตั้งแอป (PWA):</strong> บนมือถือ สามารถกด
            "เพิ่มลงในหน้าจอหลัก" (Add to Home Screen)
            เพื่อใช้งานแอปได้เหมือนแอปทั่วไป แม้ไม่มีอินเทอร์เน็ต
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
