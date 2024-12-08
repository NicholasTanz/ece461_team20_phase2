<template>
  <div>
    <h1>Planned Track</h1>

    <!-- Loading state -->
    <p v-if="loading">Loading...</p>

    <!-- Error state -->
    <p v-else-if="error" style="color: red;">Error: {{ error }}</p>

    <!-- Display planned tracks -->
    <ul v-else>
      <li v-for="track in plannedTracks" :key="track">{{ track }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
/*
  This component handles displaying the planned tracks fetched from the /tracks endpoint.

  It utilizes the fetchTrack API function to get the data from the backend.
*/
import { ref, onMounted } from 'vue';
import { fetchTrack } from '../services/api'; // Adjust the path if necessary

export default {
  setup() {
    const plannedTracks = ref<string[]>([]); // Array to store planned tracks
    const loading = ref<boolean>(true); // Loading state
    const error = ref<string | null>(null); // Error state

    // Function to fetch planned tracks
    const getTracks = async () => {
      try {
        error.value = null; // Clear any previous errors
        const response = await fetchTrack(); // Fetch tracks from the API
        plannedTracks.value = response.data.plannedTracks; // Update tracks
      } catch (err) {
        console.error('Error fetching planned tracks:', err);
        error.value = 'Failed to load planned tracks. Please try again.';
      } finally {
        loading.value = false; // Stop loading
      }
    };

    // Fetch tracks when the component is mounted
    onMounted(() => {
      getTracks();
    });

    return { plannedTracks, loading, error };
  },
};
</script>

<style scoped>
h1 {
  font-size: 1.5em;
  color: #333;
}
p {
  color: #666;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  background: #f4f4f4;
  margin: 5px 0;
  padding: 10px;
  border-radius: 4px;
}
</style>
