<template>
  <div id="app">
    <h1>Welcome to the Team's Package Manager</h1>

    <!-- Description Section -->
    <section class="description">
      <p>
        This is a package management system that allows users to store, rate, and upload packages. 
        It is built upon Phase 1 of another team's work, expanding upon its foundation to offer more functionality and improved user experience.
      </p>
    </section>

    <!-- Actions Section -->
    <div class="actions">
      <!-- Input for Package Name or ID -->
      <label for="package-name" class="visually-hidden">Enter package name or ID:</label>
      <input
        id="package-name"
        type="text"
        v-model="packageName"
        placeholder="Enter package name or ID"
        class="input-box"
        aria-label="Package Name or ID"
      />

      <!-- Action Buttons -->
      <div class="buttons">
        <button @click="navigateTo('multipleOptions')">
          Package Options (get, put, delete) /package/:id
        </button>
        <button @click="navigateTo('upload')">
          Post a Package (post) /package
        </button>
        <button @click="navigateTo('manyPackages')">
          Post Multiple Packages (post) /packages
        </button>
        <button @click="navigateTo('reset')">
          Reset System
        </button>
        <button @click="navigateTo('regex')">
          Find Packages by RegEx
        </button>
        <button @click="navigateTo('cost')">
          Cost depending on the package (get) /package/:id/cost
        </button>
        <button @click="navigateTo('rate')">
          Rate a package (get) /package/:id/rate
        </button>
      </div>
    </div>

    <!-- Dynamic Router View -->
    <router-view></router-view>
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
      if (
        ["multipleOptions", "rate", "cost", "upload"].includes(action) &&
        !packageName.value
      ) {
        alert("Please enter a package name or ID.");
        return;
      }

      switch (action) {
        case "multipleOptions":
          router.push({ name: "PackageDetails", params: { id: packageName.value } });
          break;
        case "upload":
          router.push({ name: "PostPackage", params: { id: packageName.value }});
          break;
        case "manyPackages":
          router.push({ name: "UploadPackage" });
          break;
        case "rate":
          router.push({ name: "RatePackage", params: { id: packageName.value } });
          break;
        case "cost":
          router.push({ name: "CostPackage", params: { id: packageName.value } });
          break;
        case "regex":
          router.push({ name: "RegExPackage" });
          break;
        case "reset":
          router.push({ name: "Reset" });
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
/* Global Styles */
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
  background-color: #f8f8f8;
  color: #333;
}

h1 {
  color: inherit;
}

.description {
  margin: 20px 0;
  font-size: 18px;
}

.actions {
  margin: 20px 0;
}

.input-box {
  padding: 10px;
  font-size: 16px;
  width: 300px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.buttons {
  margin-top: 10px;
}

/* Button Styling */
button {
  margin: 5px 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #007BFF;
  color: white;
  transition: background-color 0.3s ease;
  outline: none;
}

button:hover,
button:focus {
  background-color: #0056b3;
}

button:focus {
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
}

/* Visually Hidden Element for Screen Readers */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
</style>
