<template>
  <div>
    <h1>Rate a Package</h1>
    <p>Package ID: {{ packageId }}</p>

    <!-- Display developer-provided rating (does not require input from user) -->
    <div v-if="responseData">
      <h2> Rating</h2>
      <p>Rating: {{ responseData.rating }}</p> <!-- Assuming the response contains a 'rating' field -->
    </div>

    <!-- Show confirmation or returned data -->
    <div v-if="responseData">
      <h3>Rating Details:</h3>
      <pre>{{ responseData }}</pre>
    </div>

    <!-- Show error if any -->
    <div v-if="error">
      <p style="color: red;">Error: {{ error }}</p>
    </div>

    <!-- Show button to trigger rating retrieval -->
    <button @click="ratePackage">Get Rating</button>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { ratePackage } from '../services/api';

export default {
  setup() {
    const route = useRoute(); // Access route parameters
    const packageId = route.params.id as string; // Get the package ID
    const responseData = ref<any>(null); // Store API response data
    const error = ref<string | null>(null); // Error state

    // Function to handle fetching and displaying developer's rating
    const ratePackageHandler = async () => {
      try {
        error.value = null; // Clear any previous errors
        const response = await ratePackage(packageId); // Call API to get the developer's rating
        responseData.value = response; // Store the response data
      } catch (err) {
        console.error('Error retrieving rating:', err);
        error.value = 'Failed to retrieve rating. Please try again.';
      }
    };

    return { packageId, responseData, error, ratePackage: ratePackageHandler };
  },
};
</script>
