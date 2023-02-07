<template>
  <div>
    <q-table
      class="my-sticky-header-table"
      :data="dtUser"
      :columns="jdl"
      row-key="kodeProduk"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      dense>
      <template v-slot:top="props">
        <div class="col-2 q-table__title">Data User</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
        />
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Add User</div>
        </q-card-section>
        <q-form
          @submit="addUser(p)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
            <q-input
              filled
              v-model="p.product_name"
              label="Nama User *"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.product_description"
              label="Product deskripsi *"
              lazy-rules
              :rules="inRul"
            />
            <q-select filled v-model="p.catID" :options="category" label="Filled" emit-value  map-options/>
          </q-card-section>
          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn label="Batal" v-close-popup color="accent" flat />
            <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Submit" type="submit" color="primary" flat/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  // name: 'PageName',
  data () {
    return {
      dtUser: [],
      jdl: [
        { name: 'npp', label: 'NPP', field: row => row.npp, align: 'left' },
        { name: 'namaKaryawan', label: 'Nama Karyawan', field: row => row.namaKaryawan, align: 'left' },
        { name: 'cabang', label: 'Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'jabatan', label: 'Jabatan', field: row => row.jabatan, align: 'left' },
        { name: 'KTP', label: 'KTP', field: row => row.ktp, align: 'left' },
        { name: 'alamat', label: 'Alamat', field: row => row.alamat, align: 'left' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: { product_name: '', catID: '', product_description: '' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: ''
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtBrg', e)
    }
  },
  mounted () {
    this.getProduk()
  },
  methods: {
    getProduk () {
      api.dtUser()
        .then(res => {
          this.dtUser = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    addProduk (x) {
      console.log(x)
      api.addProduk(x)
        .then(res => {
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.p = { product_name: '', catID: '', product_description: '' }
    }
  }
}
</script>
<style lang="sass">
.my-sticky-header-table
  /* max height is important */
  .q-table__middle
    max-height: 200px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #c1f4cd

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
