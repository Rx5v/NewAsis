<template>
  <q-page padding>
    <q-table
      :data="dtPoint"
      :columns="jdlr"
      row-key="kodePartner"
      :filter="carir"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Point Member</div>
        <q-space />
        <q-input dense debounce="300" v-model="carir" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-input filled v-model="tahun" label="Tahun" dense lazy-rules readonly>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy ref="qDateProxya" transition-show="scale" transition-hide="scale">
                <q-date v-model="tahun" @input="() => $refs.qDateProxya.hide()" mask="YYYY" lazy-rules default-view="Years" emit-immediately/>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn icon="fas fa-medal" class="q-ml-xs" color="red" outline dense @click="resetPoint(tahun)">
          <q-tooltip content-class="bg-warning" :offset="[10, 10]" anchor="bottom left">
            Reset biaya point
          </q-tooltip>
        </q-btn>
      </template>
      <template v-slot:body-cell-act="props">
        <q-td align="right">
          <q-btn icon="check" outline round color="teal-13" class="q-ml-xs" dense @click="hisBeli(props.row)">
            <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="bottom left">
              Histori Pelanggan
            </q-tooltip>
          </q-btn>
          <q-btn icon="done_all" color="blue-13" class="q-ml-xs" round dense @click="cekHis(props.row)">
            <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="bottom left">
              Histori Point
            </q-tooltip>
          </q-btn>
          <q-btn icon="fas fa-medal" class="q-ml-xs" color="accent" outline dense @click="klaim(props.row)">
            <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="bottom left">
              Klaim Point
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
    <q-table
      class="q-mt-md"
      :data="dtKlaim"
      :columns="jdl"
      row-key="nomorKlaim"
      :filter="cari"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Klaim Point</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="addK = true"
          color="purple"
          class="q-ml-md"
        />
      </template>
      <template v-slot:body-cell-act="props">
        <q-td align="right" >
          <q-btn icon="check" outline round color="teal-13" dense @click="oke(props.row)" v-if="props.row.status === 'W'"/>
          <q-btn icon="fas fa-balance-scale" color="teal" dense outline class="q-ml-xs"
            @click="cj=true,getJur(props.row)">
            <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="center left">
              Jurnal
            </q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>
    <q-dialog
      v-model="addK">
      <q-card style="max-width: 80vw;">
        <q-card-section class="bg-secondary text-white">Klaim Point</q-card-section>
        <q-form
          ref="form"
          @submit="simpan(jh)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section class="column">
            <q-input filled v-model="jh.tglKlaim" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc'].some(a=> a==$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="jh.tglKlaim" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              :value="cust.namaPartner"
              label="Nama Pelanggan" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
              <q-dialog v-model="crp" persistent>
                <q-card style="min-width: 350px">
                  <q-card-section>
                    <div class="text-h6">Partner Luar</div>
                  </q-card-section>
                  <q-card-section class="q-pt-none">
                    <cariPartner @dtPartner="partner" :pil="false" :bebas="false"/>
                  </q-card-section>
                  <q-card-actions align="right" class="text-primary">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn flat label="Pilih" v-close-popup />
                  </q-card-actions>
                </q-card>
              </q-dialog>
            <q-input
              v-model="jh.keterangan"
              :rules="inRul"
              dense
              label="Keterangan"/>
            <q-input
              v-model="jh.caraKlaim"
              readonly
              dense
              label="Cara Klaim"/>
            <q-chip color="red" outline>Sisa Point : {{ jh.sisaPoint | duit }}</q-chip>
            <q-chip color="teal" outline>Klaim Point : {{ jh.pointKlaim | duit }}
              <q-popup-edit v-model="jh.pointKlaim">
                <q-input
                  v-model="jh.pointKlaim"
                  :rules="inRul"
                  type="number"
                  label="Nilai Klaim"
                  @input="hit(jh)"/>
              </q-popup-edit>
            </q-chip>
            <!-- <q-select
              filled
              v-model="jh.kodeAkun"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun Klaim"
              :options="akunKasB"
              :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
              option-value="kodeAkun"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            /> -->
          </q-card-section>
          <q-card-actions>
            <q-space/>
            <q-btn label="Reset" type="reset" color="orange" class="q-ml-sm" />
            <q-btn label="Klaim" type="submit" color="primary" class="q-ml-sm"/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="adBa"
      persistent>
      <q-card style="width: 600px; max-width: 80vw;">
        <q-form
          ref="form"
          @submit="simpanKlaim(j)"
          class="q-gutter-md">
          <q-card-section class="column">
            <div class="text-h5">Klaim Point</div>
            <q-separator color="purple" spaced/>
            <q-input filled v-model="j.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a==$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="j.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              :value="j.namaPartner"
              label="Nama Partner"/>
            <q-input
              v-model="j.uraian"
              :rules="inRul"
              dense
              label="Judul Transaksi"/>
            <q-select
              filled
              v-model="j.kodeAkun"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun Kas"
              :options="akunB"
              :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
              option-value="kodeAkun"
              @filter="filterFn"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            />
            <!-- <q-select
              filled
              v-model="j.kodeAkunD"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun Biaya"
              :options="akunB"
              :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
              option-value="kodeAkun"
              @filter="filterFn"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            /> -->
            <q-chip color="green" outline>
              Jumlah Biaya {{ j.nilai | duit}}
              <q-popup-edit v-model="j.nilai">
                <q-input
                  v-model="j.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"/>
              </q-popup-edit>
            </q-chip>
            <q-input
              v-model="j.desk"
              label="Note : "/>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn rounded label="Kembali" color="warning" v-close-popup />
            <q-btn rounded label="Bayar" color="primary" type="submit"/>
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="cj"
      full-width>
      <edJur ref="dtJurnal" :detJur="detJur" :jh="ju" @ok="cj=false" />
    </q-dialog>
    <q-dialog v-model="hipo" seamless position="bottom" full-width>
      <q-card class="bg-teal-13" style="max-width:80vw">
        <q-card-section>
          <div class="text-h6 text-blue-13">Histori Point Membership <q-chip color="blue-13" class="text-white">{{ ch.namaPartner }}</q-chip></div>
          <q-btn icon="close" color="red" dense v-close-popup class="absolute-top-right" @click="hipo = false"/>
          <q-separator color="purple-13"/>
        </q-card-section>
        <q-card-section>
          <q-markup-table>
            <thead>
              <tr>
                <th class="text-left">No.</th>
                <th class="text-left">Nomor Bukti</th>
                <th class="text-left">Tanggal</th>
                <th>Point Masuk</th>
                <th>Klaim Point</th>
                <th class="text-left">Status</th>
                <th class="text-left">Act</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(a,i) in hisPoint" :key="i">
                <td>{{ i + 1 }}</td>
                <td>{{ a.nomorBukti }}</td>
                <td>{{ a.tglKlaim }}</td>
                <td align="right">{{ a.pointMasuk | duit }}</td>
                <td align="right">{{ a.pointKlaim | duit }}</td>
                <td>{{ a.status }}</td>
                <td><q-btn icon="close" color="pink" round outline dense @click="hps(a)"/></td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="hb">
      <q-card style="max-width: 80vw">
        <q-card-section>
          <q-table
            :columns="jdlhisTrx"
            :data="hisTrx"
            dense>
            <template v-slot:top-right>
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown(hisTrx, jdlhisTrx, 'HisTrans')"
                class="q-ml-md"
                color="primary"
              />
            </template>
            <template v-slot:body-cell-nom="props">
              <q-td>{{ props.rowIndex + 1 }}</q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import cariPartner from '../../components/cariPartner'
import edJur from '../../components/acc/edJur'
import { onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import { accRek, addKlaim, addTutupKlaim, cekHisPoint, cekPoint, dataKlaimPoint, dataPoint, detailJur, hisBelanja, hpsPoint, klaimPoint, upPoint } from '../../services/apiList'
export default {
  components: {
    cariPartner,
    edJur
  },
  props: {
    Cust: {
      type: Object,
      default: function () {
        return { namaPartner: '', alamat: '' }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      carir: '',
      cari: '',
      jh: {
        kodePartner: '',
        tglKlaim: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        pointKlaim: 0,
        keterangan: '',
        akunKlaim: '',
        status: 'W',
        sisaPoint: 0,
        caraKlaim: 'Cabang'
      },
      dtKlaim: [],
      jdl: [
        { name: 'nomorKlaim', label: 'Nomor Klaim', field: row => row.nomorKlaim, align: 'left' },
        { name: 'tglKlaim', label: 'Tanggal Klaim', field: row => row.tglKlaim, align: 'left' },
        { name: 'kodePartner', label: 'Kode Pelanggan', field: row => row.kodePartner, align: 'left' },
        { name: 'namaPartner', label: 'Nama Pelanggan', field: row => row.namaPartner, align: 'left' },
        { name: 'namaCabang', label: 'Cabang Klaim', field: row => row.namaCabang, align: 'left' },
        { name: 'pointKlaim', label: 'Nilai Klaim', field: row => row.pointKlaim, format: row => row.toLocaleString(), align: 'right' },
        { name: 'stPoint', label: 'Status Klaim', field: row => row.stPoint, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      jdlr: [
        { name: 'namaCabang', label: 'Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'kodePartner', label: 'Kode Pelanggan', field: row => row.kodePartner, align: 'left' },
        { name: 'namaPartner', label: 'Nama Pelanggan', field: row => row.namaPartner, align: 'left' },
        { name: 'namaPIC', label: 'Nama PIC', field: row => row.namaPIC, align: 'left' },
        { name: 'telpPIC', label: 'Telp PIC', field: row => row.telpPIC, align: 'left' },
        { name: 'totalPoint', label: 'Total Point', field: row => row.totalPoint, format: row => row.toLocaleString(), align: 'right', jml: 'Y' },
        { name: 'tunggu', label: 'Tunggu', field: row => row.tunggu, format: row => row.toLocaleString(), align: 'right', jml: 'Y' },
        { name: 'klaimPoint', label: 'Klaim Point', field: row => row.klaimPoint, format: row => row.toLocaleString(), align: 'right', jml: 'Y' },
        { name: 'klaimPointW', label: 'Belum Approve', field: row => row.klaimPointW, format: row => row.toLocaleString(), align: 'right', jml: 'Y' },
        { name: 'sisaPoint', label: 'Sisa Point', field: row => row.sisaPoint, format: row => row.toLocaleString(), sortable: true, align: 'right', jml: 'Y' },
        { name: 'act', label: 'Act' }
      ],
      dtPoint: [],
      inRul: [ v => !!v || 'Isi data' ],
      addK: false,
      crp: false,
      cust: props.Cust,
      j: { kodeAkunD: '210500003', kodeAkun: '510100007' },
      alAkun: [],
      akunB: [],
      adBa: false,
      namaPartner: '',
      cj: false,
      detJur: [],
      ju: {},
      hisPoint: [],
      hipo: false,
      hisTrx: [],
      jdlhisTrx: [
        { name: 'nom', label: 'No', align: 'right' },
        { name: 'nomorBukti', label: 'Nomor Bukti', field: row => row.nomorBukti, align: 'left' },
        { name: 'tglKirim', label: 'Tanggal Kirim', field: row => row.tglKirim, align: 'left' },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left' },
        { name: 'totalAkhir', label: 'Jml Harga', field: row => row.totalAkhir, format: row => row.toLocaleString(), align: 'right' },
        { name: 'totalPoint', label: 'Jml Point', field: row => row.totalPoint, format: row => row.toLocaleString(), align: 'right' },
        { name: 'stPoint', label: 'Status Point', field: row => row.stPoint }
      ],
      hb: false,
      ch: { namaPartner: '' },
      tahun: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 4)
    })
    const allPoint = () => {
      dataPoint({ tahun: dt.tahun })
        .then(({ data }) => {
          dt.dtPoint = data
        })
      dataKlaimPoint({ tahun: dt.tahun })
        .then(({ data }) => {
          dt.dtKlaim = data
        })
    }
    onMounted(() => {
      accRek()
        .then(({ data }) => {
          dt.alAkun = data
        })
      allPoint()
    })
    const simpan = (jh) => {
      if (jh.pointKlaim > 0) {
        addKlaim(jh)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal-13' })
            onReset()
            allPoint()
          })
          .catch(err => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'red-13' })
          })
      } else {
        root.$q.notify({ message: `Jumlah Klaim Point masih ${jh.pointKlaim}`, color: 'red-13' })
      }
    }
    const onReset = () => {
      dt.cust = {}
      dt.jh = {
        kodePartner: '',
        tglKlaim: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        pointKlaim: 0,
        keterangan: '',
        akunKlaim: '',
        status: 'W',
        sisaPoint: 0,
        caraKlaim: 'Cabang'
      }
    }
    const partner = (x) => {
      dt.jh.kodePartner = x.kodePartner
      // cek saldoPoint
      cekPoint({ kodePartner: x.kodePartner, telpPIC: x.telpPIC })
        .then(({ data }) => {
          dt.jh = { ...dt.jh, ...data[0] }
        })
      dt.cust = x
    }
    const hit = (x) => {
      if (x.pointKlaim >= x.sisaPoint) {
        x.pointKlaim = x.sisaPoint
        root.$q.notify({ message: `Sisa point ${x.sisaPoint}`, color: 'red-13' })
      }
    }
    const klaim = (x) => {
      dt.cust = { ...x }
      dt.jh = { ...dt.jh, ...x }
      dt.jh.tglKlaim = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      dt.jh.caraKlaim = 'Cabang'
      dt.addK = true
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.akunB = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.akunB = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const oke = (x) => {
      dt.j = { ...x }
      dt.j.tgl = x.tglKlaim
      dt.j.uraian = `Klaim Point ${x.namaPartner} : ${x.pointKlaim.toLocaleString()} No: ${x.nomorKlaim}`
      dt.j.desk = `Klaim Point ${x.namaPartner} : ${x.pointKlaim.toLocaleString()}`
      dt.j.nilai = x.pointKlaim
      dt.adBa = true
    }
    const simpanKlaim = async (y) => {
      y.jnsTrx = 'KL'
      y.kodeAkunD = '210500003'
      // y.kodeAkun = '510100007'
      y.status = 'T'
      y.jhp = ''
      y.salesID = root.$store.state.auth.user.eID
      let x = await {
        hd: y,
        det: [
          {
            DK: 'D',
            kodeAkun: '210500003',
            desk: y.desk,
            nilai: y.nilai
          },
          {
            DK: 'K',
            kodeAkun: '510100007',
            desk: y.desk,
            nilai: y.nilai
          }
        ]
      }
      klaimPoint(x.hd)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          allPoint()
          dt.adBa = false
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: err.response.data.st, color: 'purple' })
        })
    }
    const konf = (x) => {
      upPoint(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal' })
        })
    }
    const getJur = (x) => {
      detailJur(x)
        .then(({ data }) => {
          dt.detJur = data
          dt.ju = data[0]
          dt.ju.tgl = x.tglKlaim
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const cekHis = (x) => {
      dt.hisPoint = []
      dt.ch = { ...x }
      x.tahun = dt.tahun
      cekHisPoint(x)
        .then(({ data }) => {
          dt.hisPoint = data.sort((a, b) => {
            if (a.tglKlaim === b.tglKlaim) {
              return b.pointMasuk - a.pointMasuk
            } else {
              return new Date(a.tglKlaim.slice(0, 10)) - new Date(b.tglKlaim.slice(0, 10))
            }
          })
          dt.hipo = true
        })
    }
    const hisBeli = (x) => {
      dt.hisTrx = []
      hisBelanja(x)
        .then(({ data }) => {
          dt.hisTrx = data.filter(a => a.totalPoint > 0)
          dt.hb = true
        })
    }
    const hps = (x) => {
      root.$q.dialog({
        title: `Hapus Point MemberShip`,
        message: `Hapus point di transaksi <b>${x.nomorBukti}</b> <span class="text-red">${x.namaPartner}</span> ?`,
        cancel: true,
        persistent: false,
        html: true
      }).onOk(() => {
        hpsPoint(x)
          .then(({ data }) => {
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
            cekHis()
            allPoint()
          })
          .catch((err) => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    }
    watch(() => dt.tahun, (val) => {
      allPoint()
    })
    const toDown = (data, y, z) => {
      let x = {
        judul: `Data ${z} periode ${dt.tahun}`,
        dt: data,
        hdr: y,
        naFile: z + '.xlsx'
      }
      root.$dwn.toExcel(x)
    }
    const resetPoint = () => {
      root.$q.dialog({
        title: `Reset Point Tahun ${dt.tahun}`,
        message: `Sisa point termasuk point tunggu di tahun ${dt.tahun}
        <span class='text-purple'>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dt.dtPoint.reduce((a, b) => root.$dwn.jumlah([b.sisaPoint, b.tunggu, a]), 0))}</span>`,
        cancel: true,
        persistent: false,
        html: true
      }).onOk(() => {
        addTutupKlaim({ tglKlaim: dt.tahun + '-12-31', dataPoint: dt.dtPoint })
          .then(({ data }) => {
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
            cekHis()
            allPoint()
          })
          .catch((err) => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      })
    }
    return { ...toRefs(dt), resetPoint, toDown, simpan, onReset, partner, hit, klaim, filterFn, oke, simpanKlaim, konf, getJur, cekHis, hisBeli, hps, allPoint }
  }
}
</script>
<style>
 table table-bordered{
   border: 1px solid teal;
 }
</style>
