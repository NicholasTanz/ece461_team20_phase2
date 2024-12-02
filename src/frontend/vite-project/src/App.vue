<template>
  <div id="app">
    <h1>Welcome to the Team's Package Manager</h1>

    <div class="actions">
      <input
        type="text"
        v-model="packageName"
        placeholder="Enter package name or ID"
        class="input-box"
      />
      <div class="buttons">
        <button @click="navigateTo('rating')">Get Rating of a Package</button>
        <button @click="navigateTo('delete')">Delete a Package</button>
        <button @click="navigateTo('upload')">Upload a Package</button>
      </div>
    </div>

    <router-view></router-view> <!-- Dynamic component rendered based on the route -->
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "App",
  setup() {
    const packageName = ref(""); // Bind input value
    const router = useRouter(); // Vue Router instance for navigation

    const navigateTo = (action: string) => {
      if (action !== "upload" && !packageName.value) {
        alert("Please enter a package name or ID.");
        return;
      }

      switch (action) {
        case "rating":
          router.push({ name: "PackageDetails", params: { id: packageName.value } });
          break;
        case "delete":
          router.push({ name: "DeletePackage", params: { id: packageName.value } });
          break;
        case "upload":
          router.push({ name: "UploadPackage" });
          break;
        default:
          alert("Invalid action");
      }
    };

    return { packageName, navigateTo };
  },
});
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
}

.actions {
  margin: 20px 0;
}

.input-box {
  padding: 10px;
  font-size: 16px;
  width: 300px;
  margin-bottom: 10px;
}

.buttons {
  margin-top: 10px;
}

button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button:hover {
  background-color: #f0f0f0;
}
</style>
