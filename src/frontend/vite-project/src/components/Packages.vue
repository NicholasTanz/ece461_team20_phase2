<template>
  <div class="upload-packages">
    <h1>Upload Multiple Packages</h1>

    <section class="package-input">
      <label for="package-details" class="input-label">Enter Package Details (one per line):</label>
      <textarea
        id="package-details"
        v-model="packageData"
        placeholder="Enter each package's details on a new line"
        class="input-box"
      ></textarea>
    </section>

    <section class="buttons">
      <button @click="uploadPackages" :disabled="!packageData.trim()">Upload Packages</button>
    </section>

    <section v-if="isLoading" class="status">
      <p>Uploading packages...</p>
    </section>

    <section v-if="uploadSuccess" class="status">
      <p class="success-message">Packages uploaded successfully!</p>
    </section>

    <section v-if="errorMessage" class="status">
      <p class="error-message">{{ errorMessage }}</p>
    </section>

    <section v-if="responseData" class="status">
      <p><strong>Uploaded Packages:</strong></p>
      <ul>
        <li v-for="(packageInfo, index) in responseData" :key="index">
          Details: {{ packageInfo }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { listPackages } from "../services/api";

/**
 * This component handles the `/packages` POST endpoint for uploading multiple packages.
 * The user can enter multiple packages' details (one per line), which will be uploaded as a batch.
 */
export default {
  setup() {
    const packageData = ref(""); // Holds the data entered by the user
    const isLoading = ref(false); // Tracks loading state for uploading
    const uploadSuccess = ref(false); // Tracks if upload was successful
    const errorMessage = ref(""); // Holds error messages
    const responseData = ref(null); // Holds the response data after upload

    // Function to handle the package upload
    const uploadPackages = async () => {
      if (!packageData.value.trim()) return;

      isLoading.value = true;
      uploadSuccess.value = false;
      errorMessage.value = "";
      responseData.value = null;

      const packagesArray = packageData.value
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "");

      try {
        // Assuming listPackages is a function that handles the batch upload
        responseData.value = await listPackages(packagesArray); // Upload the packages as an array
        uploadSuccess.value = true; // Update success status
        packageData.value = ""; // Clear the input after successful upload
      } catch (error) {
        console.error("Error uploading packages:", error);
        errorMessage.value = "Failed to upload packages. Please try again."; // Display error
      } finally {
        isLoading.value = false; // Reset loading state
      }
    };

    return { packageData, isLoading, uploadPackages, uploadSuccess, errorMessage, responseData };
  },
};
</script>

<style scoped>
.upload-packages {
  font-family: Arial, sans-serif;
  padding: 20px;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #007bff;
  margin-bottom: 20px;
}

.package-input {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: bold;
}

.input-box {
  padding: 10px;
  font-size: 16px;
  width: 100%;
  height: 150px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  resize: vertical;
}

.buttons {
  margin-bottom: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #b0c7f1;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

.status {
  margin-top: 20px;
}

.success-message {
  color: #28a745;
  font-weight: bold;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 5px 0;
}
</style>
