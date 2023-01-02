<template>
  <div>
    <q-table
      class="dataTrx"
      :data="dataKas"
      :columns="jdl"
      row-key="iddetJur"
      :rows-per-page-options="[10,0]"
      :pagination.sync="hal"
      :filter="cari"
      separator="cell"
      :visible-columns="visibleColumns"
      dense>
      <template v-slot:top>
        <div class="row q-gutter-sm justify-between" >
          <div class="col-12 q-table__title">Data Kas</div>
          <q-chip color="blue-6" class="text-white text-bold">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && (bukbes(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
          <q-input dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
              round dense
              icon="file_download"
              @click="toDown"
              class="q-ml-md"
              color="primary"
            />
            </template>
          </q-input>
          <q-toggle
            v-model="perAkun"
            label="perAkun Kas Bank"
            @input="kodeAkun = 'all'"/>
          <q-select
            v-if="perAkun"
            filled
            v-model="kodeAkun"
            dense
            options-dense
            input-debounce="0"
            label="Pilih Akun Kas"
            :options="akunKas"
            :option-label="(item) => item && item.kodeAkun + ' ' + item.namaSubAkun  + ' ' + item.namaAkun"
            option-value="kodeAkun"
            map-options
            emit-value
            :rules="inRul"
            style="width: 250px"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  No results
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
            v-model="pr.kodeCab"
            :options="$store.state.auth.user.userType ==='MAN' ? dtCabang : cabAsi"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            multiple
            style="min-width: 250px; max-width: 300px"
            label="Pilih cabang... "
            :rules="inRul"
            dense
            @input="bukbes"
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
                  <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="bukbes"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="visibleColumns"
            multiple
            outlined
            dense
            options-dense
            :display-value="$q.lang.table.columns"
            emit-value
            map-options
            :options="jdl.map(a => { return { label: a.label, value: a.name }})"
            option-value="name"
            option-label="label"
            options-cover
            style="min-width: 150px"
          >
            <template v-slot:option="scope">
              <q-item
                v-bind="scope.itemProps"
                v-on="scope.itemEvents"
              >
                <q-item-section>
                  <q-item-label v-html="scope.opt.label" ></q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox v-model="visibleColumns" :val="scope.opt.value"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            auto-width
          >
            <template v-if="col.name==='No'">
              {{ dtJurnal.indexOf(props.row) +1 }}
            </template>
            <template v-else-if="col.name==='act'">
              <q-btn v-if="props.row.iddetJur" dense icon="print" color="warning" @click="cek(props.row)"/>
              <q-btn icon="fas fa-paperclip" class="q-ml-xs" dense outline color="cyan-5" @click="getBukti(props.row)" v-if="props.row.buktiAkunting"/>
              <q-btn icon="fas fa-balance-scale" color="teal" dense outline class="q-ml-xs"
                  v-if="['MAN','purchase', 'mitra', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  @click="cekJu(props.row)">
                  <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="center left">
                    Jurnal
                  </q-tooltip>
                </q-btn>
            </template>
            <template v-else-if="col.fmt">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 4" align="center">Jumlah Total</q-th>
          <q-th align="right">{{ total.debit | nomer}}</q-th>
          <q-th align="right">{{ total.kredit | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 4" align="left">Mutasi</q-th>
          <q-th align="right">{{ total.saldoAkhir- sawal | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 4" align="left">Saldo Awal</q-th>
          <q-th align="right">{{ sawal | nomer}}</q-th>
        </q-tr>
        <q-tr>
          <q-th :colspan="visibleColumns.length - 4" align="left">Saldo Akhir</q-th>
          <q-th align="right">{{ total.saldoAkhir | nomer}}</q-th>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="dtJ"
      full-width>
      <edJur ref="apJur" :detJur="detJur" @ok="dtJ=false" :jh="jh"/>
    </q-dialog>
  </div>
</template>

<script>
import FileSaver from 'file-saver'
import { accRek, dtKas, dtCab, detKas, detailJur } from '../../services/apiList'
import edJur from './edJur'
import { reactive, computed, toRefs, onMounted, watch } from '@vue/composition-api'
export default {
  components: {
    edJur
  },
  props: {
    jns: {
      type: String,
      default: 'K'
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'No', label: 'No', align: 'left' },
        { name: 'kodeCab', label: 'Cabang', field: row => row.kodeCab, align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'namaAkun', label: 'Nama Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'desk', label: 'Desk', field: row => row.desk, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'debit', label: 'Masuk', field: row => row.debit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'kredit', label: 'Keluar', field: row => row.kredit, jml: 'Y', align: 'right', fmt: 'nomer' },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, align: 'right', fmt: 'nomer' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      dtJ: false,
      detJur: [],
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeAkun: '', kodeCab: [root.$store.state.auth.setCabang], jns: props.jns },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      alAkun: [],
      perAkun: false,
      kodeAkun: 'all',
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtCabang: [],
      jh: {},
      hal: { rowsPerPage: 10 },
      visibleColumns: []
    })
    const akunKas = computed(() => {
      let a = [...new Set(dt.dtJurnal.map(s => s.kodeAkun))]
      console.log(a)
      return dt.alAkun.filter(akn => a.some(s => s === akn.kodeAkun))
    })
    const dataKas = computed(() => {
      let a = dt.kodeAkun !== 'all' ? dt.dtJurnal.filter(s => s.kodeAkun === dt.kodeAkun) : dt.dtJurnal
      return a
    })
    const jenis = computed(() => {
      let a = dt.pr.jns === 'K' ? {
        label: 'Keluar',
        DK: 'K'
      } : {
        label: 'Masuk',
        DK: 'D'
      }
      return a
    })
    const total = computed(() => {
      let x = {}
      x.debit = dataKas.value.reduce((a, b) => root.$dwn.jumlah([a, b.debit]), 0)
      x.kredit = dataKas.value.reduce((a, b) => root.$dwn.jumlah([a, b.kredit]), 0)
      x.saldoAkhir = root.$dwn.jumlah([dt.sawal, x.debit, -x.kredit])
      return x
    })
    accRek()
      .then(res => {
        dt.alAkun = res.data
      })
    dtCab()
      .then(res => {
        const pegang = root.$store.state.auth.user.cabGrup
        dt.dtCabang = res.data.filter(a => pegang.some(s => s === a.kodeCab))
      })
    onMounted(() => {
      bukbes()
      dt.visibleColumns = dt.jdl.map(a => a.name)
    })
    const getBukti = (x) => {
      const mimetype = x.mimetype ? x.mimetype.split('/')[1] : 'pdf'
      root.$axios.get('/buktiAkunting?',
        {
          params: { key: x.buktiAkunting },
          responseType: 'arraybuffer'
        })
        .then(async (res) => {
          // const oke = await fetch(`data:${x.extensi};base64,${res.data}`)
          FileSaver.saveAs(new Blob([res.data]), `${x.nomorJurnal}.${mimetype}`)
        })
    }
    const bukbes = () => {
      if (dt.pr) {
        dt.pr.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
        dt.pr.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
        dt.pr.kodeAkun = dt.kodeAkun.kodeAkun
        dt.dtJurnal = []
        dtKas(dt.pr)
          .then(res => {
            let a = res.data.dt
            let sawal = res.data.sawal
            dt.sawal = sawal
            dt.dtJurnal = a.map((x, y, a) => {
              let u = x
              if (y === 0) {
                u.saldo = x.jenis === 'D' ? root.$dwn.jumlah([sawal, u.debit, -u.kredit])
                  : root.$dwn.jumlah([sawal, u.kredit, -u.debit])
              } else {
                u.saldo = x.jenis === 'D' ? root.$dwn.jumlah([a[y - 1].saldo, u.debit, -u.kredit])
                  : root.$dwn.jumlah([a[y - 1].saldo, u.kredit, -u.debit])
              }
              return u
            })
            dt.dtJurnal.unshift({ nomorJurnal: 'Saldo Awal', saldo: sawal, debit: 0, kredit: 0 })
          })
          .catch((err) => {
            console.log(err)
          })
      } else {
        root.$q.notify({ message: `Pilih filter dulu....`, color: 'action' })
      }
    }
    const onReset = () => {
      dt.pr = { }
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Kas ${dt.kodeAkun.kodeAkun} ${dt.kodeAkun.namaAkun} (${dt.kodeAkun.jnsAkun})`,
        dt: dt.dtJurnal,
        hdr: dt.jdl,
        naFile: `BukuBesar`
      }
      root.$dwn.toExcel(x)
    }
    const filterFn = (val, update) => {
      if (val === '') {
        update(() => {
          dt.options = dt.alAkun
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        dt.options = dt.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const cek = (x) => {
      dt.jh = { ...x }
      dt.detJur = []
      detKas(x)
        .then(res => {
          dt.detJur = res.data
          printBukti(x, dt.detJur)
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const printBukti = (x, y) => {
      // let DKl = x.jenis === 'D' ? 'K' : 'D'
      let detLawan = x.jnsJurnal === 'J' ? y.filter(a => a.kodeAkun !== x.kodeAkun && a.subAkun !== '11070' && a.subAkun !== '41010') : y.filter(a => a.kodeAkun !== x.kodeAkun)
      // let detLawan = y.filter(a => a.kodeAkun !== x.kodeAkun)
      let detKas = y.filter(a => a.DK === x.jenis && a.arusKas === 'Y')
      let jnsKas = x.jenis === 'K' ? 'KELUAR' : 'MASUK'
      let cab = dt.dtCabang.find(a => a.kodeCab === x.kodeCab)
      let tKas = detLawan.reduce((a, b) => root.$dwn.jumlah([a, b.nilai]), 0)
      let wd = window.open('', 'Bukti Kas', 'resize = 1')
      let html = `<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Cetak Bukti Kas Keluar</title>
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
        }
    </style>
    </head><body style="font-size: 11px">
                <table width="100%" id="tss">
            <tbody><tr>
                <td colspan="3" width="60%" class="bdr_btm" valign="top">   
                                  
                    <table width="100%">
                        <tbody><tr>
                            <td>
                                <b>${cab.namaCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.alamatCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.tlp || ''}</b>
                            </td>
                        </tr>
                    </tbody></table>
                </td>
                <td class="bdr_btm" align="right">                    
                    <table width="100%">
                        <tbody><tr>
                            <td colspan="4" class="bdr_btm">
                                <b>BUKTI KAS ${jnsKas}</b> 
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID</td>
                            <td>: ${x.nomorJurnal}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${x.tgl}</td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width="100%">
                        <tbody><tr>
                            <td width="15%">Kas / Bank</td>
                            <td width="35%">: ${detKas.length ? detKas[0].namaAkun : ''}</td>
                            <td width="15%"></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Keterangan</td>
                            <td rowspan="2" valign="top">: ${x.judulJurnal}</td>
                            <td valign="top"></td>
                            <td rowspan="2" valign="top"></td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width="100%">
                        <tbody><tr>
                            <td width="5%" align="center">No</td>
                            <td width="25%">Kode Rekening </td>
                            <td>Rekening</td>
                            <td>Keterangan</td>
                            <td align="right">Nilai</td>
                        </tr>`
      let dtDet = ''
      detLawan.forEach((det, i) => {
        dtDet += `<tr>
          <td align='center'>${(i + 1).toString().padStart(3, ' ')}</td>
          <td >${det.kodeAkun}</td>
          <td >${det.namaAkun}</td>
          <td >${det.desk || ''}</td>
          <td align='right'>${new Intl.NumberFormat('en').format(Number(det.nilai).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</tbody></table>
                </td>
            </tr>
            <tr>
                <td colspan="4">
                    <table width="100%">
                        <tbody><tr>
                            <td colspan="3" align="right" width="80%"><b>Total</b></td>
                            <td align="right"><b>${new Intl.NumberFormat('en').format(Number(tKas).toFixed(2))}</b></td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
            <tr>
                <td colspan="4" align="center">
                    <table width="90%" align="center">
                        <tbody><tr>
                            <td width="33%" align="center">Di buat oleh, <br><br><br><br><br>${x.olehNama || x.namaKaryawan || root.$store.state.auth.user.nama}</td>
                            <td width="33%" align="center">Mengetahui, <br><br><br><br><br>(.....................)</td>                                                        
                            <td width="33%" align="center">Diterima oleh, <br><br><br><br><br>${x.namaPartner}</td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
        </tbody></table>

        <div id="man" style="border:1px solid red;background-color:silver;padding:5px;width:80%;">
            Pengaturan Printer Epson LX 310: <hr>
            <ul>
                <li>Ukuran kertas 21 cm * 14.8 cm / A4 tanpa header dan footer</li>
                <li>DPI 120 * 144</li>
                <li>Cetak menggunakan browser Mozilla</li>
            </ul>
            <hr>
            <button type="button" onclick="window.print();">Cetak Nota Penjualan</button>
        </div>
      </body></html>`
      html += dtDet + ttp
      wd.document.open()
      wd.document.write(html)
      wd.document.close()
    }
    const cabAsi = computed(() => {
      return dt.dtCabang
    })
    const cekJu = (x) => {
      dt.jh = { ...x }
      dt.detJur = []
      detailJur(x)
        .then(res => {
          dt.dtJ = true
          dt.detJur = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.pr.kodeCab = [val]
      bukbes()
    })
    return { ...toRefs(dt), getBukti, cabAsi, jenis, total, cek, filterFn, toDown, onReset, bukbes, akunKas, dataKas, cekJu }
  }
}
</script>
