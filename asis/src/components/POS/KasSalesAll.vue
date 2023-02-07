<template>
  <div class="column">
    <div class="q-pa-md">
      <q-table
        class="detTrx"
        title="Sales Report"
        :data="dtKas"
        :columns="jdl"
        row-key="eID"
        :filter="cari"
        :pagination.sync="halaman"
        grid
        hide-header
        hide-bottom
      >
        <template v-slot:top-right>
          <q-select
            v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType)"
            v-model="filt.kodeCab"
            :options="cabAll"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 300px"
            label="Pilih cabang... "
            dense
            @input="kasSalesAll"
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
                  <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="kasSalesAll"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input filled v-model="filt.bln" label="Bulan" dense lazy-rules readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="filt.bln" @input="() => {$refs.qDateProxy.hide(), kasSalesAll()}" mask="YYYY-MM" lazy-rules />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input borderless dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div
            class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
          >
            <q-card >
              <q-card-section
                :style="`background: linear-gradient(to right, transparent,rgba(${200 - props.row.nilai/total.nilai * 225},${props.row.nilai/total.nilai * 255},${props.row.nilai/total.nilai * 125 + 200},0.8))`">
                <q-item dense>
                  <q-item-section>
                    <q-checkbox dense v-model="props.selected" :label="props.row.namaKaryawan" />
                  </q-item-section>
                  <q-item-label>
                    <q-avatar rounded>
                      <img :src="`../statics/photo/${props.row.photo}`">
                    </q-avatar>
                  </q-item-label>
                </q-item>
              </q-card-section>
              <q-separator />
              <q-list dense>
                <q-item v-for="col in props.cols.filter(col => col.name !== 'namaKaryawan')" :key="col.name">
                  <q-item-section>
                    <q-item-label>{{ col.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>{{ col.value }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-card-section>
                <q-expansion-item
                  v-model="props.ok"
                  expand-separator
                  icon="view_list"
                  label="Detail transaksi belum setor"
                  header-class="text-purple"
                  @click="detail(props.row.salesID,props.row.sales,props.ok)"
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(dt,i) in detSisa.filter(a=> a.salesID===props.row.salesID)" :key="i">
                      <td class="text-right">{{ i + 1 }}</td>
                      <td class="text-left">{{ dt.nomorBukti }}</td>
                      <td class="text-right">{{ $dwn.jumlah([dt.jmlHarga,dt.ongkir]) | duit }}</td>
                    </tr>
                  </tbody>
                </q-markup-table>
                </q-expansion-item>
              </q-card-section>
            </q-card>
          </div>
        </template>
      </q-table>
    </div>
    <div style="overflow: auto; max-width: 600px;">
      <q-card>
        <q-card-section>
          <q-table
            title="Setoran Sales"
            :data="dtSetoran"
            :columns="jdls"
            row-key="nomorBukti"
            selection="single"
            :selected.sync="selected"
            :filter="caris"
            dense >
            <template v-slot:top>
              <q-chip outline color="action">Setoran Sales </q-chip>
              <q-select
                v-model="flt.status"
                :options="[{label:'Belum',value:'N'},{label:'Waiting',value:'W'},{label:'Terima',value:'T'}]"
                hint="Status sales setor"
                dense
                @input="cekSalesSetor()"
                map-options
                emit-value
                persistent-hint/>
              <q-space/>
              <q-input borderless dense debounce="300" v-model="caris" placeholder="Search">
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>
              <q-select
                v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType)"
                v-model="flt.kodeCab"
                :options="cabAll"
                :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                option-value="kodeCab"
                emit-value
                map-options
                multiple
                style="min-width: 250px; max-width: 300px"
                label="Pilih cabang... "
                dense
                @input="cekSalesSetor"
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
                      <q-checkbox v-model="flt.kodeCab" :val="scope.opt.kodeCab" @input="cekSalesSetor"/>
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
            <template
              v-slot:body="props">
              <q-tr :props="props">
                <q-td>
                  {{ dtSetoran.indexOf(props.row) +1 }}
                </q-td>
                <q-td v-for="jd in jdls" :key="jd.name" @click="confirm = !confirm, dtSetor=props.row">
                  <template v-if="jd.name === 'nilai'">
                    {{ props.row[jd.name] | duit }}
                  </template>
                  <template v-else>
                    {{ props.row[jd.name] }}
                  </template>
                </q-td>
              </q-tr>
            </template>
          </q-table>
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
                <q-item-label caption><q-chip color="secondary" outline dense>{{ dtSetor.nilai | duit }}</q-chip></q-item-label>
              </q-item-section>
            </q-item>
          </q-card-section>
          <q-card-section>
            <q-item>
              <q-item-section>
                <q-item-label>Nama Sales</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption><q-chip color="secondary" outline dense>{{ dtSetor.namaKaryawan }}</q-chip></q-item-label>
              </q-item-section>
            </q-item>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn rounded label="Tutup" color="warning" v-close-popup />
            <q-btn rounded label="Terima" color="primary" v-close-popup @click="setor (dtSetor)"  v-if="['W','N'].some(a=> a===dtSetor.setoran)"/>
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </div>
</template>

<script>
import { sisaSales, kasSalesAll, salesSetorAll, terimaSetoran, dtCab } from '../../services/apiList'
import { reactive, toRefs } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dtKas: [],
      jdl: [
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'namaCabang', label: 'Cabang', field: row => row.namaCabang, sortable: true, align: 'left' },
        { name: 'sisa', label: 'Sisa Kas', field: row => row.sisa, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'qty', label: 'Qty Penjualan', field: row => row.qty, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'jmlHarga', label: 'Omset tercapai', field: row => row.jmlHarga, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', sortable: true, align: 'right' }
      ],
      cari: '',
      cabAll: [],
      chartData: null,
      selected: [],
      expanded: [],
      detSisa: [],
      flt: { kodeCab: ['MP01'], status: 'N' },
      filt: { status: 'N', kodeCab: ['MP01'], bln: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 7) },
      jdls: [
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, sortable: true, align: 'left' },
        { name: 'tglTrx', label: 'Tgl Jual', field: row => row.tglTrx, sortable: true, align: 'left' },
        { name: 'tglSetor', label: 'Tgl Setor', field: row => row.tglSetor, sortable: true, align: 'left' },
        { name: 'nilai', label: 'Nilai Penjualan', field: row => row.nilai, format: val => new Intl.NumberFormat('en').format(val), jml: 'Y', sortable: true, align: 'right' },
        { name: 'namaKaryawan', label: 'Nama Sales', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'setoran', label: 'Status', field: row => row.setoran, sortable: true, align: 'left' }
      ],
      caris: '',
      dtSetoran: [],
      dtSetor: {},
      confirm: false,
      halaman: { rowsPerPage: 0, sortBy: 'jmlHarga', descending: true }
    })
    dtCab()
      .then(res => {
        dt.cabAll = res.data
      })
    const setor = (x) => {
      x.stat = 'T'
      terimaSetoran(x)
        .then(({ data }) => {
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
          cekSalesSetor('W')
        })
        .catch(err => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const cekSalesSetor = () => {
      dt.dtSetoran = []
      salesSetorAll(dt.flt)
        .then(({ data }) => {
          dt.dtSetoran = data
        })
        .catch(err => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const detail = (x, y, z) => {
      if (z) {
        dt.detSisa.forEach((a, b, c) => {
          if (a.salesID === x.toString()) {
            c.splice(b)
          }
        })
        sisaSales(x)
          .then(res => {
            dt.detSisa.push(...res.data)
          })
          .catch(err => {
            console.log(err.response)
            root.$q.notify({ message: `${err.response}`, color: 'purple' })
          })
      }
    }
    const dtSalesAll = () => {
      dt.dtKas = []
      kasSalesAll(dt.filt)
        .then(res => {
          dt.dtKas = res.data
          let x = {
            labels: dt.dtKas.map(a => a.namaKaryawan),
            datasets: [{
              labels: ['oke'],
              data: dt.dtKas.map(a => a.qty)
            }]
          }
          dt.chartData = x
        })
        .catch(err => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const toDown = () => {
      let x = {
        judul: `Data Setoran Sales`,
        dt: dt.dtSetoran,
        hdr: dt.jdls,
        naFile: `setoranSales`
      }
      root.$dwn.toExcel(x)
    }
    const total = () => {
      let b = dt.dtKas
      let a = {
        nilainilai: b.reduce((x, y) => root.$dwn.jumlah([x, y.nilainilai]), 0),
        target: 120000000
      }
      return a
    }
    dtSalesAll()
    cekSalesSetor()
    return { ...toRefs(dt), toDown, detail, cekSalesSetor, setor, total }
  }
}
</script>
