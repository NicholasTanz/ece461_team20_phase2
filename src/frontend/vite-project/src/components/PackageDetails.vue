<template>
    <div>
      <h1>Package Details</h1>
      <div v-if="packageData">
        <p><strong>Name:</strong> {{ packageData.name }}</p>
        <p><strong>Description:</strong> {{ packageData.description }}</p>
        <p><strong>Version:</strong> {{ packageData.version }}</p>
        <p><strong>Rating:</strong> {{ packageData.rating }}</p>
      </div>
      <div v-else>
        <p>Loading...</p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';  // For accessing the route params
//  import { fetchPackageById } from '../api';  // Import the API function
  
  export default {
    setup() {
      const route = useRoute();  // Access route params
      const packageData = ref(null);
  
  /*    // Fetch the package details based on the ID in the route params
      onMounted(async () => {
        const id = route.params.id as string;
        packageData.value = await fetchPackageById(id);
      });
  */
      return { packageData };
    },
  };
  </script>
  
  <style scoped>
  h1 {
    font-size: 2em;
    margin-bottom: 20px;
  }
  
  p {
    font-size: 1.2em;
    margin: 5px 0;
  }
  </style>
  