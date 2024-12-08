<template>
  <div>
    <h1>Package Cost</h1>
    <p>Package ID: {{ packageId }}</p>

    <!-- Show the package cost if available -->
    <div v-if="cost !== null">
      <h2>Cost</h2>
      <p>{{ cost }}</p>
    </div>

    <!-- Display additional package details -->
    <div v-if="packageDetails">
      <h2>Additional Package Details</h2>
      <pre>{{ packageDetails }}</pre>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script lang="ts">
/* 
This component is responsible for the /package/:id/cost (get) endpoint. 
It displays the cost and additional details of a package based on the package ID.
It utilizes the fetchPackageCost API function to make the request to the backend.
*/

import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchPackageCost } from '../services/api';

export default {
  setup() {
    const route = useRoute(); // Access route parameters
    const packageId = route.params.id as string; // Get the package ID from the route

    const cost = ref(null); // Reactive variable for the cost
    const packageDetails = ref(null); // Reactive variable for the additional package details
    const isLoading = ref(true); // Loading state

    // Fetch data when the component is mounted
    onMounted(async () => {
      try {
        const responseData = await fetchPackageCost(packageId); // Call the API
        cost.value = responseData.cost || 'No cost information available'; // Safely assign cost
        packageDetails.value = responseData; // Store the entire API response
      } catch (err) {
        console.error('Error fetching package cost:', err);
      } finally {
        isLoading.value = false; // Set loading to false regardless of success/failure
      }
    });

    return { packageId, cost, packageDetails, isLoading };
  },
};
</script>

<style scoped>
/* Add any styles specific to this component */
</style>
