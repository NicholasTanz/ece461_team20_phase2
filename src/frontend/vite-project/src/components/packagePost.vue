<template>
  <div>
    <h1>Upload Package</h1>
    
    <div>
      <label for="name">Package Name:</label>
      <input v-model="packageData.Name" id="name" placeholder="Enter package name" />
    </div>
    
    <div>
      <label for="version">Package Version:</label>
      <input v-model="packageData.Version" id="version" placeholder="Enter package version" />
    </div>

    <div>
      <label for="url">Package URL:</label>
      <input v-model="packageData.URL" id="url" placeholder="Enter package URL" />
    </div>

    <div>
      <label for="jsProgram">JS Program:</label>
      <textarea v-model="packageData.JSProgram" id="jsProgram" placeholder="Enter JS program code"></textarea>
    </div>

    <button @click="postPackageData" :disabled="isPosting">Post Package</button>

    <div v-if="isPosting">Posting the package...</div>
    <div v-if="uploadSuccess">Package uploaded successfully!</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { postPackage } from '../services/api'; // Assuming this function is correctly defined

export default {
  setup() {
    const packageData = ref({
      Name: '',
      Version: '',
      URL: '',
      JSProgram: '',
    });

    const isPosting = ref(false);
    const uploadSuccess = ref(false);
    const errorMessage = ref('');

    const postPackageData = async () => {
      isPosting.value = true;
      uploadSuccess.value = false;
      errorMessage.value = '';

      try {
        // Call the postPackage function with the packageData object
        await postPackage(packageData.value);
        uploadSuccess.value = true;
        packageData.value = { Name: '', Version: '', URL: '', JSProgram: '' }; // Clear form on success
      } catch (error) {
        console.error('Error posting package:', error);
        errorMessage.value = 'Failed to upload package. Please try again.';
      } finally {
        isPosting.value = false;
      }
    };

    return {
      packageData,
      postPackageData,
      isPosting,
      uploadSuccess,
      errorMessage,
    };
  },
};
</script>

<style scoped>
/* Add styles as needed */
.error-message {
  color: red;
}
</style>
