import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CostCalculatorView from '../views/CostCalculatorView.vue';
import RecipeManagementView from '../views/RecipeManagementView.vue';
import IngredientManagementView from '../views/IngredientManagementView.vue';
import SettingsView from '../views/SettingsView.vue';

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
    path: '/settings',
    name: 'Settings',
    component: SettingsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
