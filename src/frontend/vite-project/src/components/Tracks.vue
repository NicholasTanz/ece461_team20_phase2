<template>
  <div>
    <h1>Planned Track</h1>
    <p>{{ plannedTrack }}</p>
  </div>
</template>

<script lang="ts">
/* 

This component is responsible for the /tracks (get) endpoint. 

It retrieves the planned track from the backend and displays it.

It utilizes the fetchTrack API function to make the request to the backend.

*/

import { fetchTrack } from '../services/api';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    // Store for the planned track
    const plannedTrack = ref<string>('');

    // Handler to fetch and display the planned track
    const getTrack = async () => {
      try {
        const response = await fetchTrack(); // Call API to get planned track
        console.log(response); // Log the response for debugging
        plannedTrack.value = response.data.plannedTracks[0]; // Assuming only one track is returned
      } catch (error) {
        console.error('Error fetching the planned track:', error);
        alert('Failed to load planned track. Please try again.'); // Error alert
      }
    };

    onMounted(() => {
      getTrack();
    });

    return { plannedTrack };
  },
};
</script>
