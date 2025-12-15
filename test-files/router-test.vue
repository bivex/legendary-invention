<template>
  <div>
    <router-view />
  </div>
</template>

<script>
import Vue from 'vue'
import VueRouter from 'vue-router'

// Import components eagerly (anti-pattern for MISSING_LAZY_LOADING)
import Home from './components/Home.vue'
import About from './components/About.vue'
import Contact from './components/Contact.vue'
import Dashboard from './components/Dashboard.vue'
import Profile from './components/Profile.vue'
import Settings from './components/Settings.vue'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    // MISSING_LAZY_LOADING: All routes use eager imports
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/contact', component: Contact },
    { path: '/dashboard', component: Dashboard },
    { path: '/profile', component: Profile },
    { path: '/settings', component: Settings },
    // More routes to trigger bundle size concerns
    { path: '/admin', component: () => import('./components/Admin.vue') }, // This one is lazy loaded
    { path: '/reports', component: () => import('./components/Reports.vue') }, // This one too
  ]
})

// GOD_GUARD_ANTIPATTERN: Single beforeEach doing too many things
router.beforeEach((to, from, next) => {
  // Authentication check
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
    return
  }

  // Role-based access control
  if (to.meta.roles && !hasRequiredRole(to.meta.roles)) {
    next('/unauthorized')
    return
  }

  // Data prefetching
  if (to.meta.prefetch) {
    prefetchData(to.params.id).then(() => {
      next()
    }).catch(() => {
      next('/error')
    })
    return
  }

  // Analytics tracking
  trackPageView(to.path, {
    userId: getCurrentUserId(),
    timestamp: Date.now(),
    referrer: from.path
  })

  // Logging
  console.log(`Navigation: ${from.path} -> ${to.path}`)

  // Performance monitoring
  const startTime = performance.now()

  next()

  // More performance tracking
  setTimeout(() => {
    const endTime = performance.now()
    logPerformanceMetric('navigation_time', endTime - startTime)
  }, 0)
})

// INFINITE_NAVIGATION_LOOP: Guard that redirects without checking target
router.beforeEach((to, from, next) => {
  // This creates an infinite loop because it always redirects to /login
  // without checking if we're already going to /login
  if (!isAuthenticated()) {
    next('/login') // Always redirects, even when already going to /login
  } else {
    next()
  }
})

// Helper functions
function isAuthenticated() {
  return localStorage.getItem('token') !== null
}

function hasRequiredRole(roles) {
  const userRole = localStorage.getItem('role')
  return roles.includes(userRole)
}

function prefetchData(id) {
  return fetch(`/api/data/${id}`).then(res => res.json())
}

function getCurrentUserId() {
  return localStorage.getItem('userId')
}

function trackPageView(path, data) {
  // Analytics tracking logic
  console.log('Page view:', path, data)
}

function logPerformanceMetric(name, value) {
  // Performance logging logic
  console.log('Performance:', name, value)
}

export default router
</script>