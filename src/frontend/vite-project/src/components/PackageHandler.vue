<template>
  <div>
    <h1>Package Details</h1>
    <p>ID: {{ packageId }}</p>
    <div v-if="packageData">
      <p>{{ packageData }}</p>
    </div>
    <div v-else>
      <p>Loading package data...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchPackageById } from '../services/api';

export default {
  setup() {
    const route = useRoute();
    const packageId = route.params.id as string;
    const packageData = ref(null);

    onMounted(async () => {
      packageData.value = await fetchPackageById(packageId);
    });

    return { packageId, packageData };
  },
};
</script>