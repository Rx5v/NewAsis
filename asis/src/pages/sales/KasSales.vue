<template>
  <q-page>
    <q-no-ssr>
      <salesKas/>
    </q-no-ssr>
  </q-page>
</template>
<script>
import salesKas from '../../components/POS/KasSales'
export default {
  preFetch ({ store, redirect }) {
    store.dispatch('auth/getUser')
  },
  components: {
    salesKas
  }
  /* mounted () {
    this.$store.dispatch('auth/getUser')
  } */
}
</script>
