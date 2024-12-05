<template>
    <div>
      <h1>Upload Package</h1>
      <textarea v-model="packageData" placeholder="Enter package details"></textarea>
      <button @click="uploadPackage">Upload</button>
    </div>
  </template>
  
  <script lang="ts">
  import { ref } from 'vue';
  import { listPackages } from '../services/api';
  
  export default {
    setup() {
      const packageData = ref('');
  
      const uploadPackageHandler = async () => {
        await listPackages(packageData.value);
        alert('Package uploaded successfully!');
      };
  
      return { packageData, uploadPackage: uploadPackageHandler };
    },
  };
  </script>