<template>
  <div class="flex flex-center">
    <q-card>
      <q-card-section>
        <q-toolbar>
          <q-toolbar-title>Laporan Rugi Laba </q-toolbar-title>
          <q-space/>
          <q-select
            v-model="pr.prd"
            :options="[{label:'Bulanan', value:'M'},{label:'Tahunan',value:'Y'}]"
            emit-value
            map-options
            label="Periode"
          />
          <q-btn dense round icon="folder_open" color="purple" @click="nrc"/>
        </q-toolbar>
      </q-card-section>
      <q-card-actions>
          <q-input filled v-model="pr.tgla" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tgla" @input="() => ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules :rules="inRul" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
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
            <q-select
                  class="q-ml-sm"
                  v-if="['MAN','acc','purchase', 'mitra', 'admin'].some(a => a== $store.state.auth.user.userType)"
                  v-model="divisi"
                  :options="dtComp"
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
                  v-model="pr.kodeCab"
                  :options="dtCabang.filter(a => divisi === a.compCode)"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  option-dense
                  emit-value
                  map-options
                  multiple
                  style="min-width: 250px; max-width: 550px"
                  label="Pilih cabang... "
                  dense
                  @input="nrc"
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
                        <q-checkbox v-model="pr.kodeCab" :val="scope.opt.kodeCab" @input="nrc"/>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected>
                    {{ pr.kodeCab.length }} cabang
                  </template>
                </q-select>
                <q-toggle v-model="pr.allCab" label="Pilih semua..." @input="gantiCab(pr.allCab)"/>
      </q-card-actions>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            icon="account_balance"
            label="Pendapatan"
            header-class="bg-teal-8 text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance"/>
              </q-item-section>
              <q-item-section>
                Pendapatan Usaha
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.pendUsaha | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dta.filter(a=>a.grupAkun==3)" :key="item.midSub"
              header-class="text-teal"
              default-opened>
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | nomer }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-primary"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | nomer }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | nomer }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        <!-- </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense> -->
          <q-expansion-item
            dense
            expand-separator
            icon="account_balance_wallet"
            label="Pengeluaran"
            header-class="bg-orange text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance_wallet"/>
              </q-item-section>
              <q-item-section>
                Biaya Atas Pendapatan Usaha
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.biayaHPP | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dta.filter(a=>a.grupAkun==4)" :key="item.midSub"
              header-class="text-primary"
              default-opened>
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | nomer }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-primary"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | nomer }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | nomer }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
          <q-item class="text-primary">
            <q-item-section><q-chip :color="warna" outline clickable class="shadow-2">LABA/(RUGI) KOTOR</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna" outline clickable class="shadow-2">{{ $dwn.jumlah([jml.pendUsaha,-jml.biayaHPP]) | duit }}</q-chip>
            </q-item-label>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            icon="account_balance"
            label="Pendapatan"
            header-class="bg-orange text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance"/>
              </q-item-section>
              <q-item-section>
                Biaya Operasional
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.biayaBOP | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dta.filter(a=>a.grupAkun==5)" :key="item.midSub"
              header-class="text-teal"
              default-opened>
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | nomer }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-primary"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | nomer }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | nomer }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        <!-- </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense> -->
          <q-item class="text-primary">
            <q-item-section><q-chip :color="warna" outline clickable class="shadow-2">LABA/(RUGI) OPERASIONAL</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna" outline clickable class="shadow-2">{{ $dwn.jumlah([jml.pendUsaha,-jml.biayaHPP,-jml.biayaBOP]) | duit }}</q-chip>
            </q-item-label>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list bordered>
          <q-expansion-item
            dense
            expand-separator
            icon="account_balance_wallet"
            header-class="bg-teal-4 text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance_wallet"/>
              </q-item-section>
              <q-item-section>
                Pendapatan dan Biaya Luar Usaha
              </q-item-section>
              <q-item-section side class="text-white">
                {{ jml.pluarUsaha - jml.bluarUsaha | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense
              dense-toggle
              expand-separator
              v-for="(item) in dta.filter(a=>a.grupAkun==6)" :key="item.midSub"
              header-class="text-teal"
              default-opened>
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="bubble_chart"/>
                </q-item-section>
                <q-item-section>
                  {{ item.namaMidSub }}
                </q-item-section>
                <q-item-section side>
                  {{ item.saldoMidSub | nomer }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense
                expand-separator
                dense-toggle
                :content-inset-level="1"
                default-opened
                header-class="text-warning"
                v-for="(dta) in item[item.midSub]" :key="dta.subAkun"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="add_circle_outline"/>
                  </q-item-section>
                  <q-item-section>
                    {{ dta.namaSubAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dta.saldoSub | nomer }}
                  </q-item-label>
                </template>
                <q-item v-for="(dtal,u) in dta[dta.subAkun]" :key="u" dense>
                  <q-item-section>
                    {{u+1}}. {{ dtal.namaAkun }}
                  </q-item-section>
                  <q-item-label>
                    {{ dtal.saldo | nomer }}
                  </q-item-label>
                </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
          <q-item class="text-primary">
            <q-item-section><q-chip :color="warna" outline clickable class="shadow-2">LABA/(RUGI) SETELAH PENDAPATAN DAN BIAYA DILUAR USAHA</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna" outline clickable class="shadow-2">{{ $dwn.jumlah([jml.pendUsaha,-jml.biayaHPP,-jml.biayaBOP,jml.pluarUsaha, -jml.bluarUsaha]) | duit }}</q-chip>
            </q-item-label>
          </q-item>
          <q-item class="text-primary" v-if="$store.state.auth.user.divisi==='OT'">
            <q-item-section><q-chip :color="warna">BIAYA BAGI HASIL MANAGEMENT</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna">{{ 0 | duit }}</q-chip>
            </q-item-label>
          </q-item>
          <!-- <q-item class="text-primary">
            <q-item-section><q-chip :color="warna">BUNGA DAN PAJAK BUNGA BANK</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna">{{ 0 | duit }}</q-chip>
            </q-item-label>
          </q-item> -->
          <q-item class="text-primary">
            <q-item-section><q-chip :color="warna" outline clickable class="shadow-2">LABA/(RUGI) BERSIH</q-chip></q-item-section>
            <q-item-label>
              <q-chip :color="warna" outline clickable class="shadow-2">{{ $dwn.jumlah([jml.pendUsaha,-jml.biayaHPP,-jml.biayaBOP,jml.pluarUsaha, -jml.bluarUsaha]) | duit }}</q-chip>
            </q-item-label>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import { accRek, company, dtCab, rugilaba } from '../../services/apiList'
import { reactive, computed, onMounted, toRefs } from '@vue/composition-api'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdl: [
        { name: 'tgl', label: 'tgl', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'desk', label: 'Desk', field: row => row.desk, align: 'left' },
        { name: 'debit', label: 'Debit', field: row => row.debit, jml: 'Y', align: 'right' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, jml: 'Y', align: 'right' },
        { name: 'saldo', label: 'Saldo', field: row => row.saldo, align: 'right' }
      ],
      adP: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 7), prd: 'M', kodeCab: [root.$store.state.auth.user.kodeCab], allCab: true },
      alAkun: [],
      selected: [],
      cari: '',
      options: [],
      sawal: 0,
      dtNeraca: [],
      dta: [],
      kelompok: [],
      dtCabang: [],
      cabGrup: [],
      warna: 'primary',
      divisi: '',
      dtComp: [],
      divCab: []
    })
    const jml = computed(() => {
      let x = {}
      x.pendUsaha = dt.dta.filter(y => y.grupAkun === '3').reduce((a, b) => root.$dwn.jumlah([a, b.saldoMidSub]), 0)
      x.biayaHPP = dt.dta.filter(y => y.grupAkun === '4').reduce((a, b) => root.$dwn.jumlah([a, b.saldoMidSub]), 0)
      x.biayaBOP = dt.dta.filter(y => y.grupAkun === '5').reduce((a, b) => root.$dwn.jumlah([a, b.saldoMidSub]), 0)
      x.pluarUsaha = dt.dtNeraca.filter(y => y.grupAkun === '6' && y.subAkun === '61010').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
      x.bluarUsaha = dt.dtNeraca.filter(y => y.grupAkun === '6' && y.subAkun === '61020').reduce((a, b) => root.$dwn.jumlah([a, b.saldo]), 0)
      return x
    })
    onMounted(() => {
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
      accRek()
        .then(res => {
          dt.alAkun = res.data
        })
        .catch(err => console.log(err))
      dtCab()
        .then(({ data }) => {
          dt.cabGrup = data.filter(a => root.$store.state.auth.user.cabGrup.some(s => s === a.kodeCab))
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.dtCabang = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.dtCabang.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        })
        .catch(err => console.log(err))
    })
    const kodeCab = computed(() => {
      let a = ['MAN', 'acc', 'mitra'].some(s => s === root.$store.state.auth.user.userType) ? dt.pr.kodeCab : [root.$store.state.auth.user.kodeCab]
      let s = a.map(d => {
        let nm = dt.dtCabang.find(dd => dd.kodeCab === d)
        return nm
      })
      return s
    })
    const nrc = () => {
      dt.dta = []
      if (dt.pr.tgla) {
        rugilaba({ tgl: dt.pr.tgla, prd: dt.pr.prd, kodeCab: dt.pr.kodeCab })
          .then(res => {
            dt.dtNeraca = res.data.filter(a => Number(a.saldo) !== 0)
            let data = res.data.filter(a => Number(a.saldo) !== 0)
            let y = new Set(data.map(a => a.midSub))
            y.forEach(a => {
              let dtperMidsub = data.filter(b => b.midSub === a)
              let x = {}
              x.midSub = a
              x.namaMidSub = dtperMidsub[0].namaMidSub
              x.saldoMidSub = dtperMidsub.reduce((s, i) => {
                let dss = i.subAkun === '61020' ? -i.saldo : i.saldo
                return root.$dwn.jumlah([s, dss])
              }, 0)
              let z = {}
              z[a] = []
              z.midSub = a
              z.saldoMidSub = x.saldoMidSub
              z.namaMidSub = dtperMidsub[0].namaMidSub
              z.grupAkun = dtperMidsub[0].grupAkun
              let sb = new Set(dtperMidsub.map(ad => ad.subAkun))
              sb.forEach(sba => {
                let dtperSub = dtperMidsub.filter(b => b.subAkun === sba)
                let w = {}
                w[sba] = dtperSub
                w.subAkun = sba
                w.saldoSub = dtperSub.reduce((s, i) => root.$dwn.jumlah([s, i.saldo]), 0)
                w.namaSubAkun = dtperSub[0].namaSubAkun
                w.grupAkun = dtperSub[0].grupAkun
                z[a].push(w)
              })
              dt.dta.push(z)
              // console.log(dta)
            })
            dt.kelompok = y
          })
      }
    }
    const onReset = () => {
      dt.pr = {}
    }
    const toDown = () => {
      let x = {
        judul: `Laporan Laba (Rugi) Periode ${dt.pr.tgla}`,
        dt: dt.dtJurnal,
        cab: kodeCab.value.map(a => a.namaCabang),
        naFile: `Laba(Rugi)_${dt.pr.tgla}_${kodeCab.value.map(a => a.kodeCab)}`
      }
      toExcel(x)
    }
    const toExcel = (x) => {
      const { judul, cab, naFile } = x
      let dtAll = []
      dt.dta.forEach(a => {
        let s = {
          akt: a.grupAkun,
          grupAkun: a.namaMidSub,
          saldo: Number(a.saldoMidSub),
          style: { font: { size: 16, bold: true } }
        }
        dtAll.push(s)
        a[a.midSub].forEach(ss => {
          let ssa = {
            akt: a.grupAkun,
            subAkun: ss.namaSubAkun,
            saldo: Number(ss.saldoSub),
            style: { font: { size: 16, bold: true } }
          }
          dtAll.push(ssa)
          ss[ss.subAkun].forEach(sss => {
            let s3a = {
              akt: a.grupAkun,
              kode: sss.kodeAkun,
              namaAkun: sss.namaAkun,
              saldo: Number(sss.saldo)
            }
            dtAll.push(s3a)
          })
        })
      })
      var wb = new Excel.Workbook()
      var ws = wb.addWorksheet('Laba(Rugi)', { views: [ { showGridLines: false } ] })
      ws.getCell('A1').value = {
        richText: [
          { font: { size: 13, underline: 'double', bold: true }, text: judul }
        ]
      }
      ws.getCell('A1').alignment = { horizontal: 'center' }
      ws.getCell('A2').value = {
        richText: [
          { font: { size: 13, underline: 'double', bold: true }, text: cab }
        ]
      }
      ws.getCell('A2').alignment = { horizontal: 'center' }
      // label judul
      let hdr = [ 'grupAkun', 'subAkun', 'kode', 'namaAkun', 'saldo' ]
      ws.getRow(3).values = ''
      const row = ws.getRow(3)
      row.eachCell(function (cell, colNumber) {
        row.getCell(colNumber).fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          alignment: { wrapText: true },
          fgColor: { argb: '1DE9B6' }
        }
      })
      ws.mergeCells(1, 0, 1, hdr.length)
      ws.mergeCells(2, 0, 2, hdr.length)
      ws.columns = hdr.map(x => {
        const a = {}
        a.key = x
        // a.outlineLevel = 1
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        if (x === 'saldo') { a.style = { numFmt: '#,##0.00' } }
        // if (x.wrap === true) { a.style.alignment.wrapText = true }
        return a
      })
      let pendUsaha = dtAll.filter(a => Number(a.akt) === 3)
      let biayaHPP = dtAll.filter(a => Number(a.akt) === 4)
      let biayaBOP = dtAll.filter(a => Number(a.akt) === 5)
      let pluarUsaha = dtAll.filter(a => Number(a.akt) === 6)
      // ws.addRow(['PENDAPATAN', '', '', '', root.$dwn.jumlah([jml.value.pendUsaha])]).font = { size: 13, underline: 'double', bold: true }
      for (const a in pendUsaha) {
        let rw = ws.addRow(pendUsaha[a])
        if (!pendUsaha[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      ws.addRow()
      // ws.addRow(['BIAYA ATAS PENDAPATAN', '', '', '', root.$dwn.jumlah([jml.value.biayaHPP])]).font = { size: 13, underline: 'double', bold: true }
      for (const a in biayaHPP) {
        let rw = ws.addRow(biayaHPP[a])
        if (!biayaHPP[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      ws.addRow()
      ws.addRow(['LABA/ (RUGI) KOTOR', '', '', '', root.$dwn.jumlah([jml.value.pendUsaha, -jml.value.biayaHPP])]).font = { size: 13, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      for (const a in biayaBOP) {
        let rw = ws.addRow(biayaBOP[a])
        if (!biayaBOP[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      ws.addRow()
      ws.addRow(['LABA/(RUGI) OPERASIONAL', '', '', '', root.$dwn.jumlah([jml.value.pendUsaha, -jml.value.biayaHPP, -jml.value.biayaBOP])]).font = { size: 13, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      for (const a in pluarUsaha) {
        let rw = ws.addRow(pluarUsaha[a])
        if (!pluarUsaha[a].kode) {
          rw.eachCell(function (cell, colNumber) {
            rw.getCell(colNumber).font = { size: 13, underline: 'double', bold: true }
          })
        }
      }
      ws.addRow(['LABA/(RUGI) SETELAH PENDAPATAN DAN BIAYA DILUAR USAHA', '', '', '', root.$dwn.jumlah([jml.value.pendUsaha, -jml.value.biayaHPP, -jml.value.biayaBOP, jml.value.pluarUsaha, jml.value.bluarUsaha])]).font = { size: 13, underline: 'double', bold: true, color: { argb: '1DE9B6' } }
      wb.xlsx.writeBuffer()
        .then(buffer => {
          if (typeof cordova !== 'undefined') {
            root.$q.notify({ message: `File ${naFile}.xlsx tersimpan di folder download...`, color: 'teal' })
            saveBlob2File(`${naFile}.xlsx`, new Blob([buffer]))
          } else {
            FileSaver.saveAs(new Blob([buffer]), `${naFile}.xlsx`)
          }
        })
        .catch(err => console.log(err))
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
    const gantiCab = (x) => {
      dt.pr.kodeCab = []
      if (x) {
        dt.pr.kodeCab = dt.dtCabang.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        nrc()
      } else {
        dt.pr.kodeCab = []
        // dt.divisi = []
      }
    }
    return { ...toRefs(dt), nrc, onReset, toDown, filterFn, saveBlob2File, FileSaver, jml, gantiCab }
  }
}
function saveBlob2File (fileName, blob) {
  var folder = cordova.file.externalRootDirectory + 'Download'
  window.resolveLocalFileSystemURL(folder, function (dirEntry) {
    console.log('file system open: ' + dirEntry.name)
    createFile(dirEntry, fileName, blob)
  }, onErrorLoadFs)
}

function createFile (dirEntry, fileName, blob) {
  // Creates a new file
  dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {
    writeFile(fileEntry, blob)
  }, onErrorCreateFile)
}

function writeFile (fileEntry, dataObj) {
  // Create a FileWriter object for our FileEntry
  fileEntry.createWriter(function (fileWriter) {
    fileWriter.onwriteend = function () {
      console.log('Successful file write...')
    }

    fileWriter.onerror = function (error) {
      console.log('Failed file write: ' + error)
    }
    fileWriter.write(dataObj)
  })
}

function onErrorLoadFs (error) {
  console.log(error)
}

function onErrorCreateFile (error) {
  console.log(error)
}
</script>
