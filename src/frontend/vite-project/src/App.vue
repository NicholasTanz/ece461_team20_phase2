<template>
  <div id="app">
    <h1>Welcome to the Team's Package Manager</h1>

    <section class="description">
      <p>
        This is a package management system that allows users to store, rate, and upload packages. 
        It is built upon Phase 1 of another team's work, expanding upon its foundation to offer more functionality and improved user experience.
      </p>
    </section>

    <div class="actions">
      <label for="package-name" class="visually-hidden">Enter package name or ID:</label>
      <input
        id="package-name"
        type="text"
        v-model="packageName"
        placeholder="Enter package name or ID"
        class="input-box"
        aria-label="Package Name or ID"
      />
      
      <div class="buttons">
        <button 
          @click="navigateTo('details')" 
          :aria-disabled="!packageName"
        >
          View Package Details
        </button>
        <button 
          @click="navigateTo('delete')" 
          :aria-disabled="!packageName"
        >
          Delete a Package
        </button>
        <button @click="navigateTo('upload')">Upload a Package</button>
        <button 
          @click="navigateTo('rate')" 
          :aria-disabled="!packageName"
        >
          Rate a Package
        </button>
        <button 
          @click="navigateTo('cost')" 
          :aria-disabled="!packageName"
        >
          View Package Cost
        </button>
        <button @click="navigateTo('regex')">Search by RegEx</button>
        <button @click="navigateTo('reset')">Reset System</button>
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
      if (
        ["details", "delete", "rate", "cost"].includes(action) &&
        !packageName.value
      ) {
        alert("Please enter a package name or ID.");
        return;
      }

      switch (action) {
        case "details":
          router.push({ name: "PackageDetails", params: { id: packageName.value } });
          break;
        case "delete":
          router.push({ name: "DeletePackage", params: { id: packageName.value } });
          break;
        case "upload":
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
/* Global styles */
#app {
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 20px;
  background-color: #f8f8f8;  /* Light background */
  color: #333;
}

h1 {
  color: inherit;
}

.description {
  margin: 20px 0;
  font-size: 18px;
}

.team-info {
  margin: 20px 0;
  font-size: 16px;
}

.team-info ul {
  list-style-type: none;
  padding: 0;
}

.team-info li {
  padding: 5px 0;
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

/* Button styling */
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

button:hover, button:focus {
  background-color: #0056b3;
}

button:focus {
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.5);
}

/* Visually hidden element for screen readers */
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
