<template>
  <q-page padding>
    <dtProdukCat/>
    <dtMerk class="q-mt-md"/>
  </q-page>
</template>

<script>
import dtProdukCat from '../../components/produkCat'
import dtMerk from '../../components/merk'
export default {
  // name: 'PageName',
  components: {
    dtProdukCat,
    dtMerk
  }
}
</script>
