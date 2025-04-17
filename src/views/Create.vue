<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const router = useRouter();

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;
const SECRET  = import.meta.env.VITE_API_SECRET;

// reactive variables
const cfdiTypes = ref([]);
const clients = ref([]);
const cfdiUsages = ref([]);
const paymentTerms = ref([]);
const paymentMethods = ref([]);
const paymentCurrencies = ref([]);
const unities = ref([]);

// dynamic selections
const typeSelected = ref(null);
const serialSelected = reactive({ id: '', name: '' });
const clientSelected = ref(null);
const usageSelected = ref(null);
const termSelected = ref(null);
const methodSelected = ref(null);
const currencySelected = ref(null);
const unitySelected = ref(null);

// loading state
const loading = ref(true);

// dynamic form
const form = reactive({ Conceptos: [] });

// hardcode receiver UID
const receptor = reactive({
  UID: '60cba20d024df'
});

// Helper fetch
async function fetchJson(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'F-Api-Secret': SECRET
    }
  });
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

// Load catalogs
async function loadAllCatalogs() {
  try {
    const [typesData, clientsData, usagesData, termsData, methodsData, currencyData, unitData] =
      await Promise.all([
        fetchJson('/v1/cfdi-types'),
        fetchJson('/v1/clients'),
        fetchJson('/v1/cfdi-usage'),
        fetchJson('/v1/payment-terms'),
        fetchJson('/v1/payment-methods'),
        fetchJson('/v1/payment-currency'),
        fetchJson('/v1/unit'),
      ]);

    cfdiTypes.value = typesData;
    clients.value = clientsData;
    cfdiUsages.value = usagesData;
    paymentTerms.value = termsData;
    paymentMethods.value = methodsData;
    paymentCurrencies.value = currencyData;
    unities.value = unitData;

    // dynamic initializations
    if (typesData.length) {
      const d = typesData[0];
      typeSelected.value = d.SerieType;
      serialSelected.id = d.SerieID;
      serialSelected.name = d.SerieName;
    }
    if (clientsData.length) clientSelected.value = clientsData[0].UID;
    if (usagesData.length) usageSelected.value = usagesData[0].key;
    if (termsData.length) termSelected.value = termsData[0].key;
    if (methodsData.length) methodSelected.value = methodsData[0].key;

    // Default currency MXN
    const defCur = currencyData.find(c => c.key === 'MXN') || currencyData[0];
    currencySelected.value = defCur?.key || null;

    if (unitData.length) unitySelected.value = unitData[0].key;
  } catch (err) {
    console.error('Error cargando catálogos:', err);
  } finally {
    loading.value = false;
  }
}

// Watchers
watch(typeSelected, newKey => {
  const t = cfdiTypes.value.find(x => x.SerieType === newKey);
  serialSelected.id = t?.SerieID || '';
  serialSelected.name = t?.SerieName || '';
});

const disableMethodSelect = computed(() => termSelected.value !== 'PUE');
watch(termSelected, newTerm => {
  if (newTerm !== 'PUE') methodSelected.value = null;
});

// Dynamic Conceptos
const addConcepto = () => {
  form.Conceptos.push({
    ClaveProdServ: '',
    Cantidad: null,
    ClaveUnidad: null,
    Unidad: null,
    ValorUnitario: null,
    Descripcion: '',
    ObjetoImp: ''
  });
};
const removeConcepto = idx => {
  if (form.Conceptos.length > 1) form.Conceptos.splice(idx, 1);
};

// Submit form
const submitForm = async () => {
  const payload = {
    Receptor: receptor,
    TipoDocumento: typeSelected.value,
    UsoCFDI: usageSelected.value,
    Serie: serialSelected.id,
    FormaPago: termSelected.value === 'PUE' ? methodSelected.value : null,
    MetodoPago: termSelected.value,
    Moneda: currencySelected.value,
    Conceptos: form.Conceptos,
  };

  try {
    Swal.fire({ title: 'Generando CFDI…', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await fetch(`${BASE_URL}/v1/cfdi`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'F-Api-Secret': SECRET
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    Swal.close();
    if (data.response === 'success') {
      await Swal.fire({ icon: 'success', title: 'CFDI generado', text: data.message });
      router.push('/home');
    } else {
      await Swal.fire({ icon: 'error', title: 'Error', text: data.message });
    }
  } catch (e) {
    console.error(e);
    Swal.close();
    await Swal.fire({ icon: 'error', title: 'Error de conexión' });
  }
};

// Init
addConcepto();
loadAllCatalogs();
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Main title -->
    <div class="bg-white w-full h-full pt-4 mb-6 flex flex-col justify-center items-center rounded-xl shadow">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Factura.com</h1>
    </div>

    <!-- Skeleton Form while loading -->
    <div v-if="loading" class="space-y-6">
      <div class="space-y-4 bg-white p-6 rounded shadow">
        <div class="h-6 bg-gray-200 rounded w-2/5 animate-pulse"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div class="space-y-4">
        <div v-for="n in 2" :key="n" class="bg-white p-4 rounded shadow space-y-2">
          <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main form -->
    <form v-else @submit.prevent="submitForm" class="bg-white shadow-md rounded-xl p-4">
      <!-- Receiver and CFDI data section -->
      <h2 class="text-xl font-medium text-gray-800 mb-4">Nuevo CFDI 4.0</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- CFDI type -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="TipoDocumento">
            Tipo de CFDI <span class="text-red-500">*</span>
          </label>
          <select name="TipoDocumento" id="TipoDocumento"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="typeSelected"
          >
            <option v-for="cfdiType in cfdiTypes" :key="cfdiType.SerieType" :value="cfdiType.SerieType">
              {{ cfdiType.SerieDescription }} - {{ cfdiType.SerieName }}
            </option>
          </select>
        </div>
        <!-- Client (selected but not sent to backend) -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="cliente">
            Cliente <span class="text-red-500">*</span>
          </label>
          <select name="cliente" id="cliente"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="clientSelected"
          >
            <option v-for="client in clients" :key="client.UID" :value="client.UID">
              {{ client.RFC }} - {{ client.RazonSocial }}
            </option>
          </select>
        </div>
        <!-- Place of issue -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="LugarExpedicion">
            Lugar de expedición
          </label>
          <select name="LugarExpedicion" id="LugarExpedicion"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="1">Principal</option>
            <option value="2">Sucursal uno</option>
          </select>
        </div>
        <!-- CFDI usage -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="UsoCFDI">
            Uso de CFDI <span class="text-red-500">*</span>
          </label>
          <select name="UsoCFDI" id="UsoCFDI"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="usageSelected"
          >
            <option v-for="cfdiUsage in cfdiUsages" :key="cfdiUsage.key" :value="cfdiUsage.key">
              {{ cfdiUsage.key }} - {{ cfdiUsage.name }}
            </option>
          </select>
        </div>
        <!-- CFDI series -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="Serie">
            Serie <span class="text-red-500">*</span>
          </label>
          <select name="Serie" id="Serie"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="serialSelected.id"
          >
            <option :value="serialSelected.id">
              {{ serialSelected.name }}
            </option>
          </select>
        </div>
        <!-- Payment methods -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="MetodoPago">
            Métodos de pago <span class="text-red-500">*</span>
          </label>
          <select name="MetodoPago" id="MetodoPago"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="termSelected"
          >
            <option v-for="term in paymentTerms" :key="term.key" :value="term.key">
              {{ term.name }}
            </option>
          </select>
        </div>
        <!-- Payment methods -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="FormaPago">
            Formas de pago <span class="text-red-500">*</span>
          </label>
          <select name="FormaPago" id="FormaPago"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="methodSelected"
            :disabled="disableMethodSelect"
          >
            <template v-if="disableMethodSelect">
              <option :value="null" disabled>Por definir</option>
            </template>
            <template v-else>
              <option v-for="method in paymentMethods" :key="method.key" :value="method.key">
                {{ method.name }}
              </option>
            </template>
          </select>
        </div>
        <!-- Payment currencies -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="currency">
            Moneda <span class="text-red-500">*</span>
          </label>
          <select id="currency"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="currencySelected"
          >
            <option v-for="currency in paymentCurrencies" :key="currency.key" :value="currency.key">
              {{ currency.key }} - {{ currency.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Conceptos section -->
      <h2 class="text-xl font-semibold">Conceptos</h2>
      <div v-for="(concepto, index) in form.Conceptos" :key="index" class="border border-emerald-300 p-4 rounded mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'claveProdServ' + index">
              Clave SAT <span class="text-red-500">*</span>
            </label>
            <input :id="'claveProdServ' + index" type="text" v-model="concepto.ClaveProdServ"
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              :for="'cantidad' + index"
            >
              Cantidad <span class="text-red-500">*</span>
            </label>
            <input
              :id="'cantidad' + index"
              type="number"
              min="2"
              v-model.number="concepto.Cantidad"
              @input="
                if (concepto.Cantidad <= 0) {
                  concepto.Cantidad = null;
                }
              "
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'claveUnidad' + index">
              Clave de unidad <span class="text-red-500">*</span>
            </label>
            <select :id="'claveUnidad' + index"
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              v-model="concepto.ClaveUnidad"
              @change="onUnidadChange(index)"
             >
              <option v-for="unit in unities" :key="unit.key" :value="unit.key">
                {{ unit.key }} - {{ unit.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'unidad' + index">
              Unidad <span class="text-red-500">*</span>
            </label>
            <input :id="'unidad' + index" type="text" v-model="concepto.Unidad"
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              :for="'ValorUnitario' + index"
            >
              Precio unitario <span class="text-red-500">*</span>
            </label>
            <input
              :id="'ValorUnitario' + index"
              type="number"
              min="2"
              v-model.number="concepto.ValorUnitario"
              @input="
                if (concepto.ValorUnitario <= 0) {
                  concepto.ValorUnitario = null;
                }
              "
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              :for="'descripcion' + index"
            >
              Descripción <span class="text-red-500">*</span>
            </label>
            <textarea
              :id="'descripcion' + index"
              v-model="concepto.Descripcion"
              rows="4"
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Escribe la descripción aquí..."
            ></textarea>
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'objetoImp' + index">
              Objeto de Impuesto <span class="text-red-500">*</span>
            </label>
            <select
              :id="'objetoImp' + index"
              v-model="concepto.ObjetoImp"
              class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option v-for="code in ['01','02','03','04','05','06','07','08']" :key="code" :value="code">
                {{ code }} -
                {{
                  {
                    '01': 'No objeto de impuesto',
                    '02': 'Si objeto de impuesto',
                    '03': 'Si objeto de impuesto y no obligado al desglose',
                    '04': 'Si objeto de impuesto y no causa impuesto',
                    '05': 'Sí objeto de impuesto, IVA crédito PODEBI',
                    '06': 'Sí objeto del IVA, no traslado IVA',
                    '07': 'No traslado del IVA, Sí desglose IEPS',
                    '08': 'No traslado del IVA, No desglose IEPS'
                  }[code]
                }}
              </option>
            </select>
          </div>
        </div>
        <!-- Botón para eliminar concepto -->
        <button type="button" @click="removeConcepto(index)"
          class="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">
          Eliminar concepto
        </button>
      </div>

      <!-- Botones para agregar conceptos y enviar el formulario -->
      <div class="flex items-center justify-between">
        <button type="button" @click="addConcepto"
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Agregar concepto
        </button>
        <button type="submit" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded">
          Enviar CFDI
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
