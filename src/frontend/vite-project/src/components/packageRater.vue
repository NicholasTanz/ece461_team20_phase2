<template>
  <div>
    <h1>Rate a Package</h1>
    <p>Package ID: {{ packageId }}</p>

    <!-- Input for rating -->
    <input v-model.number="rating" type="number" min="1" max="5" placeholder="Enter rating (1-5)" />

    <!-- Submit button -->
    <button @click="ratePackage">Submit Rating</button>

    <!-- Show confirmation or returned data -->
    <div v-if="responseData">
      <h2>Rating Submitted</h2>
      <pre>{{ responseData }}</pre>
    </div>

    <!-- Show error if any -->
    <div v-if="error">
      <p style="color: red;">Error: {{ error }}</p>
    </div>
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
    const rating = ref<number>(0); // User-provided rating (bound to input)
    const responseData = ref(null); // Store API response data
    const error = ref<string | null>(null); // Error state

    // Function to handle rating submission
    const ratePackageHandler = async () => {
      try {
        error.value = null; // Clear any previous errors
        const response = await ratePackage(packageId); // Call API
        responseData.value = response; // Store the response data
        alert(`Rating submitted successfully!`);
      } catch (err) {
        console.error('Error submitting rating:', err);
        error.value = 'Failed to submit rating. Please try again.';
      }
    };

    return { packageId, rating, responseData, error, ratePackage: ratePackageHandler };
  },
};
</script>
