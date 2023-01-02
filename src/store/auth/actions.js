
import axios from 'axios'
import { Cookies, Notify } from 'quasar'

export async function getUser ({ commit, router }) {
  axios.get('/user')
    .then(({ data }) => {
      commit('setCabang', data.user.dtAkun.kodeCab)
      commit('user', data.user.dtAkun)
    })
    .catch(err => {
      console.log(err)
      router.push('/login')
    })
}

export async function loginUser ({ commit, ssrContext }, x) {
  const cookies = process.env.SERVER
    ? Cookies.parseSSR(ssrContext)
    : Cookies
  try {
    let login = await axios.post('/login', x)
    let { data } = login
    if (data) {
      commit('user', data.user)
      commit('menu', data.user.userType)
      commit('isLogged', true)
      commit('setCabang', data.user.kodeCab)
      commit('token', data.token)
      if (!process.env.SERVER) {
        cookies.set('isLogged', true, { sameSite: 'Lax', secure: false })
        cookies.set('token', data.token, { sameSite: 'Lax', secure: false })
      }
      return data
    }
  } catch (error) {
    console.log(error)
    Notify.create({ message: error.response.data, color: 'red', timeout: 2000 })
    return error
    // router.push('/login')
  }

/* return axios.post('/login', x)
    .then(({ data }) => {
      return data
    })
    .catch(err => {
      console.log(err)
      Notify.create({ message: err, color: 'red' })
      router.push('/login')
    }) */
}
export function logoutUser ({ commit, ssrContext }, x) {
  const cookies = process.env.SERVER
    ? Cookies.parseSSR(ssrContext)
    : Cookies
  commit('user', {})
  commit('menu', '')
  commit('isLogged', false)
  let coki = cookies.getAll()
  for (let i in coki) {
    cookies.remove(i)
  }
  return 'Oke'
  /*  }) */
}
export async function user ({ commit, ssrContext, router }) {
  const cookies = process.env.SERVER
    ? Cookies.parseSSR(ssrContext)/* { store, ssrContext } */
    : Cookies
  try {
    let a = await axios.get('/user')
    let { data } = a
    if (data) {
      commit('user', data.user.dtAkun)
      commit('menu', data.user.dtAkun.userType)
      commit('isLogged', true)
      // commit('setCabang', data.user.dtAkun.kodeCab)
      if (!process.env.SERVER) {
        cookies.set('cabGrup', data.user.dtAkun.cabGrup, { sameSite: 'Lax', secure: false })
        cookies.set('isLogged', true, { sameSite: 'Lax', secure: false })
        if (cookies.get('setCabang')) {
          commit('setCabang', cookies.get('setCabang'))
        } else {
          commit('setCabang', data.user.dtAkun.kodeCab)
        }
      }
      return data.user.dtAkun.userType
    }
  } catch (error) {
    console.log(error)
  }
}

export function isLogged ({ commit, ssrContext }, x) {
  const cookies = process.env.SERVER
    ? Cookies.parseSSR(ssrContext)
    : Cookies
  commit('isLogged', x)
  cookies.set('isLogged', x)
}

export function setCB ({ commit, ssrContext }, x) {
  const cookies = process.env.SERVER
    ? Cookies.parseSSR(ssrContext)
    : Cookies
  commit('setCabang', x)
  cookies.set('setCabang', x)
}

export function token ({ commit, ssrContext }, x) {
  commit('token', x)
}
