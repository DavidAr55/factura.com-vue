<script setup>
import { ref, watch, onMounted } from 'vue';
import Swal from 'sweetalert2';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle, faEnvelope, faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Agrega los íconos a la librería
library.add(faTimesCircle, faEnvelope, faEye)

const BASE_URL = "http://127.0.0.1:8000/api";
const cfdis = ref({});
let allCfdis = [];
const list_page = ref(10);
const loading = ref(true);

const loadCfdis = async () => {
  const url = new URL(`${BASE_URL}/v1/cfdi`);
  url.searchParams.append('per_page', list_page.value);

  try {
    loading.value = true;
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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

const cancelCfdi = async (uuid) => {
  const { value: motivo } = await Swal.fire({
    title: 'Seleccione el motivo de cancelación',
    input: 'select',
    inputOptions: {
      '01': '01 - Comprobante emitido con errores con relación',
      '02': '02 - Comprobante emitido con errores sin relación',
      '03': '03 - No se llevó; a cabo la operación',
      '04': '04 - Operación nominativa relacionada en la factura global'
    },
    inputPlaceholder: 'Seleccione un motivo',
    showCancelButton: true,
    confirmButtonText: 'Continuar'
  });

  if (!motivo) {
    return;
  }

  let replacementUuid = null;
  // Si el motivo es "01", mostramos un segundo modal para seleccionar el UUID de reemplazo
  if (motivo === '01') {
    const { value: repUuid } = await Swal.fire({
      title: 'Seleccione el UUID de reemplazo',
      input: 'select',
      // Aquí debes definir las opciones de UUID; en este ejemplo se usan valores fijos.
      inputOptions: {
        'uuid-1': 'UUID 1',
        'uuid-2': 'UUID 2',
        'uuid-3': 'UUID 3'
      },
      inputPlaceholder: 'Seleccione un UUID',
      showCancelButton: true,
      confirmButtonText: 'Aceptar'
    });

    // Si el usuario cancela o no selecciona, detenemos el proceso
    if (!repUuid) {
      return;
    }
    replacementUuid = repUuid;
  }

  // Preparamos la data a enviar (según tu API, podrías enviar el motivo y el UUID de reemplazo si aplica)
  const data = {
    motivo: motivo,
    replacementUuid: replacementUuid
  };

  // Realizamos la solicitud de cancelación enviando la data en el body en formato JSON
  const response = await fetch(`${BASE_URL}/v1/cfdi/${uuid}/cancel`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  // Podemos mostrar un mensaje al usuario según el resultado de la operación
  if (response.ok) {
    Swal.fire('Cancelación exitosa', '', 'success');
  } else {
    Swal.fire('Error al cancelar', '', 'error');
  }
};

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
  <!-- Título Principal -->
  <div class="bg-white w-full h-full pt-4 flex flex-col justify-center items-center rounded-xl shadow">
    <h1 class="text-3xl font-bold text-gray-800 mb-4">Factura.com</h1>
  </div>

  <!-- Botón para Crear CFDI -->
  <div class="w-full flex flex-col justify-center rounded-xl shadow my-7">
    <a href="" class="p-2.5 rounded-md bg-emerald-500 text-white font-bold text-center decoration-0">
      Crear CFDI
    </a>
  </div>

  <!-- Contenedor Principal CFDI -->
  <div class="bg-white w-full h-full p-4 rounded-xl shadow">
    <h2 class="text-xl font-medium text-gray-800 mb-4">Historial de CFDI</h2>

    <!-- Input de Búsqueda -->
    <div class="w-full flex justify-center mb-4">
      <input 
        type="text" 
        placeholder="Buscar por Folio..."
        @input="searchFolio"
        class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>

    <!-- Área de listado con Skeleton -->
    <div class="h-[510px] overflow-y-auto">
      <!-- Si está cargando, se muestran skeletons -->
      <template v-if="loading">
        <div v-for="n in 2" :key="n" class="animate-pulse flex flex-col gap-4 border-2 border-gray-300 rounded-md shadow my-4 p-4">
          <div class="h-6 w-3/4 bg-gray-300 rounded"></div>
          <div class="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div class="h-4 w-2/3 bg-gray-300 rounded"></div>
          <div class="h-4 w-1/2 bg-gray-300 rounded"></div>
          <div class="h-4 w-full bg-gray-300 rounded"></div>
        </div>
      </template>

      <!-- Cuando ya cargó la información -->
      <template v-else>
        <div v-for="(cfdi, index) in cfdis.data" 
          :key="cfdi.uuid !== 'sin_uuid' && cfdi.uuid ? cfdi.uuid : cfdi.folio + '-' + index" 
          :class="[
            'border-2 rounded-md shadow my-4 p-4 flex',
            cfdi.status !== 'cancelada' ? 'border-emerald-200' : 'border-red-200'
          ]">
          <!-- Columna Izquierda: Información -->
          <div class="w-2/3">
            <h3 
              :class="[
                'text-lg font-medium mb-2', 
                cfdi.status !== 'cancelada' ? 'text-emerald-500' : 'text-red-500'
              ]">
              Tipo de CFDI: {{ cfdi.cfdi_type }}
            </h3>
            <p><span class="font-semibold">Folio:</span> {{ cfdi.folio }}</p>
            <p><span class="font-semibold">Serie:</span> {{ cfdi.serial }}</p>
            <p class="font-bold"><span class="font-semibold">Total:</span> {{ formatTotal(cfdi.total) }}</p>
            <p class="my-2"><span class="font-semibold">Fecha:</span> {{ cfdi.date }}</p>
            <p :class="[ cfdi.status !== 'cancelada' ? 'text-emerald-500' : 'text-red-500' ]">
              <span class="font-semibold">Estado:</span> {{ cfdi.status }}
            </p>
            <p><span class="font-semibold">Uuid:</span> {{ cfdi.uuid }}</p>
          </div>

          <!-- Columna Derecha: Acciones -->
          <div :class="[
              'w-1/3 flex flex-col justify-around items-center border-l pl-4', 
              cfdi.status !== 'cancelada' ? 'border-emerald-500' : 'border-red-500'
              ]">
            <!-- Acción: Ver CFDI -->
            <button v-if="cfdi.links.self" @click="window.open(cfdi.links.self, '_blank')"
                    class="flex flex-col justify-center items-center text-blue-500 hover:text-blue-700 transition">
              <FontAwesomeIcon :icon="['fas', 'eye']" class="text-2xl" />
              <span class="text-sm mt-1">Ver</span>
            </button>

            <!-- Acción: Enviar email -->
            <button v-if="cfdi.links.email" @click="window.open(cfdi.links.email, '_blank')"
                    class="flex flex-col justify-center items-center text-emerald-500 hover:text-emerald-700 transition">
              <FontAwesomeIcon :icon="['fas', 'envelope']" class="text-2xl" />
              <span class="text-sm mt-1">Enviar</span>
            </button>
            
            <!-- Acción: Cancelar (solo si es posible cancelar el CFDI) -->
            <button v-if="cfdi.links.cancel" v-on:click="cancelCfdi(cfdi.uuid)"
                    class="flex flex-col justify-center items-center text-red-500 hover:text-red-700 transition">
              <FontAwesomeIcon :icon="['fas', 'times-circle']" class="text-2xl" />
              <span class="text-sm mt-1">Cancelar</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- Selector de items por página -->
  <div class="flex items-center justify-between space-x-4 mt-5 p-4 bg-gray-50 rounded-xl shadow">
    <label for="itemsPerPage" class="text-gray-700 font-medium">
      Items por página:
    </label>
    
    <select 
      id="itemsPerPage"
      v-model.number="list_page"
      class="block w-32 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
    >
      <option value="5">5</option>
      <option value="10">10</option>
      <option value="20">20</option>
      <option value="50">50</option>
      <option :value="cfdis.total">{{ cfdis.total }} (Todos)</option>
    </select>
  </div>
</template>

<style scoped></style>
