import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

/* Font Awesome Configuration */
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faPencil,
  faTrash,
  faXmark,
  faLanguage,
  faBars,
  faFont,
  faArrowUp,
  faCircleInfo,
  faHome,
  faCalculator,
  faBook,
  faListCheck,
  faCog,
  faBreadSlice,
  faUtensils,
  faCheese,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons'; // 1. Import faFacebook

// เพิ่มไอคอนทั้งหมดที่คุณต้องการใช้ในโปรเจกต์ที่นี่
library.add(
  faPencil,
  faTrash,
  faXmark,
  faLanguage,
  faBars,
  faFont,
  faArrowUp,
  faCircleInfo,
  faFacebook,
  faHome,
  faCalculator,
  faBook,
  faListCheck,
  faCog,
  faBreadSlice,
  faUtensils,
  faCheese
);

const app = createApp(App);

app.use(router);

// ลงทะเบียน FontAwesomeIcon component ให้ใช้ได้ทั่วทั้งโปรเจกต์
app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');
