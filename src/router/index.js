import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Cfdi from "../views/Cfdi.vue";

// Define the application routes with vue-router
const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: Home
    },
    {
        path: '/cfdi/:uuid',
        name: 'Cfdi',
        component: Cfdi
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router