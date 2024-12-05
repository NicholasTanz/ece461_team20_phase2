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
    const packageData = ref(''); // Holds the data entered by the user

    // Function to handle package upload
    const uploadPackageHandler = async () => {
      try {
        const response = await listPackages(packageData.value); // Upload package data
        console.log(response); // Log the response for debugging
        alert('Package uploaded successfully!'); // Notify the user
      } catch (error) {
        console.error('Error uploading package:', error);
        alert('Failed to upload the package. Please try again.'); // Notify the user in case of error
      }
    };

    return { packageData, uploadPackage: uploadPackageHandler };
  },
};
</script>
