<template>
  <div>
    <h1>Find Packages by RegEx</h1>
    <input v-model="regex" placeholder="Enter RegEx" />
    <button @click="findPackages">Search</button>

    <!-- Display list of packages if found -->
    <div v-if="packages.length > 0">
      <ul>
        <li v-for="pkg in packages" :key="pkg.id">{{ pkg.name }}</li>
      </ul>
    </div>

    <!-- Show no packages found message -->
    <div v-else>
      <p>No packages found.</p>
    </div>
  </div>
</template>

<script lang="ts">
/* 

This component is responsible for the /package/byRegEx (post) endpoint. 

It provides a button to search for packages utilizing RegEx and displays the result.

It utilizes the byRegex API function to make the request to the backend.

*/

import { ref } from 'vue';
import { byRegex } from '../services/api';

export default {
  setup() {
    const regex = ref(''); // Holds the RegEx input from user
    const packages = ref<any[]>([]); // Holds the list of packages

    // Function to handle package search
    const findPackages = async () => {
      try {
        packages.value = await byRegex(regex.value); // Call API with regex
      } catch (error) {
        console.error('Error fetching packages:', error);
        alert('Failed to find packages. Please try again.');
      }
    };

    return { regex, packages, findPackages };
  },
};
</script>
