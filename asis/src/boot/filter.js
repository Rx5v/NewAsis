import Vue from 'vue'
// import { isNumber } from 'util'
Vue.filter('nomer', val => {
  let x = isNaN(val) ? val : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val)
  return x
})
Vue.filter('duit', val => {
  let x = isNaN(val) ? 0 : new Intl.NumberFormat('en').format(Number(val).toFixed(0))
  return x
})
Vue.filter('rupiah', val => {
  if (isNaN(val)) { val = 0 }
  // return 'Rp. ' + new Intl.NumberFormat('en-ID').format(val)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val)
}
)
Vue.filter('dolar', val => {
  if (isNaN(val)) { val = 0 }
  //  return  new Intl.NumberFormat('en-ID').format(val)
  return new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'USD' }).format(val)
}
)

Vue.filter('tanggal', val => {
  if (!val) { return null }
  let x = new Date(val)
  let t = x === 'Invalid Date' ? '' : `${x.getFullYear()}-${(x.getMonth() + 1).toString().padStart(2, '0')}-${x.getDate().toString().padStart(2, '0')}`
  //  return  new Intl.NumberFormat('en-ID').format(val)
  return t
}
)
export default ({ Vue }) => {
  Vue.prototype.$filters = Vue.filter
}
