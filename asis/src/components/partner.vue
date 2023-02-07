<template>
  <q-card>
    <q-card-section>
      <q-table
        class="dataPR"
        :data="filtPartner"
        :columns="jdl"
        row-key="kodePartner"
        selection="single"
        :selected.sync="selected"
        :filter="cari"
        dense>
        <template v-slot:top>
          <q-toolbar>
            <q-toolbar-title>
              Partner
              <div class="q-pa-md" style="max-width: 300px">
                <q-select
                  v-model="p.jnsPartner"
                  :options="jnsP"
                  :rules="inRul"
                  emit-value
                  map-options
                  label="Jenis Partner"/>
              </div>
            </q-toolbar-title>
            <q-input dense debounce="300" v-model="cari" placeholder="Search">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              flat round dense
              icon="add_circle"
              @click="addBaru"
            />
          </q-toolbar>
        </template>
        <template v-slot:body-cell-telpPIC="props">
          <a :href="`https://wa.me/${props.row.telpPIC.replace(/-| /gi, '')}`" target="_blank">{{props.row.telpPIC}}</a>
        </template>
      </q-table>
    </q-card-section>
     <q-dialog
      v-model="adP"
      >
      <q-card style="width: 700px; max-width: 80vw;">
        <q-card-section>
          <div class="text-h6">Add Partner</div>
        </q-card-section>
        <q-form
          @submit="addPartner(p)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section>
            <q-select
              v-model="p.jnsPartner"
              :options="jnsP"
              :rules="inRul"
              map-options
              emit-value
              label="Jenis Partner *"/>
            <q-input
              filled
              v-model="p.namaPartner"
              label="Nama Partner *"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.tlp"
              label="Telp *"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.email"
              label="email"
              lazy-rules
            />
            <q-input
              filled
              v-model="p.alamat"
              label="Alamat *"
              type="textarea"
              lazy-rules
              :rules="inRul"
            />
            <q-input
              filled
              v-model="p.namaPIC"
              label="Nama PIC"
              lazy-rules
            />
            <q-checkbox v-model="cnPic" @input="kopi(p, 'namaPIC')" label="Sama dengan Nama Cust"/>
            <q-input
              filled
              v-model="p.telpPIC"
              label="Telp PIC"
              lazy-rules
              :prefix="(p.telpPIC.substring(0, 2) === '62' || p.telpPIC.substring(0, 1) === '+') ? '' : '62'"
              hint="No HP: 62-856-xxxx-xxxx "
            />
            <q-checkbox v-model="cpPic" @input="kopi(p, 'telpPIC')" label="Sama dengan Nomor Telp."/>
            <q-select
              filled
              v-if="p.cust === 'Y'"
              :rules="inRul"
              v-model="p.catPartner"
              :options="category"
              label="Kategori Customers"
              emit-value
              option-label="jenisCust"
              option-value="idCustCat"
              map-options/>
            <q-checkbox
              v-model="p.cust"
              label="Pelanggan"
              false-value="N"
              true-value="Y"
              :rules="inRul"/>
            <q-checkbox
              v-model="p.ven"
              label="Supplier"
              false-value="N"
              true-value="Y"
              :rules="inRul"/>
          </q-card-section>
          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn label="Batal" v-close-popup color="accent" flat />
            <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
            <q-btn label="Submit" type="submit" color="primary" flat/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-card-section>
      <pivotUI
        :dataTable="filtPartner"
        :dtPivot="dtPivot"
        hitung="Count"
        judul="Data Customers dan Suppliers"
      />
    </q-card-section>
  </q-card>
</template>

<script>
import pivotUI from '../components/chart/pivotData'
import { jnsCust, dtPartner, addPartner } from '../services/apiList'
export default {
  // name: 'PageName',
  components: {
    pivotUI
  },
  data () {
    return {
      dtPivot: {
        rows: ['jenisCust'],
        cols: ['kodeCab'],
        vals: ['']
      },
      dtPartner: [],
      jdl: [
        { name: 'kodePartner', label: 'Kode', field: row => row.kodePartner, sortable: true, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, sortable: true, align: 'left' },
        { name: 'jnsPartner', label: 'Jenis Partner', field: row => row.jnsPartner, sortable: true, align: 'left' },
        { name: 'kategori', label: 'Kategori', field: row => row.jenisCust, sortable: true, align: 'left' },
        { name: 'cust', label: 'Pelanggan', field: row => row.cust, sortable: true, align: 'left' },
        { name: 'ven', label: 'Suplier', field: row => row.ven, sortable: true, align: 'left' },
        { name: 'alamat', label: 'Alamat', field: row => row.alamat, sortable: true, align: 'left' },
        { name: 'tlp', label: 'Telp', field: row => row.tlp, sortable: true, align: 'left' },
        { name: 'namaPIC', label: 'PIC', field: row => row.namaPIC, sortable: true, align: 'left' },
        { name: 'telpPIC', label: 'Telp PIC', field: row => row.telpPIC, sortable: true, align: 'left' },
        { name: 'email', label: 'email', field: row => row.email, sortable: true, align: 'left' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: {
        namaPartner: '',
        idPartner: null,
        alamat: '',
        jnsPartner: 'Cust',
        catPartner: '',
        namaPIC: '',
        telpPIC: '',
        email: '',
        cust: 'Y',
        ven: 'N'
      },
      category: [],
      selected: [],
      cari: '',
      jnsP: [
        { label: 'Non-Expedisi', value: 'Cust' },
        { label: 'Expedisi', value: 'Exp' }
      ],
      cpPic: false,
      cnPic: false
    }
  },
  watch: {
    selected: function (v) {
      if (v.length > 0) {
        let e = { ...v[0] }
        this.$emit('dtBrg', e)
        this.adP = true
        this.p = e
      }
    }
  },
  computed: {
    filtPartner: function () {
      let a = this.p.jnsPartner === 'Exp' ? this.dtPartner.filter(x => x.jnsPartner === this.p.jnsPartner)
        : this.dtPartner.filter(x => x.jnsPartner !== 'Exp')
      return a
    }
  },
  mounted () {
    this.getPartner()
    jnsCust()
      .then(res => {
        this.category = res.data
      })
  },
  methods: {
    kopi (x, y) {
      if (x) {
        switch (y) {
          case 'namaPIC':
            x[y] = x.namaPartner
            break
          default:
            x[y] = x.tlp.replace(/^0/, '')
        }
      }
    },
    addBaru () {
      this.onReset()
      this.adP = true
    },
    getPartner () {
      dtPartner()
        .then(res => {
          this.dtPartner = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    addPartner (x) {
      // set telp PIC 62
      x.telpPIC = x.telpPIC.replace(/^(\+628|628|08|8|6208)/, '628')
      addPartner(x)
        .then(res => {
          this.onReset()
          this.getPartner()
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    onReset () {
      this.p = {
        namaPartner: '',
        idPartner: null,
        alamat: '',
        jnsPartner: 'Cust',
        catPartner: '',
        namaPIC: '',
        telpPIC: '',
        email: '',
        cust: 'Y',
        ven: 'N'
      }
    }
  }
}
</script>
