import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
// ไม่ต้อง import component ที่นี่แล้ว

const routes = [
  {
    path: '/',
    redirect: '/home', // ถ้าเข้ามาที่ path ว่างๆ ให้ไปที่ /home
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
    meta: {
      videoUrl: 'https://www.youtube.com/embed/98hRp3peBSU',
    },
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: () => import('../views/RecipeManagementView.vue'),
    meta: {
      videoUrl: 'https://www.youtube.com/embed/prMfv3PtmRY',
    },
  },
  {
    path: '/ingredients',
    name: 'Ingredients',
    component: () => import('../views/IngredientManagementView.vue'),
    meta: {
      videoUrl: 'https://youtube.com/embed/tr59CPZVOQk',
    },
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
    component: () => import('../views/AdvanceCalculatorView.vue'),
  },
  {
    path: '/calculator-breakeven', // path ใหม่
    name: 'CalculatorBreakEven',
    component: () => import('../views/BreakEvenCalculatorView.vue'),
    meta: {
      videoUrl: '',
    },
  },
  {
    path: '/calculator-overhead', // path ใหม่
    name: 'CalculatorOverhead',
    component: () => import('../views/OverheadCalculatorView.vue'),
    meta: {
      videoUrl: '',
    },
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/ProductManagementView.vue'),
    meta: {
      videoUrl: '',
    },
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
