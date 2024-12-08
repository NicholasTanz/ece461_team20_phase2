<template>
  <div>
    <h1>Planned Track</h1>
    <pre>{{ response }}</pre> <!-- Display the raw response -->
  </div>
</template>

<script lang="ts">
/* 

This component is responsible for the /tracks (get) endpoint. 

It retrieves the planned track from the backend and displays the raw API response.

It utilizes the fetchTrack API function to make the request to the backend.

*/

import { fetchTrack } from '../services/api';
import { ref } from 'vue';

export default {
  setup() {
    // Store for the API response
    const response = ref<any>(null);

    // Handler to fetch and display the response
    const getTrack = async () => {
      try {
        response.value = await fetchTrack(); // Call API and store the raw response
        console.log(response.value); // Log the full response for debugging
      } catch (error) {
        console.error('Error fetching the planned track:', error);
        alert('Failed to load planned track. Please try again.'); // Error alert
      }
    };

    // Fetch the track immediately
    getTrack();

    return { response };
  },
};
</script>
