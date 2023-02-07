<template>
  <div>
    <q-table
      class="dataTrx"
      :data="rekap ? ringkas : dtJurnal"
      :columns="jdl"
      row-key="iddetJur"
      :filter="cari"
      :visible-columns="kolom"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Jurnal</div>
          <q-chip color="blue-6" class="text-white text-bold">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
            <q-date range v-model="tgl" @input="(x) => x && (getJurnal(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
          </q-popup-proxy>
        </q-chip>
          <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-md">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-toggle
            label="Ringkas"
            color="pink"
            v-model="rekap"
            keep-color
            readonly
          />
          <q-btn
            flat round dense
            icon="add_circle"
            @click="adJ=true"
            class="q-ml-md"
            color="accent"
          />
          <q-select
            v-if="['MAN','acc', 'mitra'].some(a=> a== $store.state.auth.user.userType)"
            v-model="pr.kodeCab"
            :options="cabAsi"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 300px"
            label="Pilih cabang... "
            :rules="inRul"
            dense
            @input="getJurnal"
            lazy-rules>
            <template v-slot:option="scope">
              <q-item
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label v-html="scope.opt.namaCabang" ></q-item-label>
                  {{ scope.opt.kodeCab }}
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="getJurnal"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-btn
            flat round dense
            icon="file_download"
            @click="toDown"
            class="q-ml-md"
            color="primary"
          />
      </template>
      <template v-slot:header="props">
        <q-tr>
          <q-th auto-width>
            No.
          </q-th>
           <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
          {{ col.label }}
           </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            {{ rekap ? ringkas.indexOf(props.row) +1 : dtJurnal.indexOf(props.row) +1 }}
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.name==='act'">
              <q-btn icon="fas fa-balance-scale" color="teal" dense outline class="q-ml-xs"  @click="cek(props.row)"/>
            </template>
            <template v-else-if="col.name === 'tgl'">
              {{ col.value }}
              <q-icon v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType) && !props.row.nomorSuratJalan" name="edit" class="q-ml-xs" color="red" @click="ubahTgl(props.row)" />
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td :colspan="rekap ? 5 : 7" class="text-center">Jumlah</q-td>
          <q-td v-if="!rekap" align="right">{{ total.debit | duit }}</q-td>
          <q-td align="right">{{ total.kredit | duit }}</q-td>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="adJ"
      full-width>
      <adJurnal title="Jurnal Umum"/>
    </q-dialog>
    <q-dialog
      v-model="adP"
      full-width>
      <edJur ref="apJur" :detJur="detJur" :jh="jh" @ok="updt"/>
    </q-dialog>

    <q-dialog
      v-model="ubT">
      <q-card
        style="width: 400px">
        <q-form
          ref="form"
          @submit="ubahTrx(ubahT, 'Ju')">
          <q-card-section>
            <div class="text-h5 text-orange-9">Ubah Tanggal Transaksi</div>
            <q-separator/>
            <q-chip outline color="teal">Nomor Bukti :  {{ ubahT.nomorJurnal }} </q-chip>
            <q-input v-model="ubahT.tgl" label="Tanggal Awal *" :rules="rules.required" readonly/>
            <q-input filled v-model="ubahT.tglBaru" label="Ubah Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxye" transition-show="scale" transition-hide="scale">
                    <q-date v-model="ubahT.tglBaru" @input="() => $refs.qDateProxye.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </q-card-section>
          <q-card-actions>
            <q-space/>
            <q-btn label="Batal" type="reset" outline rounded color="warning" v-close-popup/>
            <q-btn label="Simpan" type="submit" outline rounded color="teal" v-close-popup/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { reactive, toRefs, watch } from '@vue/composition-api'
