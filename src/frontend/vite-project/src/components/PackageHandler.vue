<template>
  <div>
    <h1>Package Handler</h1>
    <p>Package ID: {{ packageId }}</p>

    <!-- Action Selection -->
    <div class="action-selection">
      <label for="action-type">Select an action:</label>
      <select id="action-type" v-model="selectedAction" class="input-box">
        <option disabled value="">-- Select Action --</option>
        <option value="get">Get Package</option>
        <option value="put">Update Package</option>
        <option value="delete">Delete Package</option>
      </select>
      <button @click="performAction" :disabled="!selectedAction">
        Perform Action
      </button>
    </div>

    <!-- Update Package Fields (Only shown for PUT action) -->
    <div v-if="selectedAction === 'put'">
      <h2>Update Package</h2>
      <form @submit.prevent="updatePackage">
        <div>
          <label for="name">Name:</label>
          <input type="text" v-model="packageDataToUpdate.Name" id="name" required />
        </div>
        <div>
          <label for="version">Version:</label>
          <input type="text" v-model="packageDataToUpdate.Version" id="version" required />
        </div>
        <div>
          <label for="url">URL:</label>
          <input type="url" v-model="packageDataToUpdate.URL" id="url" required />
        </div>
        <div>
          <button type="submit">Update Package</button>
        </div>
      </form>
    </div>

    <!-- Package Data Display -->
    <div v-if="loading">
      <p>Loading...</p>
    </div>
    <div v-else-if="packageData">
      <p><strong>Response:</strong> {{ packageData }}</p>
    </div>
    <div v-else>
      <p>No data available for this package.</p>
    </div>
  </div>
</template>

<script lang="ts">
/* 
This component is responsible for the /package/:id (get, put, delete) endpoint. 
It supports multiple HTTP methods for fetching, updating, and deleting a package.
*/

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { fetchPackageById, updatePackageById, deletePackageById } from "../services/api";

export default {
  name: "PackageHandler",
  setup() {
    const route = useRoute();
    const packageId = route.params.id as string;
    const packageData = ref<string | null>(null); // Store the response data
    const loading = ref(false); // Track loading state
    const selectedAction = ref(""); // Store the user-selected action
    const packageDataToUpdate = ref({
      Name: "",
      Version: "",
      URL: "",
    }); // For the PUT action, store the data to update

    // Function to perform the selected action (get, put, delete)
    const performAction = async () => {
      loading.value = true;
      packageData.value = null;

      try {
        switch (selectedAction.value) {
          case "get":
            // Fetch the package by ID
            const fetchedPackage = await fetchPackageById(packageId);
            packageData.value = JSON.stringify(fetchedPackage.data, null, 2); // Display the fetched package
            break;
          case "put":
            // Show the update form when PUT is selected
            break;
          case "delete":
            // Delete the package
            await deletePackageById(packageId);
            packageData.value = `Package ${packageId} successfully deleted.`;
            break;
          default:
            throw new Error("Invalid action selected");
        }
      } catch (error) {
        packageData.value = `Error: ${error.message}`;
      } finally {
        loading.value = false;
      }
    };

    // Function to handle the PUT request (updating the package)
    const updatePackage = async () => {
      loading.value = true;
      packageData.value = null;

      try {
        const updatedPackage = await updatePackageById(packageId, packageDataToUpdate.value);
        packageData.value = `Package updated: ${JSON.stringify(updatedPackage.data, null, 2)}`;
      } catch (error) {
        packageData.value = `Error updating package: ${error.message}`;
      } finally {
        loading.value = false;
      }
    };

    // Automatically fetch package details on initial load
    onMounted(async () => {
      selectedAction.value = "get"; // Default action is to get package
      await performAction(); // Perform the "get" action
    });

    return { packageId, packageData, selectedAction, performAction, packageDataToUpdate, updatePackage, loading };
  },
};
</script>

<style scoped>
.action-selection {
  margin: 10px 0;
}

.action-selection label {
  margin-right: 10px;
}

button {
  margin-left: 10px;
}

.input-box {
  padding: 5px;
  font-size: 14px;
}

form {
  display: grid;
  gap: 15px;
  margin-top: 20px;
}

form div {
  display: flex;
  flex-direction: column;
}

form label {
  font-weight: bold;
}

form input {
  padding: 8px;
  font-size: 14px;
}

form button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

form button:disabled {
  background-color: #b0c7f1;
  cursor: not-allowed;
}
</style>
