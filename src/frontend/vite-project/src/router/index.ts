import { createRouter, createWebHistory } from 'vue-router';
import PackageList from '../components/PackageList.vue';
import PackageDetails from '../components/PackageDetails.vue';
import DeletePackage from '../components/DeletePackage.vue';

const routes = [
  {
    path: "/package/:id",
    name: "PackageDetails",
    component: PackageDetails, // Component for viewing package details
  },
  {
    path: "/delete/:id",
    name: "DeletePackage",
    component: DeletePackage, // Component for deleting a package
  },
  {
    path: "/upload",
    name: "UploadPackage",
    component: PackageList, // Component for uploading a package
  },
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;