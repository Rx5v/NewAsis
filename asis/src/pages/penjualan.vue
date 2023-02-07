<template>
  <q-page padding>
    <jualBeli ref="jb" jnsTrx="J" status="T"/>
    <!-- content -->
  </q-page>
</template>

<script>
import jualBeli from '../components/jualBeli'

export default {
  name: 'penjualan',
  components: {
    jualBeli
  }
}
</script>
