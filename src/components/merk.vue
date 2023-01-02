<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtMerk"
      :columns="jdl"
      row-key="kodeMerk"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Merk Produk</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="tmbh"
          color="purple"
          class="q-ml-md"
        />
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">{{add}} Merk Produk</div>
        </q-card-section>
        <q-form
          @submit="addMerk(p)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
            <q-input
              filled
              v-model="p.kodeMerk"
              label="Kode Merk *"
              lazy-rules
              :rules="inRul"
              readonly
            />
            <q-input
              filled
              v-model="p.namaMerk"
              label="Nama Merk *"
              lazy-rules
              :rules="inRul"
            />
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
import { reactive, onMounted, toRefs } from '@vue/composition-api'
import { getMerk, inMerk } from '../services/apiList'
export default {
  // name: 'PageName',
  setup (props, { root }) {
    const dt = reactive({
      dtMerk: [],
      jdl: [
        { name: 'kodeMerk', label: 'Kode Merk', field: row => row.kodeMerk, align: 'left' },
        { name: 'namaMerk', label: 'Nama Merk', field: row => row.namaMerk, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: { kodeMerk: '', namaMerk: '' },
      selected: [],
      cari: '',
      COA: [],
      add: 'Add'
    })
    onMounted(() => {
      dataMerk()
    })
    const dataMerk = () => {
      getMerk()
        .then(({ data }) => {
          dt.dtMerk = data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const addMerk = (x) => {
      inMerk(x)
        .then(res => {
          dt.adP = false
          dt.p = { kodeMerk: '', namaMerk: '' }
          dataMerk()
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onReset = () => {
      dt.p = { }
    }
    const tmbh = () => {
      let total = dt.dtMerk.reduce((a, b) => a + 1, 1)
      dt.p.kodeMerk = total.toString().padStart('0', 3)
      dt.p.namaMerk = ''
      dt.adP = true
    }
    return {
      ...toRefs(dt),
      addMerk,
      onReset,
      tmbh
    }
  },
  watch: {
    selected: function (v) {
      if (v.length > 0) {
        this.p = v[0]
        this.adP = true
        this.add = 'Edit'
      }
    }
  }
}
</script>
