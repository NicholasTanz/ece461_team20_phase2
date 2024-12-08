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
    <div v-else-if="searchAttempted">
      <p>No packages found.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { byRegex } from '../services/api';

export default {
  setup() {
    const regex = ref(''); // Holds the RegEx input from user
    const packages = ref<{ id: string; name: string }[]>([]); // Holds the list of packages
    const searchAttempted = ref(false); // Tracks if a search was attempted

    // Function to handle package search
    const findPackages = async () => {
      searchAttempted.value = false; // Reset search attempt
      if (!regex.value.trim()) {
        alert('Please enter a valid RegEx.');
        return;
      }

      try {
        const result = await byRegex(regex.value); // Call API with regex
        packages.value = result; // Update packages
        searchAttempted.value = true; // Indicate search completed
      } catch (error) {
        console.error('Error fetching packages:', error);
        alert('Failed to find packages. Please try again.');
      }
    };

    return { regex, packages, findPackages, searchAttempted };
  },
};
</script>
