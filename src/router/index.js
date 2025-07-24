import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
// ไม่ต้อง import component ที่นี่แล้ว

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/calculator',
    name: 'Calculator',
    component: () => import('../views/CostCalculatorView.vue'),
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('../views/RecipeManagementView.vue'),
  },
  {
    path: '/ingredients',
    name: 'Ingredients',
    component: () => import('../views/IngredientManagementView.vue'),
  },
  {
    path: '/settings/data',
    name: 'SettingsData',
    component: () => import('../views/SettingsDataView.vue'),
  },
  {
    path: '/settings/general',
    name: 'SettingsGeneral',
    component: () => import('../views/SettingsGeneralView.vue'),
  },

  {
    path: '/calculator-advance', // 2. กำหนด path
    name: 'CalculatorAdvance',
    component: () => import('../views/AdvanceCalculatorView.vue'), // 3. ชี้มาที่ Component ใหม่
  },
  {
    path: '/calculator-breakeven', // path ใหม่
    name: 'CalculatorBreakEven',
    component: () => import('../views/BreakEvenCalculatorView.vue'),
  },
  {
    path: '/calculator-overhead', // path ใหม่
    name: 'CalculatorOverhead',
    component: () => import('../views/OverheadCalculatorView.vue'),
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/ProductManagementView.vue'),
  },
  {
    path: '/guide',
    name: 'UserGuide',
    component: () => import('../views/UserGuideView.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
