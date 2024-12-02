<template>
    <div>
      <h1>Delete Package</h1>
      <div v-if="packageData">
        <p>Are you sure you want to delete the package <strong>{{ packageData.name }}</strong>?</p>
        <button @click="deletePackage" class="delete-btn">Delete</button>
        <button @click="cancel" class="cancel-btn">Cancel</button>
      </div>
      <div v-else>
        <p>Loading package details...</p>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';  // For accessing the route params and navigating after deletion
//  import { fetchPackageById, deletePackage } from '../api';  // Import the API functions
  
  export default {
    setup() {
      const route = useRoute();  // Access route params
      const router = useRouter();  // For redirecting after deletion
      const packageData = ref(null);
  
      // Fetch the package details based on the ID in the route params
   /*   onMounted(async () => {
        const id = route.params.id as string;
        packageData.value = await fetchPackageById(id);
      });
  
      // Delete the package
      const deletePackageHandler = async () => {
        const id = route.params.id as string;
        await deletePackage(id);
        // Redirect to the package list after deletion
        router.push('/');
      };
  
      // Cancel deletion and go back to the package list
      const cancel = () => {
        router.push('/');
      };
  */
 
      return { packageData, deletePackage: deletePackageHandler, cancel };
     
    },
  };
  </script>
  
  <style scoped>
  h1 {
    font-size: 2em;
    margin-bottom: 20px;
  }
  
  button {
    font-size: 1.2em;
    padding: 10px 20px;
    margin-right: 10px;
    cursor: pointer;
  }
  
  .delete-btn {
    background-color: red;
    color: white;
  }
  
  .cancel-btn {
    background-color: gray;
    color: white;
  }
  </style>
  