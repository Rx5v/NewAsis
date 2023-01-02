export const login = (state, payload) => {
  state.token = payload.accessToken
}
export const user = (state, payload) => {
  state.user = payload
}
export const token = (state, payload) => {
  state.token = payload
}
export const menu = (state, payload) => {
  state.tipe = payload
}

export const setCabang = (state, payload) => {
  state.setCabang = payload
}
export const isLogged = (state, payload) => {
  state.isLogged = payload
}
