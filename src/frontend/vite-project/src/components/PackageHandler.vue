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
NOTE: This component supports multiple http methods, AND is NOT the /package endpoint. .
It utilizes the fetchPackageById API function to make the request to the backend.
*/
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { fetchPackageById, updatePackageById, deletePackageById } from "../services/api";

export default {
  name: "PackageHandler",
  setup() {
    const route = useRoute();
    const packageId = route.params.id as string;
    const packageData = ref<string | null>(null);
    const loading = ref(false);
    const selectedAction = ref(""); // User-selected action (get, put, delete)

    const performAction = async () => {
      loading.value = true;
      packageData.value = null;

      try {
        switch (selectedAction.value) {
          case "get":
            packageData.value = await fetchPackageById(packageId);
            break;
          case "put":
            packageData.value = await updatePackageById(packageId);
            break;
          case "delete":
            await deletePackageById(packageId);
            packageData.value = `Package ${packageId} successfully deleted.`;
            break;
          default:
            throw new Error("Invalid action selected");
        }
      } catch (error) {
        packageData.value = `Error`;
      } finally {
        loading.value = false;
      }
    };

    // Automatically fetch package details on initial load
    onMounted(async () => {
      selectedAction.value = "get";
      await performAction();
    });

    return { packageId, packageData, selectedAction, performAction, loading };
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
</style>
