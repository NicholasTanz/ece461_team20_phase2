import { createRouter, createWebHistory } from 'vue-router';
import PackageList from '../components/PackageList.vue';
import PackageDetails from '../components/PackageDetails.vue';
import DeletePackage from '../components/DeletePackage.vue';

const routes = [
  { path: '/', name: 'PackageList', component: PackageList },
  { path: '/lookup/:id', name: 'PackageDetails', component: PackageDetails },
  { path: '/delete/:id', name: 'DeletePackage', component: DeletePackage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
