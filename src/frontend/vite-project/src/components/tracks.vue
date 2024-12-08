<template>
    <div>
      <h1>Planned Track</h1>
      <p v-if="loading">Loading...</p>
      <p v-else-if="error">{{ error }}</p>
      <ul v-else>
        <li v-for="track in plannedTracks" :key="track">{{ track }}</li>
      </ul>
    </div>
  </template>
  
  <script>
  import { fetchTrack } from '../services/api'; // Adjust the import path as needed
  
  export default {
    data() {
      return {
        plannedTracks: [],
        loading: true,
        error: null,
      };
    },
    created() {
      this.getTracks();
    },
    methods: {
      async getTracks() {
        try {
          const response = await fetchTrack(); // Use the provided function
          this.plannedTracks = response; // Extract data correctly
        } catch (err) {
          this.error = 'Failed to load planned tracks.';
          console.error(err);
        } finally {
          this.loading = false;
        }
      },
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
  