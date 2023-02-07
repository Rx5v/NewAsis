// import Vue from 'vue'
import axios from "axios";
import { Cookies, Loading, QSpinnerGears, Notify } from "quasar";
// axios.defaults.baseURL = 'http://103.55.36.142:3001'
// axios.defaults.baseURL = 'http://asis.amazink.id:3400/api'
// axios.defaults.baseURL = "/api";
axios.defaults.baseURL = "http://localhost:3001/";
// axios.defaults.baseURL = 'http://103.55.36.177:3300/api'
axios.withCredentials = true;

export default function ({ Vue, ssrContext, router, store }) {
  const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies;

  axios.interceptors.request.use(
    (config) => {
      Loading.show({
        spinner: QSpinnerGears,
      });
      let token = cookies.get("token") || store.state.auth.token;
      //  if (!token) { token = store.state.auth.token }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  axios.interceptors.response.use(
    function (response) {
      Loading.hide();
      const a = response.config.headers.Authorization
        ? response.config.headers.Authorization.split(" ")[1]
        : "";
      store.dispatch("auth/token", a);
      // store.commit('token', response.config.headers.Authorization.split(' ')[1])
      return response;
    },
    function (error) {
      // Do something with response error
      Loading.hide();
      /* const code = parseInt(error.response && error.response.status)
    if (code === 400) {
      router.push('/400')
    } */
      if (error.response.status === 401) {
        Notify.create({
          message: error.response.data.st || error.response.data,
          color: "pink",
          timeout: 18000,
        });
        router.push("/login");
      } else {
        Notify.create({
          message: error.response.data.st || error.response.data,
          color: "warning",
          timeout: 2000,
        });
      }
      return Promise.reject(error);
    }
  );

  /* axios.onError(error => {

  }) */

  Vue.prototype.$axios = axios;
  store.axios = axios;
  router.axios = axios;
}
