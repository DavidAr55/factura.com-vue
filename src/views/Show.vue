<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Swal from 'sweetalert2';

// Route parameters
const route = useRoute();
const uuid = ref(route.params.uuid);

watch(
  () => route.params.uuid,
  (newUuid) => {
    uuid.value = newUuid;
    loadCfdi();
  }
);

// Constants
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const SECRET  = import.meta.env.VITE_API_SECRET;

const cfdi = ref({});
const loading = ref(true);

// Load CFDI
const loadCfdi = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${BASE_URL}/v1/cfdi/${uuid.value}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      }
    });
    const data = await response.json();
    cfdi.value = data;
  } catch (error) {
    console.error("Error al cargar el CFDI:", error);
  } finally {
    loading.value = false;
  }
};

loadCfdi();

// Send CFDI by email using Swal2
const sendCfdiByEmail = async (uid, link) => {
  try {
    Swal.fire({
      title: 'Enviando correo...',
      html: 'Por favor, espera',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const response = await fetch(link, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      }
    });

    const result = await response.json();
    Swal.close();

    if (response.ok && result.response === 'success') {
      await Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: result.message,
      });
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: result.message || 'Ocurrió un error inesperado',
      });
    }
  } catch (err) {
    console.error('Error enviando por correo:', err);
    Swal.close();
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor. Intenta de nuevo más tarde.',
    });
  }
};

// Cancel CFDI using Swal2 with input select
const cancelCfdi = async (uid, link) => {
  // Select cancellation reason
  const { value: motivo } = await Swal.fire({
    title: 'Seleccione el motivo de cancelación',
    input: 'select',
    inputOptions: {
      '01': '01 - Comprobante emitido con errores con relación',
      '02': '02 - Comprobante emitido con errores sin relación',
      '03': '03 - No se llevó a cabo la operación',
      '04': '04 - Operación nominativa relacionada en la factura global'
    },
    inputPlaceholder: 'Seleccione un motivo',
    showCancelButton: true,
    confirmButtonText: 'Continuar'
  });

  if (!motivo) return;

  let replacementUuid = null;
  if (motivo === '01') {
    const { value: repUuid } = await Swal.fire({
      title: 'Ingrese el UUID de reemplazo',
      input: 'text',
      inputPlaceholder: 'Ingresa un UUID',
      showCancelButton: true,
      confirmButtonText: 'Aceptar'
    });
    if (!repUuid) return;
    replacementUuid = repUuid;
  }

  const data = {
    reason: motivo,
    substituteFolio: replacementUuid
  };

  // Show loader while processing cancellation
  Swal.fire({
    title: 'Cancelando CFDI...',
    html: 'Por favor, espera',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Cancel CFDI
  try {
    const response = await fetch(link, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    Swal.close();

    if (response.ok && result.response === 'success') {
      await Swal.fire({
        icon: 'success',
        title: 'Cancelación exitosa',
        text: result.message
      });
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Error al cancelar',
        text: result.message || 'Ocurrió un error inesperado'
      });
    }
  } catch (error) {
    console.error('Error en la cancelación:', error);
    Swal.close();
    await Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar al servidor. Intenta de nuevo más tarde.'
    });
  }

  // Reload updated CFDI information
  loadCfdi();
};
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Main title -->
    <div class="bg-white w-full h-full pt-4 mb-6 flex flex-col justify-center items-center rounded-xl shadow">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Factura.com</h1>
    </div>

    <!-- Skeleton Loader or Content -->
    <div v-if="loading" class="space-y-4">
      <!-- Card Skeleton -->
      <div class="animate-pulse bg-white rounded-xl shadow p-6">
        <div class="h-6 w-1/2 bg-gray-300 rounded mb-4"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div class="h-4 w-full bg-gray-300 rounded"></div>
          </div>
          <div>
            <div class="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div class="h-4 w-full bg-gray-300 rounded"></div>
          </div>
          <div>
            <div class="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div class="h-4 w-full bg-gray-300 rounded"></div>
          </div>
          <div>
            <div class="h-4 w-24 bg-gray-300 rounded mb-2"></div>
            <div class="h-4 w-full bg-gray-300 rounded"></div>
          </div>
        </div>
        <div class="mt-6 flex space-x-4">
          <div class="h-10 w-28 bg-gray-300 rounded"></div>
          <div class="h-10 w-28 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Content with CFDI Information -->
    <div v-else class="bg-white rounded-xl shadow p-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-4">Detalle del CFDI</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-gray-500">Folio</p>
          <p class="text-gray-800 font-medium">{{ cfdi.folio }}</p>
        </div>
        <div>
          <p class="text-gray-500">Serial</p>
          <p class="text-gray-800 font-medium">{{ cfdi.serial }}</p>
        </div>
        <div>
          <p class="text-gray-500">Tipo CFDI</p>
          <p class="text-gray-800 font-medium">{{ cfdi.cfdi_type }}</p>
        </div>
        <div>
          <p class="text-gray-500">Total</p>
          <p class="text-gray-800 font-medium">{{ cfdi.total }}</p>
        </div>
        <div>
          <p class="text-gray-500">Fecha</p>
          <p class="text-gray-800 font-medium">{{ cfdi.date }}</p>
        </div>
        <div>
          <p class="text-gray-500">Estado</p>
          <p class="text-gray-800 font-medium">{{ cfdi.status }}</p>
        </div>
      </div>

      <!-- Action buttons with SweetAlert2 styles -->
      <div class="mt-6 flex flex-col sm:flex-row gap-4">
        <button @click="sendCfdiByEmail(cfdi.uid, cfdi.links.email)"
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded shadow">
          Enviar Email
        </button>
        <button v-if="cfdi.links.cancel" @click="cancelCfdi(cfdi.uid, cfdi.links.cancel)"
          class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded shadow">
          Cancelar CFDI
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>