/*
export const auth = (state) => {
  return state.auth.token
} */
export function user (state) {
  return state.user
}

export function auth (state) {
  return state.token
}
export function isLogged (state) {
  return state.isLogged
}
export function tipe (state) {
  return state.tipe
}
