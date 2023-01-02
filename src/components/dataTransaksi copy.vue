<template>
  <div>
    <q-card class="print-hide">
      <q-card-section>
        <q-table
          class="dataTrx"
          :data="transaksi"
          :columns="jdl"
          row-key="nomorBukti"
          :pagination.sync="hal"
          :filter="cari"
          dense>
          <template v-slot:top>
            <div class="col-3 q-table__title">Data Transaksi {{ jenis.judul }}</div>
            <q-select
              v-if="!allCat"
              v-model="filt.jnsCust"
              :options="jenisCust"
              multiple
              style="min-width: 250px; max-width: 300px"
              label="Kategori Partner "
              :rules="inRul"
              dense
              options-dense>
              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents"
                  dense
                >
                  <q-item-section>
                    <q-item-label v-html="scope.opt" ></q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-checkbox dense v-model="filt.jnsCust" :val="scope.opt" />
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-chip color="blue-6" class="text-white text-bold">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date range v-model="tgl" @input="(x) => x && (getTrx(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
              </q-popup-proxy>
            </q-chip>
            <q-toggle v-model="allCat" label="All Kategori Partner" color="orange" class="q-ml-md"/>
            <q-toggle v-model="perPartner" label="Per Partner  " color="orange" @input="getTrx" class="q-ml-md"/>
            <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-md">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              flat round dense
              icon="add_circle"
              @click="jb=true"
              class="q-ml-md"
              color="accent"
            />
            <q-btn
              flat round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
            <q-select
              v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="filt.kodeCab"
              :options="$store.state.auth.user.userType ==='MAN' ? cabAll : cabAsi"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              multiple
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              @input="getTrx"
              lazy-rules>
              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents"
                  dense
                >
                  <q-item-section>
                    <q-item-label v-html="`${scope.opt.kodeCab} ${scope.opt.namaCabang}`" ></q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="getTrx" dense/>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-btn
              flat round dense
              :icon="$q.fullscreen.isActive ? 'fullscreen_exit' : 'fullscreen'"
              @click="$q.fullscreen.toggle()"
              class="q-ml-md"
        />
          </template>
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th auto-width />
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                {{ col.label }}
              </q-th>
              <q-th>Action</q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <q-tr :props="props" :class="props.expand && 'bg-red-2'">
              <q-td auto-width>
                <q-icon size="sm" color="accent" dense @click="getdetTrx(props.row, props.expand),props.expand = !props.expand" :name="props.expand ? 'expand_less' : 'expand_more'" />
                {{ props.rowIndex + 1}}
              </q-td>
              <q-td
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
              >
                <template v-if="col.name === 'tglKirim'">
                  {{ col.value }}
                  <q-icon v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)" name="edit" class="q-ml-xs" color="red" @click="ubahTgl(props.row)" />
                </template>
                <template v-else-if="col.name === 'kodeCab'">
                  {{ jnsTrx === 'J' ? props.row.kodeCab : props.row.tujuan }}
                </template>
                <template v-else-if="col.name === 'namaSales'">
                  {{ col.value }}
                  <q-popup-edit v-model="props.row.gantiSales" buttons @save="ubahSales(props.row)">
                    <q-select
                      v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                      v-model="props.row.gantiSales"
                      use-input
                      :options="pilihSales.filter(a => a.kodeCab === props.row.cabID)"
                      :option-label="(item) => item && item.namaKaryawan +' '+ item.namaCabang"
                      option-value="salesID"
                      options-dense
                      map-options
                      style="min-width: 250px; max-width: 300px"
                      label="Sales ID"
                      @filter="filterFns"
                      :rules="inRul"
                      dense
                      lazy-rules/>
                  </q-popup-edit>
                </template>
                <template v-else-if="col.jml === 'Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
              <q-td auto-width v-if="!perPartner" :class="(props.row.jurnalReff === null && props.row.ancab === 'Y' && props.row.status === 'T') && 'bg-orange-5'">
                <q-btn icon="fas fa-edit" color="red-13" dense outline class="q-ml-xs" v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType) && props.row.status !== 'W'"
                  @click="buka(props.row)">
                  <q-tooltip content-class="bg-orange-13" :offset="[10, 10]" anchor="center left">
                    Buka transaksi
                  </q-tooltip>
                </q-btn>
                <q-btn v-if="props.row.status === 'W'" icon-right="edit" color="orange" fab-mini outline @click="editJubel(props.row)">
                  <q-tooltip content-class="bg-orange" :offset="[10, 10]" anchor="center left">
                    Edit
                  </q-tooltip>
                </q-btn>
                <q-btn v-if="['W', 'D'].some(a => a === props.row.status)" icon-right="check" color="teal" fab-mini outline
                  @click="pr=props.row,tompo(props.row)" class="q-ml-xs">
                  <q-tooltip content-class="bg-cyan" :offset="[10, 10]" anchor="center left">
                    Konfirm
                  </q-tooltip>
                </q-btn><!--
                <q-btn v-if="props.row.status === 'W'" icon-right="close" dense color="red" fab-mini outline @click="pr=props.row,terima('B')" class="q-ml-xs">
                  <q-tooltip content-class="bg-red" :offset="[10, 10]" anchor="center left">
                    Batal
                  </q-tooltip>
                </q-btn> -->
                <q-btn v-if="props.row.status === 'T' && props.row.garansi==='Y' && ['MAN','purchase', 'admin', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  icon-right="replay"
                  color="warning" flat @click="returBarang(props.row)" class="q-ml-xs">
                  <q-tooltip content-class="bg-orange" :offset="[10, 10]" anchor="center left">
                    Retur
                  </q-tooltip>
                </q-btn>
                <q-btn icon="print" dense outline color="orange" @click="getdetTrx(props.row, props.expand), cetak(props.row)" class="q-ml-xs"/>
                <q-btn icon="fas fa-balance-scale" color="teal" dense outline class="q-ml-xs"
                  v-if="['MAN','purchase', 'admin', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType) && ['T', 'D'].some(a => a === props.row.status)"
                  @click="cj=true,getJur(props.row)">
                  <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="center left">
                    Jurnal
                  </q-tooltip>
                </q-btn>
                <q-btn icon="fas fa-money-bill-alt" color="blue-13" dense outline class="q-ml-xs" v-if="['MAN','purchase', 'admin', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType) && props.row.status === 'T' && props.row.walkIn === 'Y'">
                  <q-tooltip content-class="bg-blue-13" :offset="[10, 10]" anchor="center left">
                    Klaim Point
                  </q-tooltip>
                </q-btn>
                <q-btn @click="updPoint(props.row)" icon="fas fa-money-bill-alt" dense outline class="q-ml-xs text-green-12" v-if="(['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType) && props.row.point === 'Y' && props.row.ac === 'N' && props.row.cabID !== 'AM01' && props.row.ancab !== 'Y') || props.row.totalPoint > 0">
                  <q-tooltip content-class="bg-brown-3 text-bold" :offset="[10, 10]" anchor="bottom left">
                    Repair Point
                  </q-tooltip>
                </q-btn>
              </q-td>
            </q-tr>
            <q-tr v-show="props.expand" :props="props">
              <q-td colspan="100%">
                <q-table
                  class="detTrx"
                  :data="perPartner ? rkpTrx.filter(a => a.kodePartner === props.row.kodePartner) : detTrx.filter(a => a.nomorBukti === props.row.nomorBukti)"
                  :columns="jdle"
                  row-key="kodeProduk"
                  separator="cell"
                  :pagination.sync="hald"
                  dense>
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td class="text-right">
                        {{ perPartner ? rkpTrx.filter(a => a.kodePartner === props.row.kodePartner).indexOf(props.row) +1 : detTrx.filter(a => a.nomorBukti === props.row.nomorBukti).indexOf(props.row) +1 }}
                      </q-td>
                      <q-td key="kodeProduk" :props="props">
                        {{ props.row.kodeProduk }}
                      </q-td>
                      <q-td key="namaBarang" :props="props">
                        {{ props.row.namaBarang }}
                      </q-td>
                      <q-td key="qty" :props="props">
                        {{ props.row.qty | nomer }}
                      </q-td>
                      <q-td key="jmlRetur" :props="props">
                        {{ props.row.jmlRetur | nomer }}
                      </q-td>
                      <q-td key="harga" :props="props">
                        {{ props.row.jmlHarga/props.row.qty | duit }}
                      </q-td>
                      <q-td key="jmlHarga" :props="props">
                        {{ props.row.jmlHarga - props.row.hrgRetur  | duit }}
                      </q-td>
                      <q-td key="ppn" :props="props">
                        {{ props.row.ppn | duit }}
                      </q-td>
                    </q-tr>
                  </template>
                  <template v-slot:bottom-row>
                    <q-tr>
                      <q-th colspan="6" class="text-right">Biaya Kirim</q-th>
                      <q-th class="text-right">
                        {{ props.row.biaya | duit }}
                      </q-th>
                    </q-tr>
                    <q-tr>
                      <q-th colspan="6" class="text-right">Diskon</q-th>
                      <q-th class="text-right">
                        {{ props.row.diskon | duit }}
                      </q-th>
                    </q-tr>
                    <q-tr>
                      <q-th colspan="6" class="text-right">Total Harga</q-th>
                      <q-th align="right">{{ props.row.totalAkhir | duit }}</q-th>
                    </q-tr>
                  </template>
                </q-table>
              </q-td>
            </q-tr>
          </template>
          <template v-slot:bottom-row>
            <q-tr>
              <q-td :colspan="perPartner ? 4 : 6" class="text-center">Jumlah</q-td>
              <q-td align="right">{{ transaksi.reduce((a,b) => $dwn.jumlah([a, b.totalHarga]), 0) | duit }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorBukti }}</span>
          <q-space/>
          <q-btn round
            icon="close"
            color="red"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Surat Jalan" color="primary" @click="printSjln(ctk)" />
          <q-btn outline label="Invoice A4" color="primary" @click="printA4(ctk)" />
          <q-btn outline label="Invoice Kertas Ply" color="primary" @click="printW(ctk)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="reT"
      full-width>
      <retur ref="retur" :pr="selected" :detTrx="detRet" @ttp="reT=false"/>
    </q-dialog>
    <q-dialog
      v-model="jb"
      full-width
      persistent>
      <q-card>
        <q-card-section>
          <q-btn
            icon="close"
            color="red"
            size="sm"
            class="absolute-top-right"
            v-close-popup/>
        </q-card-section>
        <q-card-section>
      <jualbeli
        :jnsTrx="jnsTrx"
        @jubel="getTrx"/>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="cj"
      full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="jh" @ok="cj=false" />
    </q-dialog>
    <q-dialog
      v-model="edjb"
      full-width>
      <editJB ref="editJB"
        :jnsTrx="jnsTrx"
        :expd="exp"
        :edDet="detTrx" :jh="jh" :potHrg="pot" :pelanggan="plgn" @jubel="edjb = false, getTrx()"/>
    </q-dialog>
    <q-dialog
      v-model="ubT">
      <q-card
        style="width: 400px">
        <q-form
          ref="form"
          @submit="ubahTrx(ubahT, 'Trx')">
          <q-card-section>
            <div class="text-h5 text-orange-9">Ubah Tanggal Transaksi</div>
            <q-separator/>
            <q-chip outline color="teal">Nomor Bukti :  {{ ubahT.nomorBukti }} </q-chip>
            <q-input v-model="ubahT.tglKirim" label="Tanggal Awal *" :rules="rules.required" readonly/>
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
import { dtTrx, detTrxR, detTrx, konfirm, dtCab, getJurtrans, getBankCab, rkpTransaksiS, editTglTrx, perbaiki, carikar, gantiSales, repairPoint } from '../services/apiList'
import retur from './POS/Retur'
import jualbeli from './jualBeli'
import edJur from './acc/edJur'
import editJB from './editJB'
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { Loading } from 'quasar'

