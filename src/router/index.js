import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Create from "../views/Create.vue";
import Show from "../views/Show.vue";

// Define the application routes with vue-router
const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: Home,
        meta: { title: 'Home - Factura.com' }
    },
    {
        path: '/create',
        name: 'Create',
        component: Create,
        meta: { title: 'Create - Factura.com' }
    },
    {
        path: '/show/:uuid',
        name: 'Show',
        component: Show,
        meta: { title: 'Show - Factura.com' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.afterEach((to) => {
    const DEFAULT_TITLE = 'Factura.com';
    document.title = to.meta.title || DEFAULT_TITLE;
});

export default router