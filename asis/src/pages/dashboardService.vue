<template>
  <q-page padding>
    <div class="row q-col-gutter-sm q-py-sm">
          <q-chip color="blue-6" class="text-white text-bold shadow-3" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
          <q-select
            class="q-ml-sm"
            v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
            v-model="divisi"
            :options="divCab"
            :option-label="(item) => item && item.compCode + ' ' + item.compName"
            option-value="compCode"
            emit-value
            map-options
            style="min-width: 250px; max-width: 250px"
            label="Divisi... "
            @input="gantiCab"
            dense
            lazy-rules/>
          <q-select
            class="q-ml-sm"
            v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
            v-model="filt.kodeCab"
            :options="cabAll.filter(a => divisi === a.compCode)"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            option-dense
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 550px"
            label="Pilih cabang... "
            dense
            lazy-rules>
            <template v-slot:option="scope">
              <q-item
                dense
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label>
                  {{ scope.opt.kodeCab }} {{ scope.opt.namaCabang }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab"/>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:selected>
              {{ filt.kodeCab.length }} cabang
            </template>
          </q-select>
          <q-toggle v-model="filt.allCab" label="Pilih semua..." @input="gantiCab(filt.allCab)"/>
    </div>

    <div class="row q-col-gutter-sm q-py-sm">
        <div class="col-xs-12 col-md-3 col-sm-12 q-gutter-xs ">
            <q-card class="shadow-2" style="border-left: 5px solid #03A9F4" @click="tableShow('dataMasuk')">
                <div class="text-subtitle q-px-md q-pt-sm text-light-blue">
                Printer Masuk
                <q-btn
                    disable
                    round
                    color="white"
                    class="float-right"
                    text-color="light-blue"
                    icon="arrow_downward"
                />
                </div>
                <q-card-section
                class="q-px-md q-py-sm row q-gutter-xs justify-between"
                >
                <div class="col-md-5 items-start">
                    <div class="text-h5" style="color:#474747">
                    {{ dataMasuk.length }}
                    </div>
                    <p class="text-light-blue">Unit</p>
                </div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-xs-12 col-md-3 col-sm-12 q-gutter-xs ">
            <q-card class="shadow-2" style="border-left: 5px solid #F4511E" @click="tableShow('dataPart')">
                <div class="text-subtitle q-px-md q-pt-sm text-deep-orange-7">
                Printer Pending Part
                <q-btn
                    disable
                    round
                    color="white"
                    class="float-right"
                    text-color="deep-orange-7"
                    icon="pending_actions"
                />
                </div>
                <q-card-section
                class="q-px-md q-py-sm row q-gutter-xs justify-between"
                >
                <div class="col-md-5 items-start">
                    <div class="text-h5" style="color:#474747">
                    {{ dataPart.length }}
                    </div>
                    <p class="text-deep-orange-7">Unit</p>
                </div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-xs-12 col-md-3 col-sm-12 q-gutter-xs ">
            <q-card class="shadow-2" style="border-left: 5px solid #00838F" @click="tableShow('dataSelesai')">
                <div class="text-subtitle q-px-md q-pt-sm text-cyan-9">
                Printer Selesai
                <q-btn
                    disable
                    round
                    color="white"
                    class="float-right"
                    text-color="cyan-9"
                    icon="done"
                />
                </div>
                <q-card-section
                class="q-px-md q-py-sm row q-gutter-xs justify-between"
                >
                <div class="col-md-5 items-start">
                    <div class="text-h5" style="color:#474747">
                    {{ dataSelesai.length }}
                    </div>
                    <p style="color:#1F929C">Unit</p>
                </div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-xs-12 col-md-3 col-sm-12 q-gutter-xs ">
            <q-card class="shadow-2" style="border-left: 5px solid #1565C0" @click="tableShow('dataProses')">
                <div class="text-subtitle q-px-md q-pt-sm text-blue-7">
                Printer Proses
                <q-btn
                    disable
                    round
                    color="white"
                    class="float-right"
                    text-color="blue-7"
                    icon="timer"
                />
                </div>
                <q-card-section
                class="q-px-md q-py-sm row q-gutter-xs justify-between"
                >
                <div class="col-md-5 items-start">
                    <div class="text-h5" style="color:#474747">
                    {{ dataProses.length }}
                    </div>
                    <p class="text-blue-7">Unit</p>
                </div>
                </q-card-section>
            </q-card>
        </div>

           <div class="col-xs-12 col-md-4 col-xl-4">
                <q-markup-table wrap-cells>
                    <thead >
                        <tr class="bg-indigo-10">
                        <th colspan="7">
                            <div class="row no-wrap items-center">
                            <span class="text-h6 q-ml-md text-white">Top 10 Teknisi</span>
                            </div>
                        </th>
                        </tr>
                        <q-tr>
                        <q-th align="left">No.</q-th>
                        <q-th align="left">Nama Teknisi</q-th>
                        <q-th align="left">Point Teknisi</q-th>

                        </q-tr>
                    </thead>
                    <tbody>
                      <q-tr v-for="(a, i) in topTeknisi.sort((s, t) => t.jml - s.jml).slice(0, 10)" :key="i">
                        <q-td auto-width>{{ i + 1 }}</q-td>
                        <q-td align="left">{{ a.namaTeknisi }}</q-td>
                        <q-td align="right">{{ a.pointTeknisi }}</q-td>
                      </q-tr>
                    </tbody>
                </q-markup-table>

             </div>

       <div class="col-xs-12 col-md-4 col-xl-4">
        <q-markup-table wrap-cells>
          <thead>
            <tr class="bg-indigo-10">
              <th colspan="5">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md text-white">Top 10 Analisa Kerusakan</span>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="center">No.</q-th>
              <q-th align="left">Analisa</q-th>
              <q-th align="right">Jumlah</q-th>
            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in topAnalisa.slice(0, 10)" :key="i">
              <q-td auto-width>{{ i + 1 }}</q-td>
              <q-td align="left">{{ a.analisa }}</q-td>
              <q-td align="right">{{ a.jml }}</q-td>
            </q-tr>
          </tbody>
        </q-markup-table>
     </div>

<div class="col-xs-12 col-md-4">
        <q-markup-table wrap-cells>
          <thead>
            <tr>
              <th colspan="6">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md text-indigo-10 ">Top 5 brand</span>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="center">No.</q-th>
              <q-th align="center">Brand</q-th>

            </q-tr>
          </thead>
          <tbody>
            <q-tr v-for="(a, i) in topBrand.sort((s, t) => t.jml - s.jml).slice(0, 5)" :key="i">
              <q-td auto-width>{{ i + 1 }}</q-td>
              <q-td align="left">{{ a.brand }}</q-td>
            </q-tr>
          </tbody>
        </q-markup-table>
        </div>
        <div class="col-xs-12 col-md-4 q-mt-md">
             <q-markup-table wrap-cells>
          <thead>
            <tr>
              <th colspan="6">
                <div class="row no-wrap items-center">
                  <span class="text-h6 q-ml-md text-indigo-10">Top 5 aktivitas</span>
                </div>
              </th>
            </tr>
            <q-tr>
              <q-th align="center">No.</q-th>
              <q-th align="center">Aktivitas</q-th>

            </q-tr>
          </thead>
          <tbody>
            <q-tr>
            </q-tr>
          </tbody>
        </q-markup-table>
</div>

      <div class="col-xs-12 col-md-5 col-xl-4">
        <!-- <radar :labels="labels" :datasets="datasets" type="line" :title="chart" class="bg-cyan-13"></radar> -->

      </div>
    </div>
    <q-dialog
      v-model="tabel"
      full-width
      >
      <q-table
        class="dataTrx"
        :data="dataTabel"
        :columns="jdlTabel"
        :filter="cariTabel"
        :title="`Data ${jnsData}`"
        dense>
        <template v-slot:top-right>
          <q-input dense debounce="300" v-model="cariTabel" placeholder="Cari..." class="q-ml-md">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </q-dialog>
  </q-page>
</template>

<script>
import { computed, reactive, toRefs, watch } from '@vue/composition-api'
import { accRek, carikar, company, dtCab, dtUser, getJnsService, getMerk, pendingPart, produkService, serviceMsk, serviceProses, serviceSelesai } from '../services/apiList'
export default {
  setup (props, { root }) {
    const dt = reactive({
      expanded: [],
      cari: '',
      confirm: false,
      stk: false,
      repair: false,
      hal: { rowsPerPage: 10 },
      adS: false,
      filt: {
        kodeCab: [root.$store.state.auth.user.kodeCab],
        tgla: '',
        tglb: '',
        status: ['Baru', 'Konfirm', 'Proses', 'Part', 'Selesai']
      },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      dataServis: [],
      cabAll: [],
      merk: [],
      inRul: [ v => !!v || 'Isi data' ],
      detTrx: [],
      adP: false,
      pg: { rowsPerPage: 0 },
      dtKar: [],
      akunCOA: [],
      rekap: false,
      jdl: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'nomorServis', label: 'Nomor Servis', field: row => row.nomorServis, align: 'left' },
        { name: 'tglMasuk', label: 'Tanggal Masuk', field: row => row.tglMasuk, sortable: true, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, sortable: true, align: 'left' },
        { name: 'telpPIC', label: 'Telp PIC', field: row => row.telpPIC, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, sortable: true, align: 'left' },
        { name: 'nomorSN', label: 'Nomor SN', field: row => row.nomorSN, align: 'left' },
        { name: 'keluhan', label: 'Keluhan', field: row => row.keluhan, align: 'left' },
        { name: 'konfirmasi', label: 'Konfirmasi', field: row => row.konfirmasi, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, sortable: true, align: 'left' },
        { name: 'biaya', label: 'Biaya', field: row => row.biaya, jml: 'Y', align: 'right' },
        { name: 'namaSales', label: 'Sales', field: row => row.namaSales, sortable: true, align: 'left' },
        { name: 'part', label: 'Nama Part', field: row => row.part, sortable: true, align: 'left', style: 'width: 300px' },
        { name: 'namaTeknisi', label: 'Teknisi', field: row => row.namaTeknisi, sortable: true, align: 'left' },
        { name: 'tglSelesai', label: 'Tanggal Selesai', field: row => row.tglSelesai, sortable: true, align: 'left' },
        { name: 'umur', label: 'Umur', field: row => row.umur, sortable: true, align: 'left' },
        { name: 'TAT', label: 'TAT', field: row => row.TAT, sortable: true, align: 'left' },
        { name: 'act', label: 'Act', align: 'left' }
      ],
      jdlr: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'telpPIC', label: 'Telp PIC', field: row => row.telpPIC, align: 'left' },
        { name: 'biaya', label: 'Biaya', field: row => row.biaya, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act', align: 'left' }
      ],
      options: [],
      statusService: [ 'Baru', 'Konfirm', 'Proses', 'Part', 'Selesai', 'Closed', 'Batal' ],
      dataMasuk: [],
      dataProses: [],
      dataSelesai: [],
      dataPart: [],
      dtSales: [],
      pilihSales: [],
      jnsService: [],
      divCab: [],
      divisi: '',
      dtComp: [],
      tabel: false,
      dataTabel: [],
      jdlTabel: [],
      jnsData: '',
      cariTabel: ''
    })
    company()
      .then(({ data }) => {
        dt.dtComp = data
      })
    getJnsService()
      .then(({ data }) => {
        dt.jnsService = data
      })
    accRek()
      .then(({ data }) => {
        dt.akunCOA = data.filter(a => a.JB === 'Y')
      })
    carikar(root.$store.state.auth.user.kodeCab)
      .then(({ data }) => {
        dt.dtSales = data
      })
      .catch(err => {
        console.log(err)
      })
    const filterKn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.pilihSales = dt.dtSales
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.pilihSales = dt.dtSales.filter(v => (v.namaKaryawan.toLowerCase().indexOf(needle) > -1))
      })
    }
    const getAll = (x) => {
      x.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      x.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (x.kodeCab.length) {
        serviceMsk(x)
          .then(({ data }) => {
            dt.dataMasuk = data
          })
        serviceProses(x)
          .then(({ data }) => {
            dt.dataProses = data
          })
        serviceSelesai(x)
          .then(({ data }) => {
            dt.dataSelesai = data
          })
        pendingPart(x)
          .then(({ data }) => {
            dt.dataPart = data
          })
      }
    }
    dtUser()
      .then(({ data }) => {
        dt.dtKar = data
      })
    dtCab()
      .then(({ data }) => {
        const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
        dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
        let st = new Set(dt.cabAll.map(a => a.compCode))
        dt.divisi = '' // [...st]
        dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
      })
    getMerk()
      .then(({ data }) => {
        dt.merk = data
      })
    produkService()
      .then(({ data }) => {
        dt.produk = data
      })
    const partner = (x) => {
      dt.cust = x
      dt.p.kodePartner = x.kodePartner
    }
    getAll(dt.filt)
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.produk
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.produk.filter(v => (v.namaBarang.toLowerCase().indexOf(needle) > -1))
      })
    }
    const toDown = (data, z) => {
      let cabang = dt.filt.kodeCab.map(a => dt.cabAll.find(s => s.kodeCab === a).namaCabang)
      let y = Array.from(data)
      y.map((a, i) => {
        let c = { ...a }
        c.nom = i + 1
        if (c.part) {
          c.part = c.part.replace(/,/gi, 'r\n')
        }
        return c
      })
      let x = {
        judul: `Data Service Cabang ${cabang} Periode ${dt.filt.tgla} s/d ${dt.filt.tglb} `,
        dt: y,
        hdr: z,
        naFile: `LapService`
      }
      root.$dwn.toExcel(x)
    }
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        getAll(dt.filt)
      } else {
        dt.filt.kodeCab = []
        dt.rkpTgl = []
        // dt.divisi = []
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.kodeCab = [val]
      dt.filt.allCab = false
      getAll(dt.filt)
    })
    watch(() => dt.filt, (val) => {
      // dt.filt.kodeCab = [val]
      // dt.filt.allCab = false
      getAll(dt.filt)
    }, { deep: true })
    watch(() => dt.tgl, (val) => {
      if (val) {
        dt.filt.tgla = val.tgl && val.tgl.from ? val.tgl.from : val.tgl || new Date()
      }
      // dt.filt.tglb = val.tgl && val.tgl.from ? val.tgl.to : val.tgl || new Date()
    })
    const topBrand = computed(() => {
      const brand = [...new Set(dt.dataSelesai.map(a => a.namaBarang))]
      return brand.map(a => {
        return {
          brand: a,
          jml: dt.dataSelesai.filter(s => s.namaBarang === a).length
        }
      })
    })
    const topTeknisi = computed(() => {
      const tek = [...new Set(dt.dataSelesai.map(a => a.namaTeknisi))]
      return tek.map(a => {
        return {
          namaTeknisi: a,
          jml: dt.dataSelesai.filter(s => s.namaTeknisi === a).length,
          pointTeknisi: dt.dataSelesai.filter(s => s.namaTeknisi === a).reduce((s, t) => root.$dwn.jumlah([s, t.pointTeknisi]), 0)
        }
      })
    })
    const topAnalisa = computed(() => {
      const ss =  [...new Set(dt.dataSelesai.flatMap(a => a.analisa))]
      let jml = []
      for (let s in ss) {
        jml.push({
          analisa: ss[s],
          jml: dt.dataSelesai.flatMap(a => a.analisa).filter(a => a === ss[s]).length
        })
      }
      return jml.sort((a, b) => {
        return b.jml - a.jml
      })
    })
    const tableShow = (x) => {
      dt.jnsData = x.replace('data', '')
      dt.dataTabel = dt[x]
      switch (x) {
        case 'dataPart':
          dt.jdlTabel = [
            { name: 'nomorServis', label: 'Nomor Servis', field: row => row.nomorServis, sortable: true },
            { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
            { name: 'qty', label: 'Qty', field: row => row.qty, sortable: true }
          ]
          break
        case 'dataMasuk':
          dt.jdlTabel = [
            { name: 'tglMasuk', label: 'Tanggal Masuk', field: row => row.tglMasuk, sortable: true, align: 'left' },
            { name: 'nomorServis', label: 'Nomor Servis', field: row => row.nomorServis, sortable: true },
            { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
            { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, sortable: true, align: 'left' },
            { name: 'status', label: 'Status', field: row => row.status, sortable: true, align: 'left' }
          ]
          break
        case 'dataSelesai':
          dt.jdlTabel = [
            { name: 'tglSelesai', label: 'Tanggal Selesai', field: row => row.tglSelesai, sortable: true, align: 'left' },
            { name: 'nomorServis', label: 'Nomor Servis', field: row => row.nomorServis, sortable: true },
            { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
            { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, sortable: true },
            { name: 'tlp', label: 'Tlp Partner', field: row => row.tlp, sortable: true },
            { name: 'namaTeknisi', label: 'Nama Teknisi', field: row => row.namaTeknisi, sortable: true, align: 'left' }
          ]
          break
        default:
          dt.jdlTabel = [
            { name: 'tglMasuk', label: 'Tanggal Masuk', field: row => row.tglMasuk, sortable: true, align: 'left' },
            { name: 'nomorServis', label: 'Nomor Servis', field: row => row.nomorServis, sortable: true },
            { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, sortable: true, align: 'left' },
            { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, sortable: true, align: 'left' },
            { name: 'tlp', label: 'Tlp Partner', field: row => row.tlp, sortable: true },
            { name: 'namaTeknisi', label: 'Nama Teknisi', field: row => row.namaTeknisi, sortable: true, align: 'left' },
            { name: 'status', label: 'Status', field: row => row.status, sortable: true, align: 'left' }
          ]
      }
      dt.tabel = true
    }
    return {
      toDown,
      ...toRefs(dt),
      filterFn,
      getAll,
      partner,
      filterKn,
      gantiCab,
      topBrand,
      topTeknisi,
      tableShow,
      topAnalisa
    }
  }
}
</script>
