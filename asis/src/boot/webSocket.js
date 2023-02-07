// import something here
// import Vue from 'vue'
import VueSocketIO from 'vue-socket.io'
// "async" is optional
export default async ({ Vue }) => {
  // something to do
  Vue.use(new VueSocketIO({
    debug: true,
    connection: 'http://localhost:3001'
  }))
}
