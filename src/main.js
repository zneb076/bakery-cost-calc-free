import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';
import vueGtag from 'vue-gtag-next';
import RecipeSheetRow from './components/RecipeSheetRow.vue';

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
  faEye,
  faSave,
  faFloppyDisk,
  faDatabase,
  faTools,
  faChevronDown,
  faChevronUp,
  faChartLine,
  faObjectGroup,
  faChartPie,
  faBoxOpen,
  faPlus,
  faEllipsisVertical,
  faQuestionCircle,
  faMoon,
  faSun,
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
  faCheese,
  faEye,
  faSave,
  faFloppyDisk,
  faDatabase,
  faTools,
  faChevronDown,
  faChevronUp,
  faChartLine,
  faChevronDown,
  faUtensils,
  faObjectGroup,
  faChartPie,
  faBoxOpen,
  faPlus,
  faEllipsisVertical,
  faQuestionCircle,
  faMoon,
  faSun
);

const app = createApp(App);

app.use(router);

app.use(vueGtag, {
  property: {
    id: 'G-X2STXFS6X7', // <-- นำ Measurement ID ของคุณมาใส่ที่นี่
  },
});

// ลงทะเบียน FontAwesomeIcon component ให้ใช้ได้ทั่วทั้งโปรเจกต์
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('RecipeSheetRow', RecipeSheetRow);
app.mount('#app');
