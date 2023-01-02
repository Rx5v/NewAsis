<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dtJurnal"
      :columns="jdl"
      row-key="idJurnal"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-3 q-table__title">Menunggu Persetujuan</div>
          <q-select
            v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
            v-model="pr.kodeCab"
            :options="dtCabang"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            style="min-width: 250px; max-width: 300px"
            label="Pilih Cabang"
            :rules="inRul"
            dense
            lazy-rules
            @input="getJurnal"/>
          <q-input dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn
            flat round dense
            icon="file_download"
            @click="toDown"
            class="q-ml-md"
            color="primary"
          />
      </template>
      <template v-slot:body-cell-act="props">
        <q-icon name="folder_open" style="font-size:1.5rem" color="red" @click="cek(props.row)" />
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="6" class="text-center">Jumlah</q-td>
          <q-td>{{ total.debit | duit }}</q-td>
          <q-td>{{ total.kredit | duit }}</q-td>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="adP"
      width= "800px">
      <appJur ref="apJur" :detJur="detJurFilt" :jh="jh" @ok="updt"/>
    </q-dialog>
  </div>
</template>

<script>
import { dtTunggu, detailJur, dtCab } from '../../services/apiList'
import appJur from '../acc/appJur'
export default {
  components: {
    appJur
  },
  data () {
    return {
      dtJurnal: [],
      jdl: [
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judul', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'namaCabLain', label: 'Cabang Lain', field: row => row.namaCabLain, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'status', label: 'status', field: row => row.status, align: 'right' },
        { name: 'act', label: 'Action', align: 'center' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: '', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeCab: 'MP01' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      detJur: [],
      jh: {},
      dtCabang: [],
      kodeCab: this.$store.state.auth.user.kodeCab,
      hal: { rowsPerPage: 10 }
    }
  },
  computed: {
    total () {
      let x = {}
      x.debit = this.dtJurnal.reduce((a, b) => this.$dwn.jumlah([a, b.Debit]), 0)
      x.kredit = this.dtJurnal.reduce((a, b) => this.$dwn.jumlah([a, b.Kredit]), 0)
      return x
    },
    detJurFilt () {
      let kodeCab = ['MAN', 'acc'].some(a => a === this.$store.state.auth.user.userType) ? this.pr.kodeCab : this.$store.state.auth.user.kodeCab
      return this.detJur.filter(a => a.kodeCab === kodeCab)
    }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('dtBrg', e)
    }
  },
  mounted () {
    this.getJurnal()
    dtCab()
      .then(({ data }) => {
        this.dtCabang = data
      })
  },
  methods: {
    cek (x) {
      this.jh = { ...x }
      detailJur(x)
        .then(res => {
          this.adP = true
          this.detJur = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    getJurnal () {
      dtTunggu(this.pr)
        .then(res => {
          this.dtJurnal = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    updt (x) {
      console.log(x)
      if (x === 'Y') {
        this.adP = false
        this.getJurnal()
      }
    },
    onReset () {
      this.p = { product_name: '', catID: '', product_description: '' }
    },
    toDown () {
      let x = {
        judul: `Transaksi menunggu `,
        dt: this.dtJurnal,
        hdr: this.jdl,
        naFile: `trxApproval`
      }
      this.$dwn.toExcel(x)
    }
  }
}
</script>
