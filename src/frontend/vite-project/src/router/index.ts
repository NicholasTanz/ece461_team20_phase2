/*

routes for the frontend. 

*/

import { createRouter, createWebHistory } from 'vue-router';
import PackageHandler from '../components/PackageHandler.vue';
import resetSystem from '../components/resetSystem.vue';
import Packages from '../components/Packages.vue';
import packageRater from '../components/packageRater.vue';
import packageCost from '../components/packageCost.vue';
import packageRegEx from '../components/packageRegEx.vue';
import packagePost from '../components/packagePost.vue';
import Tracks from '../components/Tracks.vue';

const routes = [
  {
    path: "/package/:id",
    name: "PackageDetails",
    component: PackageHandler, // Component to handle /package:id (get, put, delete)
  },
  {
    path: "/package",
    name: "PostPackage",
    component: packagePost, // Component to handle /package (post)
  },
  {
    path: "/tracks",
    name: "Tracks",
    component: Tracks, // Component to handle /tracks (get)
  },
  {
    path: "/packages",
    name: "UploadPackage",
    component: Packages, // Component to handle /packages (post)
  },
  {
    path: "/reset",
    name: "Reset",
    component: resetSystem, // Component to handle /reset (delete)
  },
  {
    path: "/package/:id/rate",
    name: "RatePackage",
    component: packageRater, // Component to handle /package:id/rate (get)
  },
  {
    path: "/package/:id/cost",
    name: "CostPackage",
    component: packageCost, // Component to handle /package:id/cost (get)
  },
  {
    path: "/package/byRegEx",
    name: "RegExPackage",
    component: packageRegEx, // Component to handle /package/byRegEx (post)
  }
];


const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;