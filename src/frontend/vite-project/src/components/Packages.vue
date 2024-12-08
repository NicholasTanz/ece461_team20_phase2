<template>
  <div class="upload-packages">
    <h1>Search Packages</h1>

    <section class="package-input">
      <label for="package-details" class="input-label">Enter Package Details (one per line):</label>
      <textarea
        id="package-details"
        v-model="packageData"
        placeholder="Enter each package's name (optionally with version) on a new line"
        class="input-box"
      ></textarea>
    </section>

    <section class="buttons">
      <button @click="searchPackages" :disabled="!packageData.trim()">Search Packages</button>
    </section>

    <section v-if="isLoading" class="status">
      <p>Searching for packages...</p>
    </section>

    <section v-if="searchSuccess" class="status">
      <p class="success-message">Packages found successfully!</p>
    </section>

    <section v-if="errorMessage" class="status">
      <p class="error-message">{{ errorMessage }}</p>
    </section>

    <section v-if="responseData" class="status">
      <p><strong>Found Packages:</strong></p>
      <ul>
        <li v-for="(pkg, index) in responseData" :key="index">
          {{ pkg.Name }} - {{ pkg.Version || "No version specified" }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts">
import { ref } from "vue";
import { listPackages } from "../services/api";

/**
 * This component handles the `/packages` POST endpoint for searching packages based on user input.
 * Users can input package details (name and version) and search for matching packages.
 */
export default {
  setup() {
    const packageData = ref(""); // Holds the data entered by the user
    const isLoading = ref(false); // Tracks loading state for the search
    const searchSuccess = ref(false); // Tracks if the search was successful
    const errorMessage = ref(""); // Holds error messages
    const responseData = ref<any[]>([]); // Holds the list of packages found

    // Function to handle package search
    const searchPackages = async () => {
      if (!packageData.value.trim()) return;

      isLoading.value = true;
      searchSuccess.value = false;
      errorMessage.value = "";
      responseData.value = [];

      const packageQueries = packageData.value
        .split("\n")
        .map((line) => {
          const [name, version] = line.trim().split(" "); // Split into Name and Version
          return { Name: name, Version: version || undefined }; // Version is optional
        })
        .filter((query) => query.Name); // Ensure only valid queries are sent

      try {
        responseData.value = await listPackages(packageQueries); // Search the packages
        searchSuccess.value = true; // Update success status
      } catch (error) {
        console.error("Error searching packages:", error);
        errorMessage.value = "Failed to find packages. Please try again."; // Display error
      } finally {
        isLoading.value = false; // Reset loading state
      }
    };

    return { packageData, isLoading, searchPackages, searchSuccess, errorMessage, responseData };
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
