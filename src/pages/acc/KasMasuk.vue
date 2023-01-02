<template>
  <q-page padding>
    <kas jnsTrx="KM"/>
    <dataKas jns="M"/>
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
