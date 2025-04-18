<script setup>
import { ref, watch, onMounted } from 'vue';
import Swal from 'sweetalert2';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle, faEnvelope, faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faTimesCircle, faEnvelope, faEye)

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const SECRET  = import.meta.env.VITE_API_SECRET;

const cfdis = ref({});
let allCfdis = [];
const list_page = ref(10);
const loading = ref(true);

// Load CFDIs from API endpoint
const loadCfdis = async () => {
  const url = new URL(`${BASE_URL}/v1/cfdi`);
  url.searchParams.append('per_page', list_page.value);

  try {
    loading.value = true;
    // We send a GET request to the API endpoint with the headers required by the API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      }
    });

    const data = await response.json();

    cfdis.value = data;
    allCfdis = [...data.data];
  } catch (error) {
    console.error("Error al cargar CFDIs:", error);
  } finally {
    loading.value = false;
  }
};

const searchFolio = (event) => {
  const value = event.target.value;
  if (!value.trim()) {
    cfdis.value.data = allCfdis;
  } else {
    cfdis.value.data = allCfdis.filter(cfdi =>
      cfdi.folio.toLowerCase().includes(value.toLowerCase())
    );
  }
};

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

// Cancel CFDI using Swal2
const cancelCfdi = async (uid, link) => {
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
      inputPlaceholder: 'ingresa un UUID',
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

  Swal.fire({
    title: 'Cancelando CFDI...',
    html: 'Por favor, espera',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

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

  loadCfdis();
};

// Watch for changes in list_page
watch(list_page, () => {
  loadCfdis();
});

onMounted(() => {
  loadCfdis();
});

function formatTotal(total) {
  const number = Number(total);
  const formatted = number.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return "$" + formatted;
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Main title -->
    <div class="bg-white w-full h-full pt-4 flex flex-col justify-center items-center rounded-xl shadow">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Factura.com</h1>
    </div>

    <!-- Button to create CFDI -->
    <div class="w-full flex flex-col justify-center rounded-xl shadow my-7">
      <router-link :to="{ name: 'Create' }"
        class="p-2.5 rounded-md bg-emerald-500 text-white font-bold text-center decoration-0">
        Crear CFDI
      </router-link>
    </div>

    <!-- Main container CFDI -->
    <div class="bg-white w-full h-full p-4 rounded-xl shadow">
      <h2 class="text-xl font-medium text-gray-800 mb-4">Historial de CFDI</h2>

      <!-- Search input -->
      <div class="w-full flex justify-center mb-4">
        <input type="text" placeholder="Buscar por Folio..." @input="searchFolio"
          class="w-full p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
      </div>

      <!-- List area with Skeleton -->
      <div class="h-[510px] overflow-y-auto">
        <!-- If loading, show skeletons -->
        <template v-if="loading">
          <div v-for="n in 3" :key="n"
            class="animate-pulse flex flex-col gap-4 border-2 border-gray-300 rounded-md shadow my-4 p-4">
            <div class="h-6 w-3/4 bg-gray-300 rounded"></div>
            <div class="h-4 w-1/2 bg-gray-300 rounded"></div>
            <div class="h-4 w-2/3 bg-gray-300 rounded"></div>
            <div class="h-4 w-1/2 bg-gray-300 rounded"></div>
            <div class="h-4 w-full bg-gray-300 rounded"></div>
          </div>
        </template>

        <!-- When the data has loaded -->
        <template v-else>
          <div v-for="(cfdi, index) in cfdis.data"
            :key="cfdi.uuid !== 'sin_uuid' && cfdi.uuid ? cfdi.uuid : cfdi.folio + '-' + index" :class="[
              'border-2 rounded-md shadow my-4 p-4 flex',
              cfdi.status !== 'cancelada' ? 'border-emerald-200' : 'border-red-200'
            ]">
            <!-- Left column: Information -->
            <div class="w-2/3">
              <h3 :class="[
                'text-lg font-medium mb-2',
                cfdi.status !== 'cancelada' ? 'text-emerald-500' : 'text-red-500'
              ]">
                Tipo de CFDI: {{ cfdi.cfdi_type }}
              </h3>
              <p><span class="font-semibold">Folio:</span> {{ cfdi.folio }}</p>
              <p><span class="font-semibold">Serie:</span> {{ cfdi.serial }}</p>
              <p class="font-bold"><span class="font-semibold">Total:</span> {{ formatTotal(cfdi.total) }}</p>
              <p class="my-2"><span class="font-semibold">Fecha:</span> {{ cfdi.date }}</p>
              <p :class="[cfdi.status !== 'cancelada' ? 'text-emerald-500' : 'text-red-500']">
                <span class="font-semibold">Estado:</span> {{ cfdi.status }}
              </p>
            </div>

            <!-- Right column: Actions -->
            <div :class="[
              'w-1/3 flex flex-col justify-around items-center border-l pl-4',
              cfdi.status !== 'cancelada' ? 'border-emerald-500' : 'border-red-500'
            ]">
              <!-- Action: View CFDI -->
              <router-link v-if="cfdi.links.self" :to="{ name: 'Show', params: { uuid: cfdi.uuid } }"
                class="flex flex-col justify-center items-center text-green-400 hover:text-green-700 transition">
                <FontAwesomeIcon :icon="['fas', 'eye']" class="text-2xl" />
                <span class="text-sm mt-1">Ver</span>
              </router-link>

              <!-- Action: Send email -->
              <button v-if="cfdi.links.email" v-on:click="sendCfdiByEmail(cfdi.uid, cfdi.links.email)"
                class="flex flex-col justify-center items-center text-emerald-600 hover:text-emerald-700 transition">
                <FontAwesomeIcon :icon="['fas', 'envelope']" class="text-2xl" />
                <span class="text-sm mt-1">Enviar</span>
              </button>

              <!-- Action: Cancel (only if possible to cancel the CFDI) -->
              <button v-if="cfdi.links.cancel" v-on:click="cancelCfdi(cfdi.uid, cfdi.links.cancel)"
                class="flex flex-col justify-center items-center text-red-500 hover:text-red-700 transition">
                <FontAwesomeIcon :icon="['fas', 'times-circle']" class="text-2xl" />
                <span class="text-sm mt-1">Cancelar</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Page items selector -->
    <div class="flex items-center justify-between space-x-4 mt-5 p-4 bg-gray-50 rounded-xl shadow">
      <label for="itemsPerPage" class="text-gray-700 font-medium">
        Items por página:
      </label>

      <select id="itemsPerPage" v-model.number="list_page"
        class="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
        <option :value="cfdis.total">{{ cfdis.total }} (Todos)</option>
      </select>
    </div>
  </div>
</template>

<style scoped></style>
