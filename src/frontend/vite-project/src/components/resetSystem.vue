<template>
    <div>
      <h1>Reset System</h1>
      <button @click="resetSystem">Reset</button>
    </div>
  </template>
  
  <script lang="ts">
  import { resetSystem } from '../services/api';
  
  export default {
    setup() {
      const resetSystemHandler = async () => {
        await resetSystem();
        alert('System reset successfully!');
      };
  
      return { resetSystem: resetSystemHandler };
    },
  };
  </script>