<template>
    <div>
      <h1>Package Cost</h1>
      <p>Package ID: {{ packageId }}</p>
      <div v-if="cost !== null">
        <p>Cost: ${{ cost }}</p>
      </div>
      <div v-else>
        <p>Loading cost...</p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { fetchPackageCost } from '../services/api';
  
  export default {
    setup() {
      const route = useRoute();
      const packageId = route.params.id as string;
      const cost = ref<number | null>(null);
  
      onMounted(async () => {
        cost.value = await fetchPackageCost(packageId);
      });
  
      return { packageId, cost };
    },
  };
  </script>