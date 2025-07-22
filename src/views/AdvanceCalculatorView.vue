<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">เครื่องคำนวณต้นทุน (ขั้นสูง)</h1>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <router-link
        :to="{ name: 'CalculatorOverhead' }"
        class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
      >
        <div class="flex items-center space-x-4">
          <font-awesome-icon
            icon="calculator"
            class="text-3xl text-secondary"
          />
          <div>
            <h2 class="text-xl font-semibold">คำนวณต้นทุนแฝง</h2>
            <p class="text-sm text-gray-500">
              หาต้นทุนแฝงต่อชิ้นจากยอดขายและต้นทุนคงที่
            </p>
          </div>
        </div>
      </router-link>

      <router-link
        :to="{ name: 'CalculatorBreakEven' }"
        class="block rounded-lg bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
      >
        <div class="flex items-center space-x-4">
          <font-awesome-icon icon="chart-pie" class="text-3xl text-secondary" />
          <div>
            <h2 class="text-xl font-semibold">หาจุดคุ้มทุน</h2>
            <p class="text-sm text-gray-500">
              คำนวณว่าต้องขายเท่าไหร่ถึงจะเริ่มมีกำไร
            </p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
