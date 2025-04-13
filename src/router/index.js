import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";

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
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router