<!-- src/App.vue -->
<script setup>
import { ref, onMounted } from 'vue';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const SECRET  = import.meta.env.VITE_API_SECRET;

const health = ref(null);
const errorMessage = ref('');
const isLoading = ref(true);

const loadStatus = async () => {
  try {
    const response = await fetch(`${BASE_URL}/v1/health`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      }
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
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStatus();
});
</script>

<template>
  <div class="w-full h-full p-3">
    <!-- Error case -->
    <div v-if="errorMessage" class="text-red-600 w-full h-[97vh] flex justify-center items-center">
      <h3 class="text-xl text-center font-bold mb-4">{{ errorMessage }}</h3>
    </div>

    <!-- Loading state -->
    <div v-else-if="isLoading" class="w-full h-[97vh] flex justify-center items-center">
      <svg class="animate-spin h-8 w-8 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    </div>

    <!-- Server status is healthy -->
    <div v-else-if="health">
      <router-view />
    </div>
  </div>
</template>

<style scoped> /* Style for the root path */ </style>
