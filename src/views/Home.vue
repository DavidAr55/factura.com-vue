<script setup>
import { ref } from 'vue';

const BASE_URL = "http://127.0.0.1:8000/api";
const health = ref(null);
const errorMessage = ref('');
</script>

<template>
  <div class="w-full h-screen flex flex-col justify-center items-center">
    <h1 class="text-5xl font-bold text-gray-800 mb-4">Factura.com</h1>
  </div>
</template>

<style scoped></style>
