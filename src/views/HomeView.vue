<template>
  <div class="rounded-lg bg-white p-6 shadow-md md:p-8">
    <h1 class="mb-4 text-3xl font-bold text-primary md:text-4xl">
      ยินดีต้อนรับสู่ "ขออีกคำ" Bakery Cost Calculator
    </h1>
    <img src="/logo.png" alt="ขออีกคำ Logo" class="mx-auto mb-4 h-32 w-32" />
    <p class="mb-6 text-lg text-gray-700">
      แอปพลิเคชันที่จะมาเป็นผู้ช่วยคนสำคัญของคุณในการคำนวณต้นทุนเบเกอรี่
      ช่วยให้คุณสามารถวางแผนการผลิต, กำหนดราคาขาย,
      และมองเห็นกำไรได้อย่างแม่นยำและง่ายดาย
    </p>

    <div class="border-t pt-6">
      <h2 class="mb-3 text-2xl font-semibold text-secondary">
        เริ่มต้นใช้งานง่ายๆ ใน 3 ขั้นตอน
      </h2>
      <ul class="space-y-4 text-gray-600">
        <li class="flex items-start">
          <span
            class="mr-3 h-6 w-6 flex-shrink-0 rounded-full bg-secondary text-center font-bold text-white"
            >1</span
          >
          <div>
            <h3 class="font-bold">จัดการวัตถุดิบ</h3>
            <p>
              ไปที่หน้า "จัดการวัตถุดิบ" เพื่อเพิ่มวัตถุดิบทั้งหมดที่คุณใช้
              พร้อมราคาและหน่วยที่ซื้อมา ระบบจะคำนวณ "ราคาต่อกรัม"
              ให้โดยอัตโนมัติ
            </p>
          </div>
        </li>
        <li class="flex items-start">
          <span
            class="mr-3 h-6 w-6 flex-shrink-0 rounded-full bg-secondary text-center font-bold text-white"
            >2</span
          >
          <div>
            <h3 class="font-bold">สร้างสูตรของคุณ</h3>
            <p>
              ไปที่หน้า "จัดการสูตรขนม" เพื่อสร้างสูตรขนมของคุณ
              ทั้งสูตรหลักและสูตรย่อย
              โดยเลือกวัตถุดิบที่คุณเพิ่มไว้ในขั้นตอนแรกและใส่ปริมาณที่ใช้ในสูตร
            </p>
          </div>
        </li>
        <li class="flex items-start">
          <span
            class="mr-3 h-6 w-6 flex-shrink-0 rounded-full bg-secondary text-center font-bold text-white"
            >3</span
          >
          <div>
            <h3 class="font-bold">คำนวณต้นทุนและราคาขาย</h3>
            <p>
              ไปที่หน้า "คำนวณต้นทุน" เลือกสูตรที่ต้องการ, จำนวนที่จะผลิต,
              และน้ำหนักต่อชิ้น ระบบจะคำนวณต้นทุนทั้งหมดและแนะนำราคาขายให้ทันที
            </p>
          </div>
        </li>
      </ul>
    </div>

    <div class="mt-8 rounded-lg border-t bg-gray-50 p-6 pt-6 text-center">
      <h2 class="mb-3 text-2xl font-semibold text-primary">
        ร่วมเป็นส่วนหนึ่งของเรา
      </h2>
      <p class="mb-4 text-gray-700">
        แอปพลิเคชันนี้สร้างขึ้นด้วยความตั้งใจที่จะช่วยเหลือเพื่อนๆ
        ชาวเบเกอรี่ทุกคน หากคุณชื่นชอบและเห็นว่าแอปนี้มีประโยชน์
        สามารถช่วยสนับสนุนและเป็นกำลังใจให้เราได้ง่ายๆ โดยการกดไลก์และติดตามเพจ
        "ขออีกคำ" ของเรา
      </p>
      <a
        href="https://www.facebook.com/profile.php?id=61556714365876"
        target="_blank"
        class="inline-flex items-center space-x-2 text-blue-600 no-underline transition-colors hover:no-underline"
      >
        <font-awesome-icon
          :icon="['fab', 'facebook']"
          size="lg"
          class="text-secondary"
        />
        <span class="font-semibold text-secondary"
          >ขออีกคำ - homemade bakery</span
        >
      </a>
    </div>
  </div>
</template>
