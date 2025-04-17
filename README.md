# factura.com-vue

Este repositorio es una prueba técnica para la empresa **Factura.com**. El objetivo es demostrar conocimientos en desarrollo frontend, consumiendo su API **a través de mi propio servidor backend**, de modo que **ninguna petición se haga directamente** al entorno sandbox de Factura.com. Toda la comunicación pasa por el backend hecho en Laravel.

---

## Funcionalidades requeridas

### Frontend (Vue.js)

- Listado de facturas (con las mismas columnas que en el backend)
- Funcionalidades:
  - Cancelar CFDI
  - Enviar CFDI por correo electrónico
  - Crear nuevo CFDI
- Interfaz intuitiva y responsive (mobile-first)
- Consumo de la API propia (no se llama directamente a Factura.com desde el frontend)

---

## Configuración del proyecto

Al iniciar el proyecto, lo primero que hice fue configurar `vue-router` para crear una SPA con rutas para las vistas **Home**, **Show** y **Create**, como se muestra en `src/router/index.js`:

```js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Create from "../views/Create.vue";
import Show from "../views/Show.vue";

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home, meta: { title: 'Home - Factura.com' } },
  { path: '/create', name: 'Create', component: Create, meta: { title: 'Create - Factura.com' } },
  { path: '/show/:uuid', name: 'Show', component: Show, meta: { title: 'Show - Factura.com' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.afterEach((to) => {
  const DEFAULT_TITLE = 'Factura.com';
  document.title = to.meta.title || DEFAULT_TITLE;
});

export default router;
```

---

## Variables de entorno y headers requeridos

Generé un archivo `.env` para guardar la URL base del servidor y las API keys necesarias para consumir mi API:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api

VITE_API_KEY=VUE-dfzo6FZOv7Z9629LLc9aO8PaIDxHFLks
VITE_API_SECRET=VUE-S-BC7DDD9F9DABC7F39F8BEEF721C33-1D1E3
```

Es indispensable tener este archivo correctamente configurado. Las claves se utilizan para autenticar las peticiones al backend de Laravel. A continuación un ejemplo en `src/App.vue`, donde realizo una petición de estado inicial al servidor:

```vue
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
    console.error('Error en la verificación del servidor:', error);
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
```

---

## ¿Cómo ejecutar correctamente el proyecto?

1. Clonar el repositorio:

```bash
git clone https://github.com/DavidAr55/factura.com-vue.git
cd factura.com-vue
```

2. Instalar dependencias:

```bash
npm install
```

3. Copiar archivo de entorno:

```bash
cp .env.example .env
```

4. Asegurarse de agregar la clave secreta en el archivo `.env`:

```env
VITE_API_SECRET=VUE-S-BC7DDD9F9DABC7F39F8BEEF721C33-1D1E3
```

5. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

> **Nota:** El proyecto debe ejecutarse en el puerto `:5173`, ya que es el puerto configurado en los CORS del servidor de Laravel.

---

## Vistas del sistema

- En la vista **Home** se listan todos los CFDIs y se puede interactuar con ellos usando los íconos a la derecha. También se puede seleccionar cuántos CFDIs cargar por página:

> ![Captura Home](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Home.png?raw=true)

- Al hacer clic en el ícono **ver**, se accede a la vista **Show**, donde se muestran los datos del CFDI seleccionado:

> ![Captura Show](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Show.png?raw=true)

- Si se presiona el botón con el ícono de **Email**, se enviará el CFDI al correo del receptor:

> ![Captura Email](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Email.png?raw=true)

- Al hacer clic en **Cancelar**, si el CFDI no está cancelado, se podrá cancelar indicando el motivo y, en caso de seleccionar el motivo "01", también el UUID relacionado:

> ![Captura Cancel](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Cancel.png?raw=true)

- Finalmente, el botón **Crear CFDI** lleva a la vista **Create**, donde se pueden generar nuevos CFDIs de forma básica. Por falta de tiempo no repliqué completamente la vista del dashboard original de Factura.com, pero sí desarrollé endpoints adicionales en el backend para facilitar esta tarea:

> ![Captura Create](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Create.png?raw=true)
> ![Captura Create CFDI](https://github.com/DavidAr55/factura.com-vue/blob/main/src/assets/Captura%20Create%20CFDI.png?raw=true)

  Para este CFDI en particular se envió la siguiente data en formato de json:
  ```json
    {
        "Receptor": {
            "UID": "60cba20d024df"
        },
        "TipoDocumento": "factura_hotel",
        "UsoCFDI": "G02",
        "Serie": "15430",
        "FormaPago": "03",
        "MetodoPago": "PUE",
        "Moneda": "MXN",
        "Conceptos": [
            {
            "ClaveProdServ": "43232408",
            "Cantidad": "19",
            "ClaveUnidad": "E48",
            "Unidad": "Unidad de servicio",
            "ValorUnitario": "525",
            "Descripcion": "Pruebas de envio",
            "ObjetoImp": "01"
            }
        ]
    }
  ```

---

## Autor

**David Arturo Loera Olmos**  
[GitHub: DavidAr55](https://github.com/DavidAr55)