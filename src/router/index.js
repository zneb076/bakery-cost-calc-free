import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CostCalculatorView from '../views/CostCalculatorView.vue';
import RecipeManagementView from '../views/RecipeManagementView.vue';
import IngredientManagementView from '../views/IngredientManagementView.vue';
import SettingsDataView from '../views/SettingsDataView.vue'; // สร้าง View ใหม่
import SettingsGeneralView from '../views/SettingsGeneralView.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/calculator',
    name: 'Calculator',
    component: CostCalculatorView,
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: RecipeManagementView,
  },

  {
    path: '/ingredients',
    name: 'Ingredients',
    component: IngredientManagementView,
  },

  {
    path: '/settings/data',
    name: 'SettingsData',
    component: SettingsDataView,
  },
  {
    path: '/settings/general',
    name: 'SettingsGeneral',
    component: SettingsGeneralView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
