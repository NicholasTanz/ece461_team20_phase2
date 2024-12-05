<template>
  <div>
    <h1>Reset System</h1>
    <button @click="resetSystem">Reset</button>
  </div>
</template>

<script lang="ts">
/* 

This component is responsible for the /reset (delete) endpoint. 

It provides a button to reset the system and displays the result in an alert.

It utilizes the resetSystem API function to make the request to the backend.

*/

import { resetSystem } from '../services/api';

export default {
  setup() {
    // Handler for the Reset System button
    const resetSystemHandler = async () => {
      try {
        const response = await resetSystem('reset'); // Call API to reset system
        console.log(response); // Log the response for debugging
        alert('System reset successfully!'); // Success alert
      } catch (error) {
        console.error('Error resetting the system:', error);
        alert('Failed to reset the system. Please try again.'); // Error alert
      }
    };

    return { resetSystem: resetSystemHandler };
  },
};
</script>
