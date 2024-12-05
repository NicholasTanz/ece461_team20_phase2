<template>
  <div>
    <h1>Delete a Package</h1>
    <input v-model="packageId" placeholder="Enter Package ID" />
    <button @click="deletePackage">Delete</button>

    <!-- Display package details if data is available -->
    <div v-if="deletedPackage">
      <h2>Deleted Package Details</h2>
      <pre>{{ deletedPackage }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { deletePackage } from '../services/api';

export default {
  setup() {
    const packageId = ref(''); // Reactive variable for user input
    const deletedPackage = ref(null); // Reactive variable to store deleted package details

    const deletePackageHandler = async () => {
      try {
        const packageData = await deletePackage(packageId.value); // Call the API and store the response
        deletedPackage.value = packageData; // Store returned data in reactive variable
        alert(`Package with ID ${packageId.value} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete the package. Please try again.');
      }
    };

    return { packageId, deletePackage: deletePackageHandler, deletedPackage };
  },
};
</script>
