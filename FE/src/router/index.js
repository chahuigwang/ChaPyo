import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/list' },
    { path: '/login', component: () => import('@/views/Login.vue') },
    {
      path: '/list',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/trip/:id',
      component: () => import('@/views/PlanDetail.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.initAuth()
  if (to.meta.requiresAuth && !auth.isAuthed) return '/login'
  if (to.path === '/login' && auth.isAuthed) return '/list'
})

export default router
