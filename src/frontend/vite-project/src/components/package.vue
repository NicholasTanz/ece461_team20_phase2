<template>
    <div>
      <h1>Package Post</h1>
      <p>ID: {{ packageId }}</p>
      <div v-if="packageData">
        <p>{{ packageData }}</p>
      </div>
      <div v-else>
        <p>Posting a package...</p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import { postPackage } from '../services/api';
  /* 
  
  This component is responsible for the /package (post) endpoint. 
  
  NOTE: This component is NOT the /package:id endpoint..
  
  It utilizes the fetchPackageById API function to make the request to the backend.
  
  */
  
  
  export default {
    setup() {
      const route = useRoute();
      const packageId = route.params.id as string;
      const packageData = ref(null);
  
      onMounted(async () => {
        packageData.value = await postPackage(packageId);
      });
  
      return { packageId, packageData };
    },
  };
  </script>