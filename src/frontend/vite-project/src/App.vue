<template>
  <div id="app">
    <h1>Welcome to the Team's Package Manager</h1>
    <router-view></router-view>  <!-- Dynamic component rendered based on the route -->
  </div>
</template>

<script lang="ts">
export default {
  name: 'App',
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
}
</style>
