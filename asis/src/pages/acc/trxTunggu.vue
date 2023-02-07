<template>
  <q-page padding>
    <dataJurnal @add="adP = true"/>
  </q-page>
</template>

<script>
import dataJurnal from '../../components/acc/trxMenunggu'
export default {
  name: 'trxTunggu',
  components: {
    dataJurnal
  },
  data () {
    return {
      adP: false
    }
  }
}
</script>
