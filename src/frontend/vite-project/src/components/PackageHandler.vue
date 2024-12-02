<template>
    <div>
      <h1>Package Handler</h1>
      <p>Handling action: {{ action }}</p>
  
      <div v-if="action === 'view'">
        <h2>Package Details</h2>
        <p>{{ packageData }}</p>
      </div>
  
      <div v-if="action === 'delete'">
        <h2>Delete Package</h2>
        <button @click="confirmDelete">Confirm Delete</button>
      </div>
  
      <div v-if="action === 'upload'">
        <h2>Upload Package</h2>
        <input v-model="newPackageData" placeholder="Enter package details" />
        <button @click="uploadPackage">Upload</button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { ref, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { fetchPackageById, deletePackage, uploadPackage } from '../services/api';
  
  export default {
    setup() {
      const route = useRoute();
      const router = useRouter();
  
      const action = ref(route.query.action || 'view'); // Read action from query param
      const packageData = ref(null);
      const newPackageData = ref('');
  
      // Fetch data if action is "view"
      onMounted(async () => {
        if (action.value === 'view') {
          const id = route.params.id as string;
          packageData.value = await fetchPackageById(id);
        }
      });
  
      // Handle Delete
      const confirmDelete = async () => {
        const id = route.params.id as string;
        await deletePackage(id);
        alert('Package deleted successfully!');
        router.push('/');
      };
  
      // Handle Upload
      const uploadPackageHandler = async () => {
        await uploadPackage(newPackageData.value);
        alert('Package uploaded successfully!');
        router.push('/');
      };
  
      return {
        action,
        packageData,
        newPackageData,
        confirmDelete,
        uploadPackage: uploadPackageHandler,
      };
    },
  };
  </script>
  