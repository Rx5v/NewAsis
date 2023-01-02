import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'
Vue.use(VueRouter)

export default function ({ app, store, ssrContext }) {
  const Router = new VueRouter({
    scrollBehavior: () => ({ x: 0, y: 0 }),
    routes,
    mode: process.env.VUE_ROUTER_MODE,
    base: process.env.VUE_ROUTER_BASE
  })
  Router.beforeResolve((to, from, next) => {
    next()
    /* if (to.path === '/login' || to.name === 'login' || to.path === '/' || to.path === '/videoConf') {
      next()
    } else {
      store.dispatch('auth/user')
        .then(user => {
          let userType = user || 'login'
          console.log(user)
          if (to.matched.some(rt => rt.meta.menu === userType)) {
            console.log('podo')
            next()
          } else {
            console.log('bedo')
            next({ path: `/${userType}` })
          }
        })
        .catch(err => {
          console.log(err)
          next({ path: '/login' })
        })
    } */
  })
  return Router
}
