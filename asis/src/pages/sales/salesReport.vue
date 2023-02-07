<template>
  <q-page padding>
    <salesAll/>
  </q-page>
</template>

<script>
import salesAll from '../../components/POS/salesReport'
export default {
  components: {
    salesAll
  }
}
</script>
<style>
 table table-bordered{
   border: 1px solid teal;
 }
</style>
