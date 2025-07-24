<template>
  <div class="rounded-t-lg bg-white p-6 pb-1 shadow-md md:p-8 dark:bg-gray-700">
    <h1
      class="mb-4 text-3xl font-bold text-primary md:text-4xl dark:text-slate-200"
    >
      ยินดีต้อนรับสู่ "ขออีกคำ" Bakery Cost Calculator
    </h1>
    <img src="/logo.png" alt="ขออีกคำ Logo" class="mx-auto mb-4 h-32 w-32" />
    <p class="text-lg text-gray-700 dark:text-slate-200">
      ผู้ช่วยคนใหม่ของคุณในการคำนวณต้นทุนเบเกอรี่ ช่วยให้คุณสามารถวางแผนการผลิต,
      กำหนดราคาขาย, และมองเห็นกำไรได้อย่างแม่นยำและง่ายดาย
    </p>
  </div>
  <div class="rounded-b-lg bg-white p-4 shadow-md md:p-6 dark:bg-gray-700">
    <div
      class="mx-auto mb-6 max-w-2xl rounded-md border border-yellow-300 bg-yellow-100 p-2 text-sm text-yellow-800 dark:bg-red-100 dark:text-gray-600"
    >
      แอปพลิเคชันนี้ใช้งานได้ฟรี <span class="text-lg">100%</span>
      และมีวัตถุประสงค์เพื่อแบ่งปันสำหรับสังคมคนทำเบเกอรี่
      ห้ามมิให้นำไปจำหน่ายหรือแสวงหาผลกำไรทางการค้าโดยเด็ดขาด
    </div>

    <div class="border-t pt-6">
      <h2
        class="mb-3 text-2xl font-semibold text-secondary dark:text-slate-200"
      >
        เริ่มต้นใช้งานง่ายๆ ใน 3 ขั้นตอน
      </h2>
      <div class="mb-4">
        ไปที่แถบเมนู <font-awesome-icon icon="bars" class="h-4 w-4" /> บนขวา
      </div>

      <ul class="space-y-4 text-gray-600 dark:text-slate-200">
        <li class="flex items-start">
          <span
            class="mr-3 h-6 w-6 flex-shrink-0 rounded-full bg-secondary text-center font-bold text-white"
            >1</span
          >
          <div>
            <h3 class="font-bold">จัดการวัตถุดิบ</h3>
            <p>
              ไปที่หน้า "<font-awesome-icon icon="cheese" class="w-6" />
              จัดการวัตถุดิบ" เพื่อเพิ่มวัตถุดิบทั้งหมดที่คุณใช้
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
              ไปที่หน้า "<font-awesome-icon icon="book" class="w-6" />
              จัดการสูตรขนม" เพื่อสร้างสูตรขนมของคุณ ทั้งสูตรหลักและสูตรย่อย
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
              ไปที่หน้า "<font-awesome-icon icon="calculator" class="w-6" />
              คำนวณต้นทุน" เลือกสูตรที่ต้องการ, จำนวนที่จะผลิต,
              และน้ำหนักต่อชิ้น ระบบจะคำนวณต้นทุนทั้งหมดและแนะนำราคาขายให้ทันที
            </p>
          </div>
        </li>
      </ul>
    </div>

    <div
      class="mt-8 rounded-lg border-t bg-gray-50 px-2 pt-6 text-center dark:border-t-0 dark:bg-gray-700"
    >
      <p class="mb-8 text-gray-700 dark:text-slate-200">
        <span class="text-xl font-semibold text-primary"
          >แอปพลิเคชันนี้สร้างขึ้นด้วยความตั้งใจ</span
        >
        ที่จะช่วยเพื่อนๆ ชาวเบเกอรี่ทุกคนในการคำนวนต้นทุน ราคาขาย และคำนวนสูตร
        ได้สะดวกยิ่งขึ้น หากคุณชื่นชอบและเห็นว่าแอปนี้มีประโยชน์
        สามารถช่วยสนับสนุนและเป็นกำลังใจให้เราได้ง่ายๆ โดยการกดไลก์และติดตามเพจ
        "ขออีกคำ" ของเรา ขอบคุณครับ
      </p>
      <a
        href="https://www.facebook.com/profile.php?id=61556714365876"
        target="_blank"
        ><img
          src="/my-logo.png"
          alt="Logo"
          class="mx-auto mb-2 h-24 w-24 opacity-95"
        />
      </a>
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
