<!-- src/App.vue -->
<script setup> 
import { ref } from 'vue';

const BASE_URL = "http://127.0.0.1:8000/api";
const health = ref(null);
const errorMessage = ref('');

const loadStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/v1/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Servidor respondió ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    health.value = data;
    errorMessage.value = '';
  } catch (error) {
    console.error('Error in server health check:', error);
    health.value = null;
    errorMessage.value = 'No se pudo conectar al servidor. Intenta más tarde.';
  }
};

loadStatus();
</script>

<template>
  <div class="w-full h-screen flex flex-col justify-center items-center">
    <div v-if="errorMessage" class="text-red-600">
      <h3 class="text-3xl font-bold mb-4">{{ errorMessage }}</h3>
    </div>

    <div v-else-if="health">
      <router-view />
    </div>

    <div v-else>
      <h3 class="text-3xl font-bold text-gray-800 mb-4">Cargando estado del servidor…</h3>
    </div>
  </div>
</template>

<style scoped> /* Style for the root path */ </style>
