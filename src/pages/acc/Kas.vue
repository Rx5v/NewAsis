<template>
  <q-page padding>
    <kas jnsTrx="KK"/>
    <dataKas/>
  </q-page>
</template>

<script>
import kas from '../../components/acc/trxKas'
import dataKas from '../../components/acc/dataKas'
export default {
  components: {
    kas,
    dataKas
  }
}
</script>
