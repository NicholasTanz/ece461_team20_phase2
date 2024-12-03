import { createRouter, createWebHistory } from 'vue-router';
import DeletePackage from '../components/DeletePackage.vue';
import PackageHandler from '../components/PackageHandler.vue';
import resetSystem from '../components/resetSystem.vue';
import Packages from '../components/Packages.vue';
import packageRater from '../components/packageRater.vue';
import packageCost from '../components/packageCost.vue';
import packageRegEx from '../components/packageRegEx.vue';

const routes = [
  {
    path: "/package/:id",
    name: "PackageDetails",
    component: PackageHandler, // Component to handle all /package:id interaction (get, put, delete)
  },
  {
    path: "/package",
    name: "DeletePackage",
    component: DeletePackage, // Component to handle /package interaction (post)
  },
  {
    path: "/packages",
    name: "UploadPackage",
    component: Packages, // Component to handle /packages interaction (post)
  },
  {
    path: "/reset",
    name: "Reset",
    component: resetSystem, // Component to handle /reset interaction (delete)
  },
  {
    path: "/package/:id/rate",
    name: "RatePackage",
    component: packageRater, // Component to handle /package:id/rate interaction (get)
  },
  {
    path: "/package/:id/cost",
    name: "CostPackage",
    component: packageCost, // Component to handle /package:id/cost interaction (get)
  },
  {
    path: "/package/byRegEx",
    name: "RegExPackage",
    component: packageRegEx, // Component to handle /package/byRegEx interaction (post)
  }
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;