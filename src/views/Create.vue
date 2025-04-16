<script setup>
import { reactive, ref, watch } from 'vue';

const BASE_URL = "http://127.0.0.1:8000/api";

// Listas reactivas
const cfdiTypes      = ref([]);
const clients        = ref([]);
const cfdiUsages     = ref([]);
const paymentMethods = ref([]);

// Selecciones
const typeSelected   = ref(null);
const serialSelected = ref(null);
const clientSelected = ref(null);
const usageSelected  = ref(null);
const methodSelected = ref(null);

// Estado de carga
const loading = ref(true);

// Formulario
const form = reactive({ Conceptos: [] });

// Campos hardcodeados del JSON
const receptor = reactive({
  UID: "60cba20d024df",
  ResidenciaFiscal: ""
});
const formaPago = ref("03");
const moneda = ref("MXN");

// Helper para fetch + JSON
async function fetchJson(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

// Carga concurrente
async function loadAllCatalogs() {
  try {
    const [ typesData, clientsData, usagesData, methodsData ] = await Promise.all([
      fetchJson('/v1/cfdi-types'),
      fetchJson('/v1/clients'),
      fetchJson('/v1/cfdi-usage'),
      fetchJson('/v1/payment-methods'),
    ]);

    cfdiTypes.value      = typesData;
    clients.value        = clientsData;
    cfdiUsages.value     = usagesData;
    paymentMethods.value = methodsData;

    if (typesData.length) {
      const defaultType = typesData.find(t => t.SerieName === "F") || typesData[0];
      typeSelected.value   = defaultType.SerieType;
      serialSelected.value = defaultType.SerieID;
    }
    if (clientsData.length)  clientSelected.value = clientsData[0].UID;
    if (usagesData.length)   usageSelected.value  = usagesData[0].key;
    if (methodsData.length)  methodSelected.value = methodsData[0].key;

  } catch (err) {
    console.error('Error cargando catálogos:', err);
  } finally {
    loading.value = false;
  }
}

// Watch para la serie de CFDI
watch(typeSelected, newKey => {
  const t = cfdiTypes.value.find(x => x.SerieType === newKey);
  serialSelected.value = t ? t.SerieName : '';
});

// Función para agregar un concepto al formulario
const addConcepto = () => {
  form.Conceptos.push({
    ClaveProdServ: '',
    Cantidad: '',
    ClaveUnidad: '',
    Unidad: '',
    ValorUnitario: '',
    Descripcion: '',
    ObjetoImp: ''
  });
};

// Función para eliminar un concepto (mínimo 1)
const removeConcepto = idx => {
  if (form.Conceptos.length > 1) form.Conceptos.splice(idx, 1);
};

// Función para enviar el formulario mediante POST a la API
const submitForm = async () => {
  // Se arma el payload con los nombres de claves requeridos por el backend
  const payload = {
    Receptor: receptor,
    TipoDocumento: typeSelected.value,
    UsoCFDI: usageSelected.value,
    Serie: serialSelected.value,
    FormaPago: formaPago.value,
    MetodoPago: methodSelected.value,
    Moneda: moneda.value,
    Conceptos: form.Conceptos,
    // Puedes agregar aquí otros campos opcionales si los requieres, por ejemplo:
    // FechaFromAPI: fechaFromAPI.value,
    // LugarExpedicion: lugarExpedicion.value,
  };

  console.log("Enviando payload:", payload);
  try {
    const res = await fetch(`${BASE_URL}/v1/cfdi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    const result = await res.json();
    console.log("Respuesta del API:", result);
    // Aquí puedes incluir lógica adicional para manejar la respuesta exitosa (por ejemplo, redireccionar o mostrar un mensaje)
  } catch (err) {
    console.error("Error al enviar CFDI:", err);
  }
};

// Inicialización: agrega un concepto con datos de prueba y carga los catálogos
form.Conceptos.push({
  ClaveProdServ: '43232408',
  Cantidad: 5, // Se sugiere enviar valores numéricos cuando se requiere un número
  ClaveUnidad: 'E48',
  Unidad: 'Unidad de servicio',
  ValorUnitario: 200, // Asegúrate de enviar un valor numérico si se valida como numérico
  Descripcion: 'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Magni, unde possimus illum hic aperiam doloribus maiores similique aliquam optio labore incidunt quas. Distinctio earum molestias vitae mollitia quaerat nesciunt nam?',
  ObjetoImp: '01'
});

loadAllCatalogs();
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Título Principal -->
    <div class="bg-white w-full h-full pt-4 mb-6 flex flex-col justify-center items-center rounded-xl shadow">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">Factura.com</h1>
    </div>

    <!-- Skeleton Form cuando carga la información -->
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

    <!-- Formulario principal -->
    <form v-else @submit.prevent="submitForm" class="bg-white shadow-md rounded-xl p-4">
      <!-- Sección Datos del Receptor y CFDI -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Tipo de CFDI -->
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
        <!-- Fecha del CFDI -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="FechaFromAPI">
            Fecha de CFDI
          </label>
          <select name="FechaFromAPI" id="FechaFromAPI"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="today">Timbrar con fecha actual</option>
            <option value="yesterday">Timbrar con fecha de ayer</option>
            <option value="two_days_ago">Timbrar con fecha de hace dos días</option>
            <option value="three_days_ago">Timbrar con fecha de hace tres días</option>
          </select>
        </div>
        <!-- Cliente (seleccionado pero no enviado al backend) -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="cliente">
            Cliente <span class="text-red-500">*</span>
          </label>
          <select name="cliente" id="cliente"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="clientSelected">
            <option v-for="client in clients" :key="client.UID" :value="client.UID">
              {{ client.RFC }} - {{ client.RazonSocial }}
            </option>
          </select>
        </div>
        <!-- Lugar de Expedición -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="LugarExpedicion">
            Lugar de expedición
          </label>
          <select name="LugarExpedicion" id="LugarExpedicion"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="1">Principal</option>
            <option value="2">Sucursal uno</option>
          </select>
        </div>
        <!-- Uso de CFDI -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="UsoCFDI">
            Uso de CFDI <span class="text-red-500">*</span>
          </label>
          <select name="UsoCFDI" id="UsoCFDI"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="usageSelected">
            <option v-for="cfdiUsage in cfdiUsages" :key="cfdiUsage.key" :value="cfdiUsage.key">
              {{ cfdiUsage.name }}
            </option>
          </select>
        </div>
        <!-- Serie del CFDI -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="Serie">
            Serie <span class="text-red-500">*</span>
          </label>
          <input 
            id="Serie" 
            type="text" 
            v-model="serialSelected"
            disabled
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" 
          />
        </div>
        <!-- Métodos de pago -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="MetodoPago">
            Métodos de pago <span class="text-red-500">*</span>
          </label>
          <select name="MetodoPago" id="MetodoPago"
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            v-model="methodSelected">
            <option v-for="method in paymentMethods" :key="method.key" :value="method.key">
              {{ method.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Sección con campos hardcodeados -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="receptorUID">
            Receptor UID
          </label>
          <input id="receptorUID" type="text" v-model="receptor.UID" readonly
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-gray-50 placeholder-gray-500 focus:outline-none transition-colors" />
        </div>
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="residenciaFiscal">
            Residencia Fiscal
          </label>
          <input id="residenciaFiscal" type="text" v-model="receptor.ResidenciaFiscal" readonly
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-gray-50 placeholder-gray-500 focus:outline-none transition-colors" />
        </div>
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="formaPago">
            Forma de Pago
          </label>
          <input id="formaPago" type="text" v-model="formaPago" readonly
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-gray-50 placeholder-gray-500 focus:outline-none transition-colors" />
        </div>
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2" for="moneda">
            Moneda
          </label>
          <input id="moneda" type="text" v-model="moneda" readonly
            class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-gray-50 placeholder-gray-500 focus:outline-none transition-colors" />
        </div>
      </div>

      <!-- Sección Conceptos -->
      <h2 class="text-xl font-semibold">Conceptos</h2>
      <div v-for="(concepto, index) in form.Conceptos" :key="index" class="border border-emerald-300 p-4 rounded mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'claveProdServ' + index">
              Clave Prod/Serv
            </label>
            <input :id="'claveProdServ' + index" type="text" 
                   v-model="concepto.ClaveProdServ"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'cantidad' + index">
              Cantidad
            </label>
            <input :id="'cantidad' + index" type="number" min="0" 
                   v-model="concepto.Cantidad"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'claveUnidad' + index">
              Clave de Unidad
            </label>
            <input :id="'claveUnidad' + index" type="text" 
                   v-model="concepto.ClaveUnidad"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'unidad' + index">
              Unidad
            </label>
            <input :id="'unidad' + index" type="text" 
                   v-model="concepto.Unidad"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'valorUnitario' + index">
              Valor Unitario
            </label>
            <input :id="'valorUnitario' + index" type="number" min="0" step="0.01" 
                   v-model="concepto.ValorUnitario"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'descripcion' + index">
              Descripción
            </label>
            <input :id="'descripcion' + index" type="text" 
                   v-model="concepto.Descripcion"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-gray-700 text-sm font-bold mb-2" :for="'objetoImp' + index">
              Objeto de Impuesto
            </label>
            <input :id="'objetoImp' + index" type="text" 
                   v-model="concepto.ObjetoImp"
                   class="w-full max-w-md p-2 border rounded-lg border-gray-300 bg-transparent placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors" />
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

<style scoped>
/* Puedes agregar estilos adicionales si es necesario */
</style>
