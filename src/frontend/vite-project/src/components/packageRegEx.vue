<template>
    <div>
      <h1>Find Packages by RegEx</h1>
      <input v-model="regex" placeholder="Enter RegEx" />
      <button @click="findPackages">Search</button>
      <div v-if="packages.length > 0">
        <ul>
          <li v-for="pkg in packages" :key="pkg.id">{{ pkg.name }}</li>
        </ul>
      </div>
      <div v-else>
        <p>No packages found.</p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref } from 'vue';
  import { byRegex } from '../services/api';
  
  export default {
    setup() {
      const regex = ref('');
      const packages = ref([]);
  
      const findPackages = async () => {
        packages.value = await byRegex(regex.value);
      };
  
      return { regex, packages, findPackages };
    },
  };
  </script>