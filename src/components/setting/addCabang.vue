<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtCabang"
      :columns="jdl"
      row-key="kodeCab"
      selection="single"
      :selected.sync="selected"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Cabang dan Mitra</div>
        <q-space/>
        <q-select
          v-model="kodeCab"
          :options="dtCabang"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          emit-value
          map-options
          style="min-width: 250px; max-width: 300px"
          label="Repair data stok dan hpp"
          :rules="inRul"
          dense
          lazy-rules
          @input="repair(kodeCab)"/>
        <q-btn
          round dense
          outline
          icon="schedule"
          @click="adJam = true"
          class="q-ml-md"
        />
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
      v-model="adJam"
      >
      <q-card style="width: 400px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Jam Operasional Cabang / Mitra</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="jamTutup"
            label="Jam Operasional"
            type="text"
            mask="time"
            class="q-ml-md"
            style="width: 200px">
            <template v-slot:append>
              <q-btn
                round dense
                icon="check_circle"
                @click="setJam(jamTutup)"
                class="q-ml-md"
                color="teal"
              />
            </template>
          </q-input>
        </q-card-section>
      </q-card>
    </q-dialog>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Add Cabang / Mitra</div>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit="addCabang(p)"
            @reset="onReset"
            class="q-gutter-md">
            <div class="row justify-between">
              <div class="col-12 col-md-5">
                <q-select
                  filled
                  v-model="p.divisiCode"
                  label="Pilih divisi *"
                  :options="divisi"
                  option-label="divisiName"
                  option-value="divisiCode"
                  emit-value  map-options
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.namaCabang"
                  label="Nama Cabang/ Mitra *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.alamatCabang"
                  type="textarea"
                  label="Alamat *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.telp"
                  label="Telp *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.email"
                  label="Email *"
                  lazy-rules
                  :rules="inRul"
                />
                <q-input
                  filled
                  v-model="p.lokasi"
                  label="Koordinat peta"
                  lazy-rules
                />
                <q-input
                  filled
                  v-model="p.noteNota"
                  label="Note Nota"
                  lazy-rules
                />
                <q-input
                  v-model="p.jamBuka"
                  label="Jam Buka"
                  type="text"
                  mask="time"
                  class="q-ml-md"
                  style="width: 200px"/>
                <q-input
                  v-model="p.jamTutup"
                  label="Jam Tutup"
                  type="text"
                  mask="time"
                  class="q-ml-md"
                  style="width: 200px"/>
              </div>
              <div class="col-12 col-md-5">
              </div>
            </div>
            <div class="text-right">
              <q-btn label="Submit" type="submit" color="primary"/>
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { divCode, addCab, dtCab, repair, jamTutup } from '../../services/apiList'
export default {
  // name: 'PageName',
  data () {
    return {
      dtCabang: [],
      jdl: [
        { name: 'kodeCab', label: 'Kode', field: row => row.kodeCab, align: 'left' },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'kodeRingkas', label: 'Alias', field: row => row.kodeRingkas, align: 'left' },
        { name: 'divisiName', label: 'Divisi', field: row => row.divisiName, align: 'left' },
        { name: 'alamatCabang', label: 'Alamat', field: row => row.alamatCabang, align: 'left' },
        { name: 'email', label: 'Email', field: row => row.email, align: 'left' },
        { name: 'telp', label: 'Telp', field: row => row.telp, align: 'left' },
        { name: 'lokasi', label: 'Koordinat', field: row => row.lokasi, align: 'left' },
        { name: 'jamBuka', label: 'Jam Buka', field: row => row.jamBuka, align: 'left' },
        { name: 'jamTutup', label: 'Jam Tutup', field: row => row.jamTutup, align: 'left' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: { namaCabang: '', divisiCode: '', alamatCabang: '', email: '', telp: '', lokasi: '', noteNota: '', jamBuka: '07:00', jamTutup: '18:00' },
      divisi: [],
      selected: [],
      cari: '',
      kodeCab: '',
      jamTutup: '18:00',
      adJam: false
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.p = e
      this.adP = true
    }
  },
  mounted () {
    this.getdivCode()
    this.getCabang()
  },
  methods: {
    setJam (x) {
      jamTutup({
        jamTutup: this.jamTutup.split(':')[0]
      })
        .then(({ data }) => {
          this.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    repair (x) {
      repair(x)
        .then(({ data }) => {
          this.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    getdivCode () {
      divCode()
        .then(({ data }) => {
          this.divisi = data
        })
        .catch(err => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    getCabang () {
      dtCab()
        .then(res => {
          this.dtCabang = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    addCabang (x) {
      addCab(x)
        .then(res => {
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          this.getCabang()
          this.p = { namaCabang: '', divisiCode: '', alamatCabang: '', email: '', telp: '', lokasi: '', noteNota: '', jamBuka: '07:00', jamTutup: '18:00' }
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
