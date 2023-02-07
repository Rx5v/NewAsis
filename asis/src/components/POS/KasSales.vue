<template>
  <div class="row no-wrap q-pa-md" >
    <div style="overflow: auto; max-width: 400px;">
      <q-card >
        <q-card-section top-right>
          <q-input filled v-model="bln" label="Bulan" dense lazy-rules readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="bln" @input="() => {$refs.qDateProxy.hide(), kasSalesAll()}" mask="YYYY-MM" lazy-rules />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-card-section>
          <q-item dense>
            <q-item-section class="text-bold">
              {{ dtSales.namaKaryawan }}
            </q-item-section>
            <q-item-label>
              <q-avatar rounded>
                <img :src="`../statics/photo/${dtSales.photo}`">
              </q-avatar>
            </q-item-label>
          </q-item>
        </q-card-section>
        <q-separator />
        <q-list dense>
          <q-item v-for="col in jdl" :key="col.name">
            <q-item-section>
              <q-item-label>{{ col.label }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <template v-if="col.jml==='Y'">
                <q-item-label class="text-bold text-italic" caption>{{ dtKas[col.name] | duit}}</q-item-label>
              </template>
              <template v-else>
                <q-item-label class="text-bold text-italic" caption>{{ dtKas[col.name] }}</q-item-label>
              </template>
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-section>
          <q-expansion-item
            expand-separator
            icon="view_list"
            label="Detail transaksi belum setor"
            header-class="text-purple"
            @click="detail()"
          >
            <q-markup-table
                dense
                flat
                wrap-cell>
                <thead>
                  <tr>
                    <th class="text-right">No</th>
                    <th class="text-left">Nomor Bukti</th>
                    <th class="text-right">Nilai</th>
                    <th class="text-right">Setor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(dt,i) in detSisa" :key="dt.nomorBukti" @click="dtSetor= dt, confirm = !confirm">
                    <td class="text-right">{{ i + 1 }}</td>
                    <td class="text-left">{{ dt.nomorBukti }}</td>
                    <td class="text-right">{{ dt.jmlHarga | duit }}</td>
                    <td class="text-right">{{ dt.setoran }}</td>
                  </tr>
                </tbody>
              </q-markup-table>
          </q-expansion-item>
        </q-card-section>
      </q-card>
      <q-dialog v-model="confirm" persistent>
        <q-card>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6 text-center">Setoran Hasil Penjualan</div>
          </q-card-section>
          <q-card-section class="row">
            <q-item>
              <q-item-section>
                <q-item-label>Nomor Invoice</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption><q-chip color="secondary" outline dense>{{ dtSetor.nomorBukti }}</q-chip></q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Jumlah</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption><q-chip color="secondary" outline dense>{{ dtSetor.jmlHarga | duit }}</q-chip></q-item-label>
              </q-item-section>
            </q-item>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn outline rounded label="Tutup" color="warning" v-close-popup />
            <q-btn outline rounded label="Setor" color="primary" v-close-popup @click="setor (dtSetor)" v-if="dtSetor.setoran==='N'" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script>
import { sisaSales, kasSalesAll, salesSetor } from '../../services/apiList'
export default {
  data () {
    return {
      confirm: false,
      dtSetor: {},
      dtKas: [],
      jdl: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, align: 'left' },
        { name: 'namaCabang', label: 'Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'sisa', label: 'Sisa Kas', field: row => row.sisa, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty Penjualan', field: row => row.qty, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Omset tercapai', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', align: 'right' }
      ],
      cari: '',
      bln: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 7),
      chartData: null,
      selected: [],
      expanded: [],
      detSisa: [],
      jdls: [
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'jmlHarga', label: 'Nilai Penjualan', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', align: 'right' }
      ],
      dtSales: { namaKaryawan: '' }
    }
  },
  computed: {
    dtGrafik () {
      let x = {
        labels: this.dtKas.map(a => a.namaKaryawan),
        datasets: [{
          labels: ['oke', 'satu'],
          data: this.dtKas.map(a => a.qty)
        }]
      }
      console.log(this.dtKas.map(a => a.qty))
      return x
    }
  },
  mounted () {
    this.kasSalesAll()
  },
  methods: {
    setor (x) {
      salesSetor(x)
        .then(({ data }) => {
          this.$q.notify({ message: `${data.st}`, color: 'teal' })
          this.detail()
        })
        .catch(err => {
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    detail () {
      sisaSales(this.$store.state.auth.user.eID)
        .then(res => {
          this.detSisa = res.data.filter(a => a.salesID !== null)
        })
        .catch(err => {
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    kasSalesAll () {
      this.dtSales = {}
      kasSalesAll({ bln: this.bln })
        .then(res => {
          let ab = res.data
          let x = {
            labels: this.dtKas.map(a => a.namaKaryawan),
            datasets: [{
              labels: ['oke'],
              data: this.dtKas.map(a => a.qty)
            }]
          }
          this.dtKas = ab.find(a => a.salesID === this.$store.state.auth.user.eID)
          this.chartData = x
        })
        .catch(err => {
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
  }
}
</script>
