<template>
    <div>
      <h1>All Packages</h1>
      <ul>
        <li v-for="pkg in packages" :key="pkg.id">
          <router-link :to="`/lookup/${pkg.id}`">{{ pkg.name }}</router-link>
          <router-link :to="`/delete/${pkg.id}`">Delete</router-link>
        </li>
      </ul>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
//  import { fetchPackages } from '../api';
  
  export default {
    setup() {
      const packages = ref([]);
  
/*      onMounted(async () => {
        packages.value = await fetchPackages();
      });
  */
 
      return { packages };
    },
  };
  </script>
  