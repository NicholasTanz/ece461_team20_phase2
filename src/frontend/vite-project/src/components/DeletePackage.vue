<template>
  <div>
    <h1>Delete a Package</h1>
    <input v-model="packageId" placeholder="Enter Package ID" />
    <button @click="deletePackage">Delete</button>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { deletePackage } from '../services/api';

export default {
  setup() {
    const packageId = ref('');

    const deletePackageHandler = async () => {
      await deletePackage(packageId.value);
      alert('Package deleted successfully!');
    };

    return { packageId, deletePackage: deletePackageHandler };
  },
};
</script>
