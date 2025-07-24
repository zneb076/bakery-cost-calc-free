<template>
  <div>
    <h1 class="mb-6 p-4 text-2xl font-bold">คำนวณต้นทุน (Advance)</h1>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <router-link
        :to="{ name: 'CalculatorOverhead' }"
        class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-700"
      >
        <div class="flex items-center space-x-4 py-4 dark:bg-gray-700">
          <font-awesome-icon
            icon="calculator"
            class="text-3xl text-secondary"
          />
          <div>
            <h2 class="text-xl font-semibold">คำนวณต้นทุนแฝง</h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-200">
              หาต้นทุนแฝงต่อชิ้นจากยอดขายและต้นทุนคงที่
            </p>
            <!-- <p class="mt-2 text-xs text-red-700">
              * ต้องรู้ยอดขายต่อเดือนและต้นทุนคงที่ (ค่าเช่า, ค่าน้ำ, ค่าไฟ,
              อื่นๆ) เพื่อใช้ในการคำนวน *
            </p> -->
          </div>
        </div>
      </router-link>

      <router-link
        :to="{ name: 'CalculatorBreakEven' }"
        class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:bg-gray-700"
      >
        <div class="flex items-center space-x-4 py-4">
          <font-awesome-icon icon="chart-pie" class="text-3xl text-secondary" />
          <div>
            <h2 class="text-xl font-semibold">หาจุดคุ้มทุน</h2>
            <p class="mt-2 text-sm text-gray-500 dark:text-slate-200">
              คำนวณว่าต้องขายเท่าไหร่ถึงจะเริ่มมีกำไร
            </p>
            <p class="mt-2 text-sm text-gray-500"></p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