import { dtJurnal, detailJur, dtCab, editTglTrx } from '../services/apiList'
import edJur from './acc/edJur'
import adJurnal from './acc/kas'
export default {
  components: {
    edJur,
    adJurnal
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.kodeCab, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'kodeAkun', label: 'Kode', field: row => row.kodeAkun, align: 'left' },
        { name: 'namaAkun', label: 'Nama Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'Debit', label: 'Debit', field: row => row.Debit, format: val => new Intl.NumberFormat('en-ID').format(val.toFixed(0)), jml: 'Y', align: 'right' },
        { name: 'Kredit', label: 'Kredit', field: row => row.Kredit, format: val => new Intl.NumberFormat('en-ID').format(val.toFixed(0)), jml: 'Y', align: 'right' },
        { name: 'status', label: 'status', field: row => row.status, align: 'right' },
        { name: 'ac', label: 'aCab', field: row => row.ac, align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      adJ: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: {
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: [root.$store.state.auth.user.kodeCab] },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      rekap: false,
      detJur: [],
      dtCabang: [],
      jh: {},
      hal: { rowsPerPage: 10, sortBy: 'tgl', descending: true },
      ubahT: {},
      ubT: false,
      rules: {
        required: [value => !!value || 'Harus diisi..'],
        min: [v => (v && v.length >= 4) || 'Min 4 characters']
      }
    })
    const getJurnal = () => {
      dt.dtJurnal = []
      dt.pr.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.pr.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.pr.kodeCab.length) {
        dtJurnal(dt.pr)
          .then(res => {
            dt.dtJurnal = res.data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.pr.kodeCab = [val]
      getJurnal()
    })
    return { ...toRefs(dt), getJurnal }
  },
  computed: {
    total () {
      let x = {}
      x.debit = this.dtJurnal.reduce((a, b) => this.$dwn.jumlah([a, b.Debit]), 0)
      x.kredit = this.dtJurnal.reduce((a, b) => this.$dwn.jumlah([a, b.Kredit]), 0)
      return x
    },
    kolom () {
      let a = this.jdl.map(b => b.name)
      if (this.rekap) {
        a.splice(5, 2)
        a.shift()
      }
      return a
    },
    ringkas () {
      let a = [...new Set(this.dtJurnal.map(a => a.nomorJurnal))]
      let b = []
      for (let i in a) {
        let c = {}
        let dt = this.dtJurnal.filter(s => s.nomorJurnal === a[i])
        c.nomorJurnal = a[i]
        c.nomorSuratJalan = dt[0].nomorSuratJalan
        c.Debit = dt.reduce((s, m) => this.$dwn.jumlah([s, m.Debit]), 0)
        c.Kredit = dt.reduce((s, m) => this.$dwn.jumlah([s, m.Kredit]), 0)
        c.judulJurnal = dt[0].judulJurnal
        c.status = dt[0].status
        c.tgl = dt[0].tgl
        c.kodeCab = dt[0].kodeCab
        c.ac = dt[0].ac
        b.push(c)
      }
      return b
    },
    cabAsi () {
      const pegang = this.$store.state.auth.user.cabGrup
      return this.dtCabang.filter(a => pegang.some(s => s === a.kodeCab))
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
      .then(res => {
        this.dtCabang = res.data
      })
  },
  methods: {
    ubahTgl (x) {
      this.ubahT = { ...x }
      this.ubT = true
    },
    ubahTrx (x, y) {
      x.jnsEdit = y
      editTglTrx(x)
        .then(res => {
          this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          this.getJurnal()
        })
        .catch(err => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, type: 'warning' })
        })
    },
    onReset () {
      this.p = { product_name: '', catID: '', product_description: '' }
    },
    toDown () {
      let x = {
        judul: `Laporan Jurnal Umum `,
        dt: this.rekap ? this.ringkas : this.dtJurnal,
        hdr: this.jdl,
        naFile: `dataJurnal`
      }
      this.$dwn.toExcel(x)
    },
    updt (x) {
      console.log(x)
      if (x === 'Y') {
        this.adP = false
        //        this.getJurnal()
      }
    },
    cek (x) {
      console.log(x)
      this.jh = { ...x }
      detailJur(x)
        .then(res => {
          this.adP = true
          this.detJur = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }
}
</script>