export default {
  preFetch ({ store, redirect }) {
    Loading.show()
    store.dispatch('auth/user')
      .then(a => {
        console.log('iki pree layout')
        Loading.hide()
        if (a !== 'mitra') {
          let rd = a || 'login'
          redirect(`/${rd}`)
        }
      })
  },
  // name: 'PageName',
  props: {
    jnsTrx: {
      type: String,
      default: 'J',
      validator: function (x) {
        return ['J', 'B', 'RJ', 'RB'].indexOf(x) !== -1
      }
    }
  },
  components: {
    retur,
    jualbeli,
    edJur,
    editJB
  },
  setup (props, { root }) {
    const dt = reactive({
      allCat: true,
      dataTrx: [],
      detTrx: [],
      detRet: [],
      jdld: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'harga', label: 'Harga @', field: row => (row.jmlHarga / row.qty), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga, jml: 'Y', align: 'right' }
      ],
      jdle: [
        { name: 'index', label: '#', field: 'index', style: 'max-width: 10px' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'jmlRetur', label: 'Retur', field: row => row.jmlRetur, jml: 'Y', align: 'right' },
        { name: 'harga', label: 'Harga @', field: row => (row.jmlHarga / row.qty), jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'jmlHarga', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'ppn', label: 'ppn', field: row => row.ppn, jml: 'Y', align: 'right' }
      ],
      adP: false,
      jb: false,
      confirm: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglKirim: '' },
      pot: {},
      selected: {},
      expanded: [],
      cari: '',
      exp: { idExp: null, biaya: 0 },
      pn: false,
      reT: false,
      cj: false,
      detJur: [],
      jh: {},
      cabAll: [],
      hal: { rowsPerPage: 10 },
      hald: { rowsPerPage: 0 },
      edjb: false,
      ctk: {},
      plgn: { namaPartner: '', alamat: '' },
      perPartner: false,
      rkpTrx: [],
      filt: { kodeCab: [root.$store.state.auth.user.kodeCab], ac: 'N', tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), jnsCust: [] },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      ubahT: {},
      ubT: false,
      rules: {
        required: [value => !!value || 'Harus diisi..'],
        min: [v => (v && v.length >= 4) || 'Min 4 characters'],
        cek: [(v) => v === dt.u.password || 'Password tidak sama...']
      },
      dtSales: [],
      pilihSales: []
    })
    const opac = computed(() => {
      let a = [
        { label: 'Penjualan', value: 'N' },
        { label: 'Antar Cabang', value: 'Y' }
      ]
      props.jnsTrx === 'B' ? a[0].label = 'Pembelian' : a[0].label = 'Penjualan'
      return a
    })
    const rekapTransaksi = computed(() => {
      let dta = []
      if (dt.rkpTrx.length > 0) {
        let sp = [...new Set(dt.rkpTrx.map(s => s.kodePartner))] // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dt.rkpTrx.filter(x => x.kodePartner === sp[i])
          let s = { ...f[0] } // ambil value untuk rekanan
          s.totalHarga = f.reduce((x, y) => root.$dwn.jumlah([x, y.jmlHarga]), 0)
          s.totalAkhir = f.reduce((x, y) => root.$dwn.jumlah([x, y.totalHarga]), 0)
          s.totalPoint = f.reduce((x, y) => root.$dwn.jumlah([x, y.totalPoint]), 0)
          dta.push(s) // add to data array
          //          console.log(dta)
          // tinggal add judulnya
        }
      }
      return dta
    })
    const transaksi = computed(() => {
      let data = dt.perPartner ? rekapTransaksi.value : dt.dataTrx
      let a = dt.allCat ? data : data.filter(s => dt.filt.jnsCust.some(d => d === s.kategoriCust))
      return a
    })
    const jenisCust = computed(() => {
      let data = dt.perPartner ? rekapTransaksi.value : dt.dataTrx
      let a = [...new Set(data.map(d => d.kategoriCust))]
      return a
    })
    const totalHarga = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.jmlHarga])
      }, 0)
    })
    const totalAll = computed(() => {
      let x = {}
      x.tdpp = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.dpp]), 0)
      x.tppn = dt.detTrx.reduce((a, b) => root.$dwn.jumlah([a, b.ppn]), 0)
      x.tharga = root.$dwn.jumlah([x.tdpp, x.tppn])
      return x
    })
    const totalQty = computed(() => {
      return dt.detTrx.reduce((a, b) => {
        return root.$dwn.jumlah([a, b.qty])
      }, 0)
    })
    const jenis = computed(() => {
      let x = {}
      x.judul = props.jnsTrx === 'J' ? 'Penjualan' : 'Pembelian'
      x.partner = props.jnsTrx === 'J' ? 'CUSTOMER' : 'SUPPLIER'
      return x
    })
    const jdl = computed(() => {
      let x = [
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorBukti', label: 'Nomor Transaksi', field: row => row.nomorBukti, align: 'left', sortable: true },
        { name: 'tglKirim', label: 'Tanggal', field: row => row.tglKirim, align: 'left', sortable: true },
        { name: 'namaPartner', label: 'Pelanggan', field: row => row.namaPartner, align: 'left', sortable: true },
        { name: 'kategoriCust', label: 'Kategori', field: row => row.kategoriCust, align: 'left', sortable: true },
        { name: 'totalHarga', label: 'Total Harga', field: row => row.totalHarga, jml: 'Y', align: 'right', sortable: true },
        { name: 'totalAkhir', label: 'Total Akhir', field: row => row.totalAkhir, jml: 'Y', align: 'right', sortable: true },
        { name: 'totalPoint', label: 'Total Point', field: row => row.totalPoint, jml: 'Y', align: 'right', sortable: true },
        { name: 'ct', label: 'Cara Bayar', field: row => row.ct, align: 'left' }
      ]
      if (props.jnsTrx === 'B') {
        x[3].label = 'Vendor'
        x.push(
          { name: 'nomorPR', label: 'nomorPR', field: row => row.nomorPR, align: 'left', width: '500px' },
          { name: 'ketPR', label: 'PR info', field: row => row.ketPR, align: 'left' },
          { name: 'status', label: 'Status', field: row => row.status, align: 'left', sortable: true }
        )
      } else {
        x.push(
          { name: 'namaSales', label: 'Nama Sales', field: row => row.namaSales, sortable: true },
          { name: 'judulTransaksi', label: 'Keterangan', field: row => row.judulTransaksi, align: 'left', style: 'white-space: normal !important', headerStyle: 'width: 400px !important' },
          { name: 'status', label: 'Status', field: row => row.status, align: 'left' }
        )
      }
      let b = [
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'namaPartner', label: 'Partner', field: row => row.namaPartner, align: 'left', sortable: true },
        { name: 'kategoriCust', label: 'Kategori Partner', field: row => row.kategoriCust, align: 'left', sortable: true },
        { name: 'totalHarga', label: 'Total Harga', field: row => row.totalHarga, jml: 'Y', align: 'right', sortable: true },
        { name: 'totalPoint', label: 'Total Point', field: row => row.totalPoint, jml: 'Y', align: 'right', sortable: true }
      ]
      /* if (this.filt.ac === 'Y') {
        x[3].field = row => row.cabLain
      } */
      return dt.perPartner ? b : x
    })
    const cabAsi = computed(() => {
      return dt.cabAll.filter(a => a.compCode === 'ASI')
    })
    onMounted(() => {
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
          getTrx()
        })
      carikar()
        .then(({ data }) => {
          dt.dtSales = data
        })
    })
    const getTrx = () => {
      dt.dataTrx = []
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      dt.filt.jnsTrx = props.jnsTrx
      if (dt.perPartner) {
        rkpTransaksiS(dt.filt)
          .then(({ data }) => {
            dt.rkpTrx = data
          })
      } else {
        dtTrx(dt.filt)
          .then(({ data }) => {
            dt.dataTrx = data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    const getdetTrx = (x, y) => {
      if (!y) {
        dt.pr = x
        console.log(x)
        dt.pot.diskon = x.diskon
        dt.pot.akunDiskon = x.akunDiskon || '510100005'
        dt.exp.partnerID = x.partnerID
        dt.exp.namaExpedisi = x.namaExpedisi
        dt.exp.biaya = x.ongkir === 'Y' ? x.biaya : 0
        dt.detTrx.forEach((a, b, c) => {
          if (a.nomorBukti === x.nomorBukti) {
            c.splice(b)
          }
        })
        detTrx(x)
          .then(res => {
            dt.detTrx.push(...res.data)
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }
    }
    const getJur = (x) => {
      getJurtrans(x)
        .then(({ data }) => {
          dt.detJur = data
          dt.jh = data[0]
          dt.jh.tglJurnal = dt.jh.tgl || ''
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const onReset = () => {
      dt.pr = { tglRequest: '' }
      dt.detTrx = []
    }
    const onpil = (x) => {
      if (x.kodeProduk) {
        x.qty = 0
        dt.detTrx.push(x)
      }
    }
    const ubahTgl = (x) => {
      dt.ubahT = { ...x }
      dt.ubT = true
    }
    const ubahTrx = (x, y) => {
      x.jnsEdit = y
      editTglTrx(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          getTrx()
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, type: 'warning' })
        })
    }
    const ubahSales = (x) => {
      root.$q.dialog({
        title: `Ubah Sales : ${x.nomorBukti}`,
        message: `Sales awal ${x.namaSales} menjadi ${x.gantiSales.namaKaryawan} ?`,
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Ya', value: 'Y', color: 'secondary' },
            { label: 'Tidak', value: 'B', color: 'red' }
          ],
          isValid: val => ['Y', 'B'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        let z = { nomorBukti: x.nomorBukti, namaSales: x.namaSales, salesBaru: x.gantiSales.salesID, namaSalesBaru: x.gantiSales.namaKaryawan }
        if (data === 'Y') {
          gantiSales(z)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              getTrx()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: `${err.response.data.st}`, color: 'orange' })
            })
        }
      })
    }
    const buka = (x) => {
      const st = (x.ancab === 'Y' && x.status === 'T') ? 'D' : 'W'
      const z = { ...x }
      root.$q.dialog({
        title: `Buka transaksi nomor : ${x.nomorBukti}`,
        message: '',
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Ya', value: 'Y', color: 'secondary' },
            { label: 'Tidak', value: 'B', color: 'red' }
          ],
          isValid: val => ['Y', 'B'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        z.status = st
        if (data === 'Y') {
          perbaiki(z)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              getTrx()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: `${err.response.data.st}`, color: 'orange' })
            })
        }
      })
    }
    const tompo = (x) => {
      if ((x.ancab === 'Y' && x.asal === root.$store.state.auth.user.kodeCab && x.status === 'D') || (x.ancab === 'Y' && x.tujuan === root.$store.state.auth.user.kodeCab && x.status === 'W')) {
        root.$q.notify({ message: 'Yang berhak menerima cabang pembeli...', color: 'warning' })
      } else if ((x.ancab === 'Y' && ((x.tujuan === root.$store.state.auth.user.kodeCab && x.status === 'D') || x.status === 'W')) || (x.status === 'W')) {
        root.$q.dialog({
          title: `Konfirmasi Nomor Bukti : ${x.nomorBukti} <br><span class="text-accent text-italic"> Telp PIC: ${x.telpPIC || x.tlp}</span>`,
          message: '',
          options: {
            type: 'radio',
            model: 'konfr',
            // inline: true
            items: [
              { label: 'Terima', value: 'T', color: 'secondary' },
              { label: 'Batal', value: 'B', color: 'red' }
            ],
            isValid: val => ['T', 'B'].some(a => a === val)
          },
          ok: {
            push: true
          },
          html: true,
          persistent: false
        }).onOk((data) => {
          if (x.status === 'D' && data === 'B') {
            root.$q.notify({ message: 'Abaikan bila tidak menerima barang...', color: 'teal' })
          } else {
            x.status = x.ancab === 'Y' && x.asal === root.$store.state.auth.user.kodeCab && data === 'T' ? 'D' : data
            konfirm(x)
              .then(res => {
                root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                getTrx()
              })
              .catch(err => {
                console.log(err)
              })
          }
        }).onCancel(() => {
        }).onDismiss(() => {
        })
      }
    }
    const updPoint = async (x) => {
      // let det = dt.detTrx.filter(a => a.nomorBukti === x.nomorBukti)
      const { data } = await detTrx(x)
      const det = data.map(a => {
        a.jmlPoint = (x.point === 'Y' && x.ac === 'N' && x.cabID !== 'AM01' && x.ancab !== 'Y') ? (a.pointMember * (a.qty * a.hargaSat)) / 100 : 0
        return a
      })
      const totalPoint = det.reduce((a, b) => a + b.jmlPoint, 0)
      root.$q.dialog({
        title: `Update point membership : ${x.nomorBukti} <br><span class="text-accent text-italic"> Total Point Awal: ${x.totalPoint.toLocaleString()}</span>
        <br><span class="text-accent text-italic"> Total Point Update: ${totalPoint.toLocaleString()}</span>`,
        message: '',
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Terima', value: 'T', color: 'secondary' },
            { label: 'Batal', value: 'B', color: 'red' }
          ],
          isValid: val => ['T', 'B'].some(a => a === val)
        },
        ok: {
          push: true
        },
        html: true,
        persistent: false
      }).onOk((data) => {
        if (data === 'T') {
          repairPoint({ hd: x, det: det })
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              getTrx()
            })
            .catch(err => {
              console.log(err)
              root.$q.notify({ message: `${err.response.data.st}`, color: 'warning' })
            })
        }
      })
    }
    return { ...toRefs(dt), updPoint, ubahSales, buka, tompo, ubahTrx, ubahTgl, cabAsi, jdl, jenis, totalQty, totalAll, opac, totalHarga, getTrx, getdetTrx, getJur, onReset, onpil, rekapTransaksi, transaksi, jenisCust }
  },
  methods: {
    cariSales (x) {
      carikar(x.kodeCab)
        .then(({ data }) => {
          this.dtSales = data
        })
    },
    filterFns (val, update) {
      if (val === '') {
        update(() => {
          this.pilihSales = this.dtSales

          // with Quasar v1.7.4+
          // here you have access to "ref" which
          // is the Vue reference of the QSelect
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.pilihSales = this.dtSales.filter(v => (v.namaKaryawan.toLowerCase().indexOf(needle) > -1) || (v.namaCabang.toLowerCase().indexOf(needle) > -1))
      })
    },
    ondel (item) {
      const index = this.detTrx.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      console.log(index, cf)
      if (cf) {
        this.detTrx.splice(index, 1)
        /* if (item.iddetTrx) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    },
    prnt () {
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.setDefaults({ monochrome: true })
        cordova.plugins.printer.print()
      } else {
        window.print()
      }
    },
    terima (x) {
      if (this.pr.ac === 'Y' && this.pr.asal === this.$store.state.auth.user.kodeCab && x === 'T') {
        this.$q.notify({ message: 'Yang berhak menerima cabang pembeli...', color: 'warning' })
      } else {
        if (this.pr.status === 'W') {
          this.$q.dialog({
            title: `Konfirmasi ${x === 'T' ? 'Penerimaan' : 'Batal'}`,
            message: `${x === 'T' ? 'Terima' : 'Batal'} ?`,
            /* cancel: {
              label: 'Batal',
              color: 'negative'
            }, */
            ok: {
              push: true
            },
            persistent: false
          }).onOk(() => {
            this.pr.status = x
            konfirm(this.pr)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
              })
              .catch(err => {
                console.log(err)
              })
          }).onCancel(() => {
            /* console.log('cancel')
            this.pr.status = 'B'
            konfirm(this.pr)
              .then(res => {
                this.$q.notify({ message: `${res.data.st}`, color: 'teal' })
                  .catch(err => {
                    console.log(err)
                  })
              }) */
          }).onDismiss(() => {
            // console.log('I am triggered on both OK and Cancel')
          })
        }
      }
    },
    toDown () {
      const jd = [ ...this.jdl, { name: 'akunBayar', label: 'Akun Bayar' } ]
      let x = {
        judul: `Data transaksi ${this.jenis.judul} `,
        dt: this.transaksi,
        hdr: jd,
        naFile: `transaksi${this.jenis.judul}`
      }
      this.$dwn.toExcel(x)
    },
    returBarang (x) {
      this.selected = x
      this.reT = true
      detTrxR(x)
        .then(res => {
          let a = res.data
          for (let i in a) {
            a[i].hargaSat = a[i].jmlHarga / a[i].qty
            a[i].stok = a[i].qty - a[i].jmlRetur
            a[i].tppn = a[i].ppn > 0 ? a[i].ppn / a[i].stok : 0
            a[i].tdpp = a[i].dpp / a[i].stok
            a[i].thpp = a[i].hpp / a[i].stok
            a[i].qty = 0
          }
          this.detRet = a
        })
        .catch((err) => {
          console.log(err)
          this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    },
    editJubel (x) {
      if (x.ac === 'Y' && this.jnsTrx === 'B' && !['MAN', 'purchase', 'acc'].some(a => a === this.$store.state.auth.user.userType)) {
        this.$q.notify({ message: 'Yang berhak edit cabang penjual...', color: 'warning' })
      } else {
        this.exp.partnerID = x.partnerID
        this.exp.biaya = x.biaya
        this.pot.diskon = x.diskon
        this.pot.akunDiskon = x.akunDiskon || '510100005'
        detTrx(x)
          .then(({ data }) => {
            this.detTrx = data
            this.jh = x
            x.cabLain = x.jnsTrx === 'J' ? x.tujuan : x.asal
            x.tgl = x.tglKirim
            this.plgn = { namaPartner: x.namaPartner, alamat: x.alamat }
            this.edjb = true
          })
          .catch((err) => {
            console.log(err)
            this.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }
    },
    cetak (x) {
      this.ctk = x
      this.confirm = true
    },
    async printA4 (x) {
      // let bankCabang = ''
      let { data } = await getBankCab(x.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let cabA = this.jnsTrx === 'J' && x.asal === x.cabID ? this.cabAll.find(a => a.kodeCab === x.cabID) : this.cabAll.find(a => a.kodeCab === x.tujuan)
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      /* console.log(data)
      getBankCab(x.cabID)
        .then(res => {
          res.data.forEach(a => {
            // bankCabang
            console.log(bankCabang)
          })
        }) */
      let detail = await detTrx(x)
      let tdpp = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.dpp, -b.hrgRetur]), 0)
      let tppn = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0)
      let wd = window.open('', 'InvoiceA4', 'resize = 1')
      let html = `<html>
        <title>Cetak Nota ${this.jenis.judul}</title>
        <style>
        #tss{
          font-size: 12px;

        }
        #tss tr td{
          font-size: 12px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 12px;
        }
        .text-right{
          text-align: right
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 12px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          table.report.container {
            page-break-after: always;
          }
        }
        </style>
        <body style="font-size: 11px">

          <table width='100%' id="tss" class="report-container" >
            <thead class="report-header">
            <tr>
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/app-logo.jpeg" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
                      <b>${cabA.alamatCabang}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.telp}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>${this.jenis.partner}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${x.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${x.alamat || ''}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${x.tlp || ''}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td colspan="3">
                      <h1>
                        <b>Order #${x.nomorBukti}</b>
                      </h1>
                    </td>
                    <td align="right">
                      <b>Date Ordered:</b><br/>${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}
                    </td>
                  </tr>
                  <tr>
                    ${this.jnsTrx === 'J' ? '<td width="15%"><b>Salesperson:</b><br/>' + x.namaSales + '</td><td><b>Payment:</b><br/>14 Hari</td> ' : ''}
                  </tr>
                </table>
              </td>
            </tr>
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/><br/>
                <table width='100%' id="table_product">
                <thead class="report-header">
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%' style='text-align: right'>QTY</th>
                    <th width='10%' align='right' style='text-align: right'>Harga</th>
                    <th width='10%' align='right' style='text-align: right'>Jumlah</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.qty - det.jmlRetur).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.dpp / det.qty).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.dpp - det.hrgRetur).toFixed(2))}</td>
        </tr>`
      })
      let ttpj = `<table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                      <b>
                        <i>
                          Terbilang : ${this.$dwn.bilang(Number(x.totalAkhir).toFixed(2))}
                        </i>
                      </b>`
      let note = x.jnsTrx === 'J' && x.ancab !== 'Y' ? `
                      <div style='border : 1px dotted #000000; padding:10px' width='60%'>
                        Note : Pembayaran dapat dilakukan melalui:
                        <ul>
                          ${bankCabang}
                        </ul>
                        ${x.ct === 'tempo' && x.jnsTrx === 'J' ? 'Bukti pembayaran mohon diemail ke finance@astonsistem.com' : ''}
                        <br/>Catatan tambahan : ${x.note || ''}
                      </div>` : ''
      let ttpNote = `
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='50%' align='right'><b>Total</b></td>
                        <td width='50%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tdpp).toFixed(2))}</b></td>`
      let ttpPpn = Number(tppn) > 0 && `<tr>
                            <td align='right'><b>Total PPN</b></td>
                            <td align='right'><b>${new Intl.NumberFormat('en').format(Number(Number(tppn).toFixed(2)))}</b></td>
                          </tr>`
      let ttpUM = x.uangMuka && `<tr>
                            <td align='right'><b>Uang Muka</b></td>
                            <td align='right'><b></b></td>
                          </tr>`
      let ttpDiskon = x.diskon && `<tr>
                            <td align='right'><b>Diskon</b></td>
                            <td align='right'><b><span contenteditable="">- ${new Intl.NumberFormat('en').format(Number(x.diskon || 0).toFixed(2))}</span></b></td>
                          </tr>`
      let ttpxBiaya = x.biaya && `<tr>
                            <td align='right'><b>Ongkos Kirim</b></td>
                            <td align='right'><b><span style="text-decoration: ${x.ongkir === 'N' ? 'line-through' : ''}">${new Intl.NumberFormat('en').format(Number(x.biaya || 0).toFixed(2))}</span></b></td>
                          </tr>`
      let ttpTotal = x.totalAkhir !== tdpp && `<tr>
                            <td align='right'><b>Jumlah Pembayaran</b></td>
                            <td align='right' style="border-top: double black;"><b>${new Intl.NumberFormat('en').format(Number(Number(x.totalAkhir).toFixed(2)))}</b></td>
                          </tr>`
      let ttpJ = this.jnsTrx === 'J' && `</table>
                    </td>
                  </tr>
                </table>`
      let ttp = `</table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
              ${ttpj} ${note} ${ttpNote} ${(ttpPpn || '') + (ttpUM || '') + (ttpDiskon || '') + (ttpxBiaya || '') + (ttpTotal || '') + (ttpJ || '')}
              </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td >

                  </td>
                  <td width='33.3%' align='center'>
                  </td>
                  <td width='33.3%' align='center'>
                    Di Buat Oleh<br/>
                    <br/><br/><br/><br/>
                    ${x.namaSales}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
          Pengaturan Printer Epson LX 310: <hr>
          <ul>
            <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
            <li>DPI 120 * 144</li>
            <li>Cetak menggunakan browser Mozilla</li>
          </ul>
          <hr>
          <button type=button onclick='window.print();'>Cetak Nota ${this.jenis.judul}</button>
        </div>

        </body>
        </html>`
      html += dtDet + ttp
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    },
    async printSjln (x) {
      /* let { data } = await getBankCab(x.cabID)
      let bankCabang = await data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      }) */
      let detail = await detTrx(x)
      let tqty = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.qty, -b.jmlRetur]), 0)
      let cabA = this.jnsTrx === 'J' && x.asal === x.cabID ? this.cabAll.find(a => a.kodeCab === x.cabID) : this.cabAll.find(a => a.kodeCab === x.tujuan)
      let wd = window.open('', 'SuratJalan', 'resize = 1')
      let html = `<html>
        <title>Cetak Nota ${this.jenis.judul} ${x.nomorBukti}</title>
        <style>
        #tss{
          font-size: 12px;

        }
        #tss tr td{
          font-size: 12px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 12px;
        }

        .bdr_top{
          border-top: 1px solid #000;
          font-size: 12px;
        }
        #table_product th {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #000;
        }
        #table_product td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          table.report.container {
            page-break-after: always;
          }
        }
        </style>
        <body style="font-size: 11px">

          <table width='100%' id="tss" class="report-container">
            <thead class="report-header">
            <tr>
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/app-logo.jpeg" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
                      <b>${cabA.alamatCabang}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cabA.telp}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>${this.jenis.partner}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${x.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${x.alamat || ''}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${x.tlp || ''}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td width="50%">
                      <h1>
                        <b>Dokumen Pengiriman <br/> #${x.nomorBukti}</b>
                      </h1>
                    </td>
                    <td width="20%"><b>Date Ordered:</b><br/>${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}</td>
                    <td width="50%"><b>Delivery Date:</b><br/>${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/>
                <table width='100%' id="table_product">
                  <thead class="report-header">
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%' style="text-align: right">Quatity</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td style="text-align: right">${new Intl.NumberFormat('en').format(Number(det.qty - det.jmlRetur).toFixed(2))} ${det.satuan}</td>
        </tr>`
      })
      let ttp = `</table>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='60%' align='right' colSpan="2"><b>Jumlah Produk</b></td>
                        <td width='50%' align='center'><b>${new Intl.NumberFormat('en').format(Number(tqty).toFixed(2))}</b></td>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" align='center'>
                <table width='90%' align='center'>
                  <tr>
                    <td align='center'>
                      Disiapkan<br/>
                      <br/><br/><br/><br/>
                      (${this.$store.state.auth.user.nama})
                  </td>
                  <td width='33.3%' align='center'>
                    Dikirim Oleh<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                  <td width='33.3%' align='center'>
                    Diterima<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>Catatan : ${x.note || ''}</td>
          </tr>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
          Pengaturan Printer Epson LX 310: <hr>
          <ul>
            <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
            <li>DPI 120 * 144</li>
            <li>Cetak menggunakan browser Mozilla</li>
          </ul>
          <hr>
          <button type=button onclick='window.print();'>Cetak Nota ${this.jenis.judul}</button>
        </div>

        </body>
        </html>`
      html += dtDet + ttp
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    },
    async printW (x) {
      let { data } = await getBankCab(x.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let cabA = this.jnsTrx === 'J' && x.asal === x.cabID ? this.cabAll.find(a => a.kodeCab === x.cabID) : this.cabAll.find(a => a.kodeCab === x.tujuan)
      let detail = await detTrx(x)
      let tdpp = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.dpp, -b.hrgRetur]), 0)
      let tppn = detail.data.reduce((a, b) => this.$dwn.jumlah([a, b.ppn]), 0)
      let wd = window.open('', 'transPrint', 'resize = 1')
      let html = `<html><head>`
      let dtPrint = `
        <title>Transaksi ${this.jenis.judul} ${x.nomorBukti}</title>
          <style>
              #tss{
                  font-size: 12px;
                  font-family:Courier New;
              }
              #tss tr td{
                  font-size: 12px;
                  font-family:Courier New;
              }
              .bdr_btm{
                  border-bottom: 1px dashed #000;
                  font-size: 12px;
                  font-family:Courier New;
              }
              @media print{
                  #man {
                      visibility:hidden;
                  }
                  thead.report-header {
                    display: table-header-group;
                  }
                  table.report.container {
                    page-break-after: always;
                  }
              }
          </style>
          <body style="font-size: 11px">
          <table width='100%' id="tss" class="report-container">
            <thead class="report-header">
              <tr>
                <td colspan="3" width='60%' class="bdr_btm" valign="top">
                    <table width="100%">
                        <tr>
                            <td>
                                <b>${cabA.namaCabang.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cabA.alamatCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cabA.telp}</b>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="bdr_btm" align='right'>
                    <table width="100%" >
                        <tr>
                            <td colspan="4">
                                <b>NOTA ${this.jenis.judul.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID ${this.jenis.judul}</td>
                            <td>: ${x.nomorBukti}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${new Date(x.tglKirim).toLocaleString('en-GB').slice(0, 10)}</td>
                        </tr>
                        <tr>
                            <td>Pembayaran </td>
                            <td>: ${x.namaAkunBayar || ''}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='15%'>Nama ${this.jenis.partner}</td>
                            <td width='35%'>: ${x.namaPartner}</td>
                            <td width='15%'></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Alamat</td>
                            <td rowspan="2" valign="top">: ${x.alamat || ''}</td>
                            <td valign="top"></td>
                            <td rowspan="2" valign="top"></td>
                        </tr>
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>No Telp</td>
                            <td>: ${x.tlp || ''}</td>
                            <td valign="top"></td>
                            <td></td>
                        </tr>
                    </table>
                </td>
              </tr>
            </thead/>
            <tbody class="report-content">
              <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                      <thead class="report-header">
                        <tr>
                            <td width='3%' class="bdr_btm">No</td>
                            <td class="bdr_btm">Deskripsi Barang</td>
                            <td width='10%' class="bdr_btm">Serial Number</td>
                            <td width='10%' class="bdr_btm" align='right'>QTY</td>
                            <td width='10%' class="bdr_btm" align='right'>Harga</td>
                            <td width='10%' class="bdr_btm" align='right'>Jumlah</td>
                        </tr>
                      </thead>
                      <tbody>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td>${det.keterangan}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty - det.jmlRetur).toFixed(2))}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.dpp / det.qty).toFixed(2))}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.dpp - det.hrgRetur).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</tbody>
          </table>
                </td>
            </tr>
            <tr>
                <td colspan="4">
                    <table width='100%' >
                        <tr>`
      let note = x.jnsTrx === 'J' && x.ancab !== 'Y' ? `
                            <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                              Pembayaran dapat dilakukan melalui:
                              <ul>
                                ${bankCabang}
                              </ul>
                              Catatan tambahan : ${x.note || ''}
                            </td>` : `<td></td>`
      let ttpNote = `<td align="right" valign="top">
                                <table width="100%" >` +
                                (this.$dwn.jumlah([x.totalAkhir, this.exp.biaya]) !== tdpp ? `<td width='40%' align='right'><b>Total</b></td>
                                    <td width='60%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tdpp).toFixed(2))}</b></td>` : '') +
                                        (tppn > 0 ? `<tr>
                                            <td align='right'><b>Total PPN</b></td>
                                            <td align='right' style="text-decoration : underline; text-decoration-style: double;"><b>${new Intl.NumberFormat('en').format(Number(tppn).toFixed(2))}</b></td>
                                        </tr>` : '') +
                                        (x.uangMuka > 0 ? `<tr>
                                            <td align='right'><b>Uang Muka</b></td>
                                            <td align='right'><b>0</b></td>
                                        </tr>` : '') +
                                        (x.diskon > 0 ? `<tr>
                                            <td align='right'><b>Diskon</b></td>
                                            <td align='right'><b>- ${new Intl.NumberFormat('en').format(Number(x.diskon || 0).toFixed(2))}</b></td>
                                        </tr>` : '') +
                                        (this.pr.biaya > 0 ? `<tr>
                                            <td align='right' style="${this.pr.ongkir === 'N' && 'text-decoration : line-through; text-decoration-style: double;'}"><b>Biaya Kirim</b></td>
                                            <td align='right' style="${this.pr.ongkir === 'N' && 'text-decoration : line-through; text-decoration-style: double;'}"><b>${new Intl.NumberFormat('en').format(Number(this.pr.biaya).toFixed(2))}</b></td>
                                        </tr>` : '') +
                                        `<tr>
                                            <td align='right'><b>Jumlah Harus Dibayar</b></td>
                                            <td align='right' style="text-decoration : underline; text-decoration-style: double; ` + (this.$dwn.jumlah([x.totalAkhir, this.exp.biaya]) !== tdpp ? 'border-top: double black;' : '') + `"><b>${new Intl.NumberFormat('en').format(Number(this.$dwn.jumlah([x.totalAkhir])).toFixed(2))}</b></td>
                                        </tr>` +
                                        (this.pr.namaExpedisi ? `<tr>
                                            <td align='right'><b>Jasa Ekspedisi</b></td>
                                            <td align='right'><b><i>${this.pr.namaExpedisi || ''}</i></b></td>
                                        </tr>` : '') +
                                `</table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" align='center'>
                    <table width='90%' align='center'>
                        <tr>
                            <td width='33.3%' align='center'>
                                Diterima Oleh<br/>
                                <br/><br/><br/><br/>
                                ${this.jnsTrx === 'J' ? x.namaPartner : this.$store.state.auth.user.nama}
                            </td>
                            <td width='33.3%' align='center'>
                            </td>
                            <td width='33.3%' align='center'>
                                Di Buat Oleh<br/>
                                <br/><br/><br/><br/>
                                ${x.namaSales}
                            </td>
                        </tr>                        
                    </table>
                </td>
            </tr>
          </tbody>
        </table>
        <div id=man style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
            Pengaturan Printer Epson LX 310: <hr>
            <ul>
                <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
                <li>DPI 120 * 144</li>
                <li>Cetak menggunakan browser Mozilla</li>
            </ul>
            <hr>
            <button type=button onclick='window.print();'>Cetak Nota ${this.jenis.judul}</button>
        </div>`
      html += dtPrint + dtDet + ttp + note + ttpNote + '</body></html>'
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
  }
}
</script>
