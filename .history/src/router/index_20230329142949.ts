import { createRouter, createWebHistory, type RouteRecordRedirectOption } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,children:{}
    }
  ]
})

export default router
