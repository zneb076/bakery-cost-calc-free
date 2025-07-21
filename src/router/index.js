import { createRouter, createWebHashHistory } from 'vue-router';
// ไม่ต้อง import component ที่นี่แล้ว

const routes = [
  {
    path: '/',
    name: 'Home',
    // เปลี่ยนมาใช้ dynamic import
    component: () => import('../views/HomeView.vue'),
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
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
