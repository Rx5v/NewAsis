import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'

const options = { path: '/online' }
Vue.use(new VueSocketIO({
  debug: true,
  connection: ('http://103.55.36.142:3002/stream'),
  options: options
})
)
