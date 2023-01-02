<template>
  <q-card
    style="min-width: 700px">
    <q-card-section>
      <q-table
        :data="dtProject"
        :columns="jdl"
        row-key="nomorProject"
        dense
        class="dataPR"
        >
        <template v-slot:top>
          <div class="col-12 q-table__title text-h6 text-blue">Rekap Project</div>
          <q-chip color="blue-6" class="text-white text-bold q-ml-md">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxyb" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && (rkp(),$refs.qDateProxyb.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props">
              <template v-if="col.name === 'No'">
                <q-icon size="md" color="warning" :name="props.expand ? 'expand_less' : 'expand_more'" @click="dtCek(props.row,props.expand),props.expand = !props.expand" />
                {{ props.rowIndex + 1 }}
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props">
            <q-td colspan="100%">
              <template v-if="detTrx.some(a=> a.nomorProject=== props.row.nomorProject)">
                <q-markup-table>
                  <q-tr>
                    <q-th align="left">No</q-th>
                    <q-th align="left">Kode Produk</q-th>
                    <q-th align="left">Nama Produk</q-th>
                    <q-th>SPK</q-th>
                    <q-th>Qty Produksi</q-th>
                    <q-th>Jumlah Harga</q-th>
                  </q-tr>
                  <q-tr
                    v-for="(dt,i) in detTrx.filter(a=> a.nomorProject === props.row.nomorProject)"
                    :key="dt.iddetTrans">
                    <q-td>{{ i+1 }}</q-td>
                    <q-td>{{ dt.kodeProduk }}</q-td>
                    <q-td>{{ dt.namaBarang }}</q-td>
                    <q-td align="right">{{ dt.qtySPK }}
                    </q-td>
                    <q-td align="right">{{ dt.qtyProd }}
                    </q-td>
                    <q-td align="right">{{ dt.hargaSat * dt.qtySPK  | duit }}</q-td>
                  </q-tr>
                </q-markup-table>
              </template>
              <template v-else>
                <span style="font-style: italic; font-color: orange;">Belum ada detail {{ props.row.nomorProject }}</span>
              </template>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>
<script>
import { onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import { rkpProject, getdetProject } from '../../services/apiList'
export default {
  props: {
    pilih: {
      type: Object,
      default: () => {
        return {
          tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          status: ['Baru', 'Konfirm', 'Proses', 'Part', 'Selesai']
        }
      }
    },
    hdr: {
      type: Object,
      default: () => {
        return {
          tglMasuk: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          kodeCab: null,
          kodePartner: null,
          kodeProduk: '',
          asalBahan: '',
          uangMuka: '',
          akunBayar: '',
          materialCust: '',
          catatan: '',
          salesID: null,
          estimasi: 1,
          jnsProject: '',
          nomorProject: null,
          akunUangMuka: ''
        }
      }
    },
    detail: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      p: { ...props.hdr },
      dtProject: [ ...props.detail ],
      jdl: [
        { name: 'No', label: 'No', field: row => row.No, align: 'left' },
        { name: 'tglMasuk', label: 'Tanggal', field: row => row.tglMasuk, align: 'left' },
        { name: 'nomorProject', label: 'Nomor Project', field: row => row.nomorProject, align: 'left' },
        { name: 'namaPartner', label: 'Nama Pelanggan', field: row => row.namaPartner, align: 'left' },
        { name: 'uangMuka', label: 'Uang Muka', field: row => row.uangMuka, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'totalHarga', label: 'Nilai Penjualan', field: row => row.totalHarga, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'hppSPK', label: 'HPP SPK', field: row => row.hppSPK, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'hppAdjust', label: 'HPP Adjust', field: row => row.hppAdjust, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'totalHPP', label: 'Total HPP', field: row => row.totalHPP, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'margin', label: 'Margin', field: row => row.margin, align: 'right' },
        { name: 'status', label: 'Status Project', field: row => row.status, align: 'left' }
      ],
      filt: { ...props.pilih },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      detTrx: []
    })
    const rkp = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      dt.filt.kodeCab = dt.filt.kodeCab || root.$store.state.auth.user.kodeCab
      rkpProject(dt.filt)
        .then(({ data }) => {
          dt.dtProject = data.map(a => {
            a.margin = root.$dwn.jumlah([a.totalHarga, -a.totalHPP])
            return a
          })
        }).catch(err => {
          console.log(err)
        })
    }
    onMounted(() => {
      rkp()
      /* hisBayarProject(props.hdr)
        .then(({ data }) => {
          dt.dtProject = data
        }) */
    })
    watch(() => root.$store.state.auth.setCabang, (newVal, oldVal) => {
      dt.filt.kodeCab = newVal
      rkp()
    })
    const dtCek = (x, y) => {
      if (!y) {
        dt.detTrx.forEach((a, b, c) => {
          if (a.nomorProject === x.nomorProject.toString()) {
            c.splice(b)
          }
        })
        getdetProject(x)
          .then(({ data }) => {
            dt.detTrx.push(...data)
          })
      }
    }
    return { ...toRefs(dt), rkp, dtCek }
  }
}
</script>
