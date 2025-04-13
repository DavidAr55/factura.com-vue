<!-- src/views/Home.vue -->
<script setup>
  import { ref } from 'vue';
  import { RouterLink } from 'vue-router';

  const BASE_URL = "http://127.0.0.1:8000/api"
  
  const loadStatus = async () => {
    const response = await fetch(`${BASE_URL}/v1/status`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json();

    console.log('Response: ', data);
  }

  loadStatus();
</script>

<template>
  <div class="w-full h-screen flex justify-center items-center">
    <h1 class="text-5xl font-bold text-gray-800">Factura.com</h1>
  </div>
</template>

<style scoped>
  
</style>
