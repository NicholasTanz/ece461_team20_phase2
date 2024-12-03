<template>
    <div>
      <h1>Rate a Package</h1>
      <p>Package ID: {{ packageId }}</p>
      <input v-model="rating" type="number" min="1" max="5" placeholder="Enter rating" />
      <button @click="ratePackage">Submit Rating</button>
    </div>
  </template>
  
  <script lang="ts">
  import { ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { ratePackage } from '../services/api';
  
  export default {
    setup() {
      const route = useRoute();
      const packageId = route.params.id as string;
      const rating = ref(0);
  
      const ratePackageHandler = async () => {
        await ratePackage(packageId, rating.value);
        alert('Rating submitted successfully!');
      };
  
      return { packageId, rating, ratePackage: ratePackageHandler };
    },
  };
  </script>