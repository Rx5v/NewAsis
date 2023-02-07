<template>
  <q-card>
    <q-card-section>
      <q-table
        class="dataTrx"
        :data="rekap ? dtRekap : dataServis"
        :columns="rekap ? jdlr : jdl"
        row-key="nomorServis"
        :filter="cari"
        :pagination.sync="hal"
        :expanded.sync="expanded"
        dense>
        <template v-slot:top>
          <div class="col-12 q-table__title text-h6 text-white">Data Selesai Servis</div>
          <q-chip color="blue-6" class="text-white text-bold q-ml-md">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxya" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && (getAll(),$refs.qDateProxya.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
          <q-toggle v-model="rekap" label="Per Partner" class="q-ml-md text-white text-bold" @input="expanded = []"/>
          <q-space/>
          <q-select
            v-model="filt.status"
            :options="statusService"
            multiple
            options-dense
            style="min-width: 250px; max-width: 300px"
            label="Status... "
            :rules="inRul"
            dense
            class="q-mr-sm"
            @input="getAll()"
            lazy-rules/>
          <q-input
            v-model="cari"
            style="width: 250px"
            label="Cari data...">
            <template v-slot:append>
              <q-icon name="search" />
              <q-btn
                flat round dense
                icon="file_download"
                @click="toDown(dataServis, jdl)"
                class="q-ml-md"
                color="primary"
              />
            </template>
          </q-input>
          <q-select
            v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
            v-model="filt.kodeCab"
            :options="cabAll"
            :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
            option-value="kodeCab"
            emit-value
            map-options
            multiple
            options-dense
            style="min-width: 250px; max-width: 300px"
            label="Pilih cabang... "
            :rules="inRul"
            dense
            class="q-ml-sm"
            @input="getAll()"
            lazy-rules/>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" :class="props.expand ? 'bg-cyan-13' : props.row.umur > 60 ? 'bg-red-13' : props.row.umur > 30 ? 'bg-yellow-13' : 'bg-white'">
            <q-td
              v-for="col in props.cols"
              :key="col.name"
              :props="props"
              :class="col.jml === 'Y' ? 'text-right' : 'text-left'"
            >
              <template v-if="col.name==='act'">
                <template v-if="$store.state.auth.user.userType === 'teknisi'">
                  <template v-if="props.row.status === 'Baru'">
                    <q-btn icon="handyman" color="primary" rounded dense outline @click="upD(props.row, 'Proses')">
                      <q-tooltip content-class="bg-purple" :offset="[10, 10]" anchor="center left">
                        Kerjakan
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-else-if="['Proses', 'Part', 'Selesai'].some(a => props.row.status === a)">
                    <q-btn icon="grading" color="primary" rounded dense outline @click="addPt(props.row)" class="q-ml-md">
                      <q-tooltip content-class="bg-purple" :offset="[10, 10]" anchor="center left">
                        Part dan Biaya
                      </q-tooltip>
                    </q-btn>
                  </template>
                </template>
                <template v-else>
                  <template v-if="['Proses', 'Part', 'Selesai'].some(a => props.row.status === a)">
                    <q-btn icon="grading" color="primary" rounded dense outline @click="addPt(props.row)" class="q-ml-md">
                      <q-tooltip content-class="bg-purple" :offset="[10, 10]" anchor="center left">
                        Part dan Biaya
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-if="props.row.status === 'Selesai'">
                    <q-btn icon="flight_takeoff" color="teal" rounded dense outline @click="addPt(props.row)" class="q-ml-md">
                      <q-tooltip content-class="bg-teal-13" :offset="[10, 10]" anchor="center left">
                        Ambil
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-if="props.row.status === 'Selesai'">
                    <q-btn icon="flight_takeoff" color="teal" rounded dense outline @click="addPt(props.row)" class="q-ml-md">
                      <q-tooltip content-class="bg-teal-13" :offset="[10, 10]" anchor="center left">
                        Ambil
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <template v-else-if="props.row.status === 'Konfirm'">
                    <q-btn icon="check_circle_outline" dense color="purple" outline class="q-ml-sm">
                      <q-tooltip content-class="bg-teal text-bold" :offset="[10, 10]" anchor="center left">
                        Konfirm
                      </q-tooltip>
                    </q-btn>
                  </template>
                  <q-btn v-if="['Baru', 'Proses', 'Selesai', 'Part'].some(a => a === props.row.status)" label="Konfirmasi" dense color="purple" outline class="q-ml-sm">
                    <q-popup-edit v-model="props.row.konfirmasi" buttons label-set="Simpan" @save="upD(props.row, 'Konfirm')">
                      <q-input v-model="props.row.konfirmasi" label="Konfirmasi" dense autogrow autofocus @keyup.enter.stop/>
                    </q-popup-edit>
                  </q-btn>
                  <q-btn icon="print" color="warning" rounded dense outline @click="cetak(props.row)" class="q-ml-md"/>
                </template>
                <q-btn icon="info" dense color="yellow-13" rounded outline class="q-ml-md">
                  <q-menu auto-close content-class="bg-grey-12" style="width: 550px" >
                    <q-list separator style="max-width: 600px">
                      <q-item active active-class="bg-orange-2" dense>
                        Aktifitas user...
                      </q-item>
                      <q-separator/>
                      <q-item dense
                        v-for="(i, s) in props.row.userLog" :key="s">
                        <!-- <q-item-section avatar>
                          <q-avatar color="primary" text-color="white">
                            {{ i.aksi ? i.aksi.substr(0, 1) : '' }}
                          </q-avatar>
                        </q-item-section> -->
                        <q-item-section >
                          <q-item-label overline>{{ i.aksi }}</q-item-label>
                          <q-item-label caption>{{ i.user }}</q-item-label>
                        </q-item-section>
                        <q-item-section side top>
                          <q-item-label caption>{{ i.waktu ? new Date(i.waktu).toLocaleString("id-ID", { dateStyle: 'medium' , timeStyle: 'short'}) : '' }}</q-item-label>
                          <q-item-label><q-icon name="info" color="orange" size="sm"/></q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </template>
              <template v-else-if="col.name === 'nom'">
                <q-icon v-if="rekap" size="sm" color="accent" round dense
                  @click="props.expand = !props.expand"
                  :name="props.expand ? 'expand_less' : 'expand_more'" />
                  {{ props.rowIndex + 1 }}
              </template>
              <template v-else-if="col.name==='catatanTeknisi'">
                {{ props.row.catatanTeknisi }}
                <q-popup-edit v-model="props.row.catatanTeknisi" buttons label-set="Simpan" @save="upD(props.row, 'Catatan')">
                  <q-input v-model="props.row.catatanTeknisi" dense autofocus @keyup.enter.stop autogrow/>
                </q-popup-edit>
              </template>
              <template v-else-if="col.name==='namaTeknisi'">
                {{ props.row.namaTeknisi }}
                <q-popup-edit v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)" v-model="props.row.teknisi" buttons label-set="Simpan" @save="upD(props.row, 'Ubah Teknisi')">
                  <q-select v-model="props.row.teknisi" dense :options="dtKar.filter(a => a.kodeCab === props.row.kodeCab)" option-label="namaKaryawan" option-value="kodeKar" options-dense map-options emit-value/>
                </q-popup-edit>
              </template>
              <template v-else-if="col.name==='status'">
                {{ props.row.status }}
                <q-popup-edit v-if="props.row.status !== 'Closed'" v-model="props.row.status" buttons label-set="Simpan" @save="upD(props.row)">
                  <q-select v-model="props.row.status" dense :options="statusService"/>
                </q-popup-edit>
              </template>
              <template v-else>
                <template v-if="col.jml==='Y'">
                  {{ col.value | duit }}
                </template>
                <template v-else>
                  {{ col.value }}
                </template>
              </template>
            </q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props" :class="props.expand && 'bg-yellow-2'">
            <q-td colspan="100%">
              <q-table
                class="detTrx"
                :data="dataServis.filter(a => a.kodePartner === props.row.kodePartner)"
                :columns="jdl"
                row-key="nomorServis"
                selection="multiple"
                :selected.sync="pilih"
                dense/>
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </q-card-section>
    <q-card-section>
      <pivotUI
        :dataTable="dataServis"
        :dtPivot="dtPivot"
        judul="Laporan Service"
      />
    </q-card-section>
    <q-dialog v-model="adP" position="top" full-width>
      <q-card>
        <q-card-actions>
          <q-space/>
          <q-btn round
            icon="close"
            color="red"
            class="text-right"
            v-close-popup/>
        </q-card-actions>
        <q-card-section>
          <div class="row justify-between">
            <div class="col-12 col-md-5">
              <table>
                <tr>
                  <td colspan="3" class="text-bold text-h6">Analisa</td>
                </tr>
                <tr>
                  <td>
                    <q-list v-for="a in analisa.slice(0, 10)" :key="a" dense>
                      <q-checkbox v-model="servis.analisa" :val="a" :label="a" dense @input="updTeknisi(servis)" :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                    </q-list>
                  </td>
                  <td>
                    <q-list v-for="a in analisa.slice(10, 20)" :key="a" dense>
                      <q-checkbox v-model="servis.analisa" :val="a" :label="a" dense @input="updTeknisi(servis)" :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                    </q-list></td>
                  <td valign="top">
                    <q-list v-for="a in analisa.slice(20, 30)" :key="a" dense>
                      <q-checkbox v-model="servis.analisa" :val="a" :label="a" dense @input="updTeknisi(servis)" :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                    </q-list>
                  </td>
                </tr>
              </table>
            </div>
            <div class="col-12 col-md-5">
              <span class="text-bold text-h6">Tindakan</span>
              <br/>
              <div class="q-gutter-sm">
                <q-radio v-model="servis.aksi" val="repair" false-value="N" label="Repair" @input="cekBiaya(servis), updTeknisi(servis)" color="teal"  :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                <q-radio v-model="servis.aksi" val="refill" false-value="N" label="Refill" color="orange" @input="updTeknisi(servis)"  :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                <q-radio v-model="servis.aksi" val="infus" false-value="N" label="Charging/Infus" color="orange" @input="updTeknisi(servis)"  :disable="$store.state.auth.user.userType !== 'teknisi'"/>
                <q-radio v-model="servis.aksi" val="maintenance" false-value="N" label="Maintenance" color="cyan" @input="updTeknisi(servis)"  :disable="$store.state.auth.user.userType !== 'teknisi'"/>
              </div>
              <q-input type="textarea" v-model="servis.tindakan" label="Tindakan" label-color="orange" @blur="updTeknisi(servis)" :disable="$store.state.auth.user.userType !== 'teknisi'"/>
              <q-input type="textarea" v-model="servis.catatanTeknisi" label="Catatan Teknisi" label-color="warning" @blur="updTeknisi(servis)" :disable="$store.state.auth.user.userType !== 'teknisi'"/>
            </div>
          </div>
        </q-card-section>
        <!-- <q-card-actions>
          <q-space/>
          <q-btn color="primary" label="Update" @click="updTeknisi(servis)"/>
        </q-card-actions> -->
        <q-card-section>
          <q-table
            class="dataPR"
            :data="detTrx"
            :columns="jdld"
            row-key="kodeProduk"
            dense
            wrap-cells
            hide-bottom
            :pagination.sync="pg"
            separator="cell">
            <template v-slot:top>
              <q-form
                @submit="ambil(servis, detTrx)"
                @reset="onReset">
                <div class="fit row wrap justify-between items-start content-start">
                  <div class="text-h5 col-12">Biaya dan Part</div>
                  <div class="col-12">
                    <div v-if="servis.status === 'Selesai'"  class="row q-gutter-sm justify-between" >
                      <div class="col-xs-6 col-sm-4 col-md-4">
                        <q-input filled v-model="servis.tglAmbil" label="Tanggal Ambil" dense lazy-rules readonly>
                          <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                              <q-popup-proxy v-if="['MAN','acc','mitra', 'admin'].some(a=> a== $store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                <q-date v-model="servis.tglAmbil" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                        <q-select
                          v-model="servis.ct"
                          label="Pembayaran"
                          color="pink"
                          :options="[{ label: 'Tempo', value: 'tempo'}, { label: 'Tunai', value: 'tunai' }]"
                          emit-value
                          map-options
                          dense
                          options-dense
                          style="width: 250px"
                          @input="gantiByr(servis.ct)"
                          :rules="inRul"
                          />
                      </div>
                      <div class="col-xs-6 col-sm-4 col-md-3">
                        <q-select
                          v-if="servis.ct==='tempo'"
                          v-model="servis.tempo"
                          label="Masa Tempo"
                          color="pink"
                          :options="tempo"
                          emit-value
                          map-options
                          dense
                          options-dense
                          :rules="inRul"
                          />
                        <q-select
                          v-if="servis.ct !== 'tempo'"
                          filled
                          v-model="servis.akunBayar"
                          use-input
                          dense
                          options-dense
                          input-debounce="0"
                          label="Pilih Pembayaran"
                          :options="akunCOA"
                          :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
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
                      </div>
                      <div class="col-xs-6 col-sm-4 col-md-4">
                        <q-input
                          type="textarea"
                          v-model="servis.note"
                          label="Note"
                          dense/>
                      </div>
                    </div>
                  </div>
                  <div class="fit row wrap justify-around items-center content-start">
                    <q-chip color="blue" class="text-white">Nomor Servis: {{servis.nomorServis}}</q-chip>
                    <q-space/>
                    <div class="row">
                      <q-select v-if="servis.status !== 'Closed'" label="Status" v-model="servis.status"
                        :options="['Proses', 'Part', 'Konfirm', 'Selesai', 'Batal']" class="q-ml-md text-bold" style="width: 250px" color="primary" @input="upD(servis)"/>
                    </div>
                    <q-chip color="primary" outline class="text-white text-bold"> {{ servis.status }}</q-chip>
                    <q-btn icon="add" color="pink" round @click="stk = true"/>
                    <q-btn v-if="servis.status === 'Selesai' && $store.state.auth.user.userType !== 'teknisi'" label="Ambil" class="shadow3 text-white q-ml-md" dense type="submit" color="primary"/>
                    <q-chip color="white" class="text-bold" outline>Sales: {{ servis.namaSales }}
                      <q-popup-edit v-if="['MAN','purchase', 'acc', 'admin'].some(a=> a== $store.state.auth.user.userType)" v-model="servis.salesID" buttons label-set="Simpan">
                        <q-select v-model="servis.salesID" dense :options="dtKar.filter(a => a.kodeCab === servis.kodeCab)" option-label="namaKaryawan" option-value="kodeKar" options-dense map-options emit-value/>
                      </q-popup-edit>
                    </q-chip>
                  </div>
                </div>
              </q-form>
            </template>
            <template v-slot:body="props">
              <q-tr>
                <q-td auto-width>{{ props.rowIndex + 1 }}</q-td>
                <q-td>{{ props.row.kodeProduk }}</q-td>
                <q-td>{{ props.row.namaBarang }}</q-td>
                <q-td align="right">{{ props.row.saldo }}</q-td>
                <q-td align="right">{{ props.row.qty }}
                  <q-popup-edit v-model="props.row.qty" @save="onSave(props.row)">
                    <q-input v-model="props.row.qty" dense autofocus counter/>
                  </q-popup-edit>
                </q-td>
                <q-td align="right">{{ props.row.hargaSat | duit}}
                  <q-popup-edit v-model="props.row.hargaSat" @save="onSave(props.row)">
                    <q-input v-model="props.row.hargaSat" dense autofocus counter/>
                  </q-popup-edit>
                </q-td>
                <q-td align="right">{{ props.row.jmlHarga | duit}}
                </q-td>
                <q-td>
                  <!-- <q-btn icon="save" color="teal" rounded dense outline @click="simpan(props.row)"/> -->
                  <q-btn icon="close" color="pink" rounded dense outline @click="dele(props.row)"/>
                </q-td>
              </q-tr>
            </template>
            <template v-slot:bottom-row>
              <q-tr>
                <q-td align="right" colSpan="5">Total</q-td>
                <q-td align="right">{{ detTrx.reduce((a, b) => a + b.jmlHarga, 0) | duit }} </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="stk" seamless position="bottom">
      <q-card style="max-width: 100vw; max-height: 50vh">
        <q-card-section>
          <div class="text-h6 text-blue-13">Pilih Produk</div>
          <q-btn icon="close" color="red" dense v-close-popup class="absolute-top-right"/>
          <q-separator color="purple-13"/>
        </q-card-section>
        <q-card-section>
          <dataStok @dtStok="onpil"/>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorServis }}</span>
          <q-space/>
          <q-btn round
            icon="close"
            color="red"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <template v-if="rekap">
            <q-btn outline label="Tanda Terima" color="primary" @click="printWr(ctk)" />
            <q-btn outline label="Pengambilan" color="primary" @click="printWP(ctk)" />
          </template>
          <template v-else>
            <q-btn outline label="Tanda Terima" color="primary" @click="printA4(ctk)" />
            <q-btn outline label="Pengambilan" color="primary" @click="printW(ctk)" />
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script>
import pivotUI from '../../components/chart/pivotData'
import { computed, reactive, toRefs } from '@vue/composition-api'
import { accRek, addPartService, ambilService, carikar, delDetService, detTrx, dtCab, dtUser, getBankCab, getMerk, inservis, partService, produkService, serviceDone, updServis, upServis, serviceNotif } from '../../services/apiList'
import dataStok from '../../components/stokSatu'
export default {
  components: {
    dataStok,
    pivotUI
  },
  setup (props, { root }) {
    const dt = reactive({
      dtPivot: {
        rows: ['namaTeknisi'],
        cols: ['jnsPrinter', 'namaJenis'],
        vals: ['pointTeknisi']
      },
      expanded: [],
      cari: '',
      confirm: false,
      stk: false,
      repair: false,
      p: {
        tglMasuk: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        merk: '',
        tipeModel: '',
        nomorSN: '',
        kelengkapan: '',
        keluhan: '',
        salesID: root.$store.state.auth.user.eID,
        teknisi: '',
        konfirmasi: '',
        kodeProduk: '',
        produkNo: '',
        pointService: 0,
        kodeJenis: ''
      },
      hal: { rowsPerPage: 10 },
      adS: false,
      filt: {
        kodeCab: [root.$store.state.auth.user.kodeCab],
        tgla: '',
        tglb: '',
        status: ['Selesai', 'Closed', 'Batal']
      },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      cust: { namaPartner: '', kodePartner: null },
      crp: false,
      cabAll: [],
      merk: [],
      produk: [],
      inRul: [ v => !!v || 'Isi data' ],
      ctk: {},
      pilih: [],
      detTrx: [],
      jdld: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, align: 'left' },
        { name: 'saldo', label: 'Stok', field: row => row.saldo, jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, align: 'right' },
        { name: 'jmlHarga', label: 'Jml Harga', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      adP: false,
      pg: { rowsPerPage: 0 },
      dtKar: [],
      akunCOA: [],
      tempo: [
        { label: ' 7 Hari', value: '7' },
        { label: '14 hari', value: '14' },
        { label: '30 hari', value: '30' },
        { label: '60 Hari', value: '60' },
        { label: '90 hari', value: '90' }
      ],
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
        { name: 'tglAmbil', label: 'Tanggal Ambil', field: row => row.tglAmbil, align: 'left' },
        { name: 'konfirmasi', label: 'Konfirmasi', field: row => row.konfirmasi, align: 'left' },
        { name: 'status', label: 'Status', field: row => row.status, sortable: true, align: 'left' },
        { name: 'biaya', label: 'Biaya', field: row => row.biaya, jml: 'Y', align: 'right' },
        { name: 'namaSales', label: 'Sales', field: row => row.namaSales, sortable: true, align: 'left' },
        { name: 'namaTeknisi', label: 'Teknisi', field: row => row.namaTeknisi, sortable: true, align: 'left' },
        { name: 'pointTeknisi', label: 'Point Teknisi', field: row => row.pointTeknisi, sortable: true, align: 'right' },
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
      analisa: [
        'Adaptor',
        'Cartridge',
        'Detektor chip',
        'Ink refill',
        'Main board',
        'Motor/Dinamo',
        'Pasang infus',
        'Print head',
        'Roll',
        'Scaner laser',
        'Sensor encorder disc',
        'Sensor solenoid',
        'Timing belt',
        'Cariage PCB assy',
        'Detector sensor',
        'Engine/Mekanik',
        'Kabel flexible',
        'Maintenance unit',
        'Panel',
        'Pemanas',
        'Reset software',
        'Rumah Catridge',
        'Scaner unit-ADF',
        'Sensor encorder line',
        'service infus',
        'Upgrade software'
      ],
      servis: {
        analisa: [],
        aksi: 'repair',
        tindakan: '',
        catatanTeknisi: '',
        repair: false,
        refill: false,
        maintenance: false
      },
      statusService: [ 'Selesai', 'Closed', 'Batal' ],
      dataAllServis: [],
      dtSales: [],
      pilihSales: []
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
    const getAll = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      serviceDone(dt.filt)
        .then(({ data }) => {
          dt.dataAllServis = data.map(a => {
            if (a.pencapaian) {
              a.pointService = a.pencapaian.pointService
              a.pointRefill = a.pencapaian.pointRefill
              a.pointMaintenance = a.pencapaian.pointMaintenance
              a.totalPointTeknisi = a.pointService + a.pointRefill + a.pointMaintenance
            }
            return a
          })
        })
    }
    const dataServis = computed(() => {
      const a = dt.dataAllServis.filter(a => dt.filt.status.some(s => s === a.status)).length ? dt.dataAllServis.filter(a => dt.filt.status.some(s => s === a.status)) : []
      return a
    })
    dtUser()
      .then(({ data }) => {
        dt.dtKar = data
      })
    dtCab()
      .then(({ data }) => {
        dt.cabAll = data
      })
    getMerk()
      .then(({ data }) => {
        dt.merk = data
      })
    produkService()
      .then(({ data }) => {
        dt.produk = data
      })
    const pilihProduk = (x) => {
      let a = dt.produk.find(s => s.kodeProduk === x.kodeProduk)
      if (a) {
        x.kodeJenis = a.kodeJenis
        x.pointService = a.pointService
      }
    }
    const addServis = (x) => {
      x.kodePartner = dt.cust.kodePartner
      if (dt.cust.kodePartner && x.pointService) {
        inservis(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            onReset()
            getAll()
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
      } else {
        root.$q.notify({ message: 'Isi data pelanggan dan cek point service...', color: 'warning' })
      }
    }
    const partner = (x) => {
      dt.cust = x
      dt.p.kodePartner = x.kodePartner
    }
    const onReset = () => {
      dt.p = {
        tglMasuk: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        merk: '',
        tipeModel: '',
        nomorSN: '',
        kelengkapan: '',
        keluhan: '',
        salesID: root.$store.state.auth.user.eID,
        konfirmasi: '',
        kodeProduk: '',
        produkNo: '',
        teknisi: '',
        pointService: 0,
        kodeJenis: ''
      }
      dt.servis = {
        analisa: [],
        aksi: 'repair',
        tindakan: '',
        catatanTeknisi: '',
        repair: false,
        refill: false,
        maintenance: false
      }
    }
    getAll()
    const cetak = (x) => {
      dt.ctk = x
      dt.confirm = true
    }
    const addPt = (x) => {
      dt.ctk = { ...x }
      dt.ctk.ct = 'tunai'
      dt.ctk.note = `Pembayaran Service ${x.nomorServis}`
      dt.ctk.akunBayar = '110100001'
      dt.ctk.tempo = 0
      dt.servis = { ...dt.servis, ...dt.ctk }
      dt.servis.analisa = JSON.parse(x.analisa) || []
      // dt.servis.aksi = JSON.parse(x.aksi) || []
      partService(x)
        .then(({ data }) => {
          dt.detTrx = data
          dt.adP = true
        })
        .catch(err => {
          root.$q.notify({ message: err.response.data.st, color: 'warning' })
        })
    }
    const onpil = (x) => {
      // x.qty = 1
      if (dt.detTrx.find(a => a.kodeProduk === x.kodeProduk)) {
        root.$q.notify({ message: `${x.namaBarang} sudah di list...`, color: 'warning' })
      } else {
        x.hargaSat = x.hargaRetail
        /* x.jmlHarga = x.hargaRetail
        x.jmlPoint = x.pointMember * x.jmlHarga / 100 */
        x.nomorServis = dt.servis.nomorServis
        dt.detTrx.push({ ...x })
      }
    }
    const onSave = (x) => {
      x.jmlHarga = x.qty * x.hargaSat
      x.jmlKemasan = x.qty
      x.hargaKemasan = x.hargaSat
      x.kemasan = { isi: 1, kemasan: 'Pcs' }
      x.jmlPoint = dt.servis.point === 'Y' ? x.pointMember * x.jmlHarga / 100 : 0
      simpan(x)
      if (dt.detTrx.find(a => a.saldo < Number(a.qty)) && x.jasa !== 'Y') {
        dt.servis.status = 'Part'
        upD(dt.servis, 'Part', 'Part')
      }
    }
    const simpan = (x) => {
      addPartService(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal' })
          if (data.id > 0) x.idserviceKomponen = data.id
        })
        .catch(err => {
          root.$q.notify({ message: err.response.data.st, color: 'warning' })
        })
    }
    const dele = (x) => {
      const index = dt.detTrx.indexOf(x)
      x.kodeCab = dt.servis.kodeCab
      if (x.idserviceKomponen) {
        delDetService(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            partService(x)
              .then(({ data }) => {
                dt.detTrx = data
              })
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
      } else {
        dt.detTrx.splice(index, 1)
      }
    }
    const upD = (x, y, z) => {
      root.$q.dialog({
        title: `Update Nomor Servis : ${x.nomorServis} Status ${z || x.status}<br><span class="text-accent text-italic"> Telp PIC: ${x.telpPIC || x.tlp}</span>`,
        message: '',
        options: {
          type: 'checkbox',
          model: ['T'],
          // inline: true
          items: [
            { label: 'Ya', value: 'Y', color: 'secondary' },
            { label: 'Batal', value: 'B', color: 'red' },
            { label: 'Notif WA', value: 'W', color: 'teal' }
          ],
          isValid: val => {
            let ss = val.filter(v => v === 'Y' || v === 'B')
            return ss.length === 1 && true
          }
        },
        ok: {
          push: true
        },
        html: true,
        persistent: false
      }).onOk(data => {
        if (z) {
          x.status = z
        }
        x.jnsUpdate = y || x.status
        upServis(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            getAll()
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
        if (['Proses', 'Konfirm', 'Selesai', 'Closed'].includes(y) && data.some(a => a === 'W')) {
          serviceNotif(x)
            .then(({ data }) => {
              console.log(data)
              root.$q.notify({ message: data.st, color: data.color })
            })
            .catch(err => {
              root.$q.notify({ message: 'WA Error...', color: 'warning' })
            })
        }
      })
    }
    const ambil = async (x, y) => {
      root.$q.dialog({
        title: `Konfirmasi Pengambilan ${x.nomorServis}`,
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Selesai dengan Nota', value: 'Closed', color: 'secondary' },
            { label: 'Ambil tanpa biaya', value: 'Ambil', color: 'yellow' },
            { label: 'Batal Service', value: 'Batal', color: 'red' },
            { label: 'Tutup', value: 'Tutup', color: 'yellow' }
          ],
          isValid: val => ['Closed', 'Ambil', 'Batal', 'Tutup'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        if (data !== 'Tutup') {
          x.status = data === 'Ambil' ? 'Closed' : data
          x.nota = data === 'Closed' ? 'Y' : 'T'
          x.cabID = x.kodeCab
          const z = {
            hd: { ...x },
            det: [ ...y ]
          }
          ambilService(z)
            .then(async ({ data }) => {
              root.$q.notify({ message: data.st, color: 'teal' })
              getAll()
              dt.adP = false
              onReset()
              dt.ctk = data.ambil
              dt.confirm = true
              if (['Proses', 'Konfirm', 'Selesai', 'Closed'].includes(x.status)) {
                serviceNotif(x)
                  .then(({ data }) => {
                    console.log(data)
                    root.$q.notify({ message: 'Wa terkirim', color: 'teal' })
                  })
                  .catch(err => {
                    root.$q.notify({ message: 'WA Error...', color: 'warning' })
                  })
              }
            })
            .catch(err => {
              root.$q.notify({ message: err.response.data.st, color: 'warning' })
            })
        }
      })
    }
    const gantiByr = (x) => {
      if (x === 'tempo') {
        dt.servis.tempo = 14
        dt.servis.akunBayar = '110500001'
      } else {
        dt.servis.tempo = 0
        dt.servis.akunBayar = '110100001'
      }
    }
    const dtRekap = computed(() => {
      let dta = []
      if (dataServis.value.length > 0) {
        let sp = [...new Set(dataServis.value.map(x => x.kodePartner))] // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = dataServis.value.filter(x => x.kodePartner === sp[i])
          let s = { ...f[0] } // ambil value untuk rekanan
          s.biaya = f.reduce((x, y) => root.$dwn.jumlah([x, y.biaya]), 0)
          dta.push(s) // add to data array
          // tinggal add judulnya
        }
      }
      return dta
    })
    const printA4 = async (x, y) => {
      let ambil = y === 'ambil' ? 'PENGAMBILAN ' : ''
      let wd = window.open('', 'tanda terima', 'resize = 1')
      let html = `<html>
        <title>Tanda Terima Service ${x.nomorServis}</title>
        <style>
        #tss{
          font-size: 14px;

        }
        #tss tr td{
          font-size: 14px;
        }
        .bdr_btm{
          border-bottom: 1px solid #000;
          font-size: 14px;
        }

        .bdr_top{
          border-top: 2px double #000;
          font-size: 14px;
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
        p {
          text-indent: 30px;
          text-align: justify;
          text-justify: inter-word;
        }

        @media print{
          #man {
            visibility:hidden;
          }
          thead.report-header {
            display: table-header-group;
          }
          .pisah {
            page-break-after: always;
          }
          table.report.container {
            page-break-after: always;
            break-before: always;
          }
        }
        </style>
        <body style="font-size: 14px">
          <table width='100%' id="tss" class="report-container" >
            <tr>
              <td valign="top">
                <img src="/statics/app-logo.jpeg" alt="" style="float: left; padding: 10px;width: 90px;">
                <h3>PT ASTON SISTEM INDONESIA</h3>
                Jl Imam Bonjol 28 Salatiga, 50714
                <br>
                +62 298326431
                <br>
                www.astonprinter.com
              </td>
              <td></td>
              <td></td>
              <td align="center" valign="top">
                <h3><b><u>TANDA TERIMA ${ambil}SERVICE</u></b></H3>
                <b>Nomor: ${x.nomorServis}</b>
                <br>
                Salatiga, ${new Date(x.tglMasuk).toLocaleString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td valign="top" width="20%">
                      Nama Pelanggan
                    </td>
                    <td valign="top" width="20%">: ${x.namaPartner}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Email</td>
                    <td valign="top">: ${x.email}</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20%">Telp</td>
                    <td valign="top" width="20%">: ${x.telpPIC}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Alamat</td>
                    <td valign="top">: ${x.alamat}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td rowspan="" colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td valign="top" width="20%">
                      Nama Produk
                    </td>
                    <td valign="top" width="20%">: ${x.namaBarang}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Merk</td>
                    <td valign="top">: ${x.namaMerk}</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20%">Nomor SN</td>
                    <td valign="top" width="20%">: ${x.nomorSN}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Kelengkapan</td>
                    <td valign="top">: ${x.kelengkapan}</td>
                  </tr>
                  <tr>
                    <td valign="top" width="20%">Produk No.</td>
                    <td valign="top" width="20%">: ${x.produkNo}</td>
                    <td valign="top" width="20%"></td>
                    <td valign="top" width="10%">Keluhan</td>
                    <td valign="top">: <i><b>${x.keluhan}</b></i></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4"><hr>
                <span style="font-size:11px">
                  Pernyataan : Saya serahkan barang tsb kepada aston, apabila dalam waktu 2 bulan belum saya ambil maka saya berikan barang tsb kepada aston
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4"><br>
                <table style="font-size:12px;" align="center" width="100%">
                  <tbody>
                    <tr>
                      <th>
                        <div style="
  border: 2px solid;">
  Catatan:
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  <br/>
  </div>
                      </th>
                      <th align="center">Diterima Oleh,<br>Admin<br><br><br><br>(${x.namaSales})</th>
                      <th align="center">Diserahkan Oleh,<br>Pelanggan<br><br><br><br>( &nbsp; ${x.namaPIC} &nbsp; )</th>
                    </tr>
                  </tbody></table>
                </td>
                </tr>
            <tr>
              <td colspan="4" >
                <div>*** Ketentuan :
                  <br>
                  ${x.note || ''}
                  <br>
                  Dikerjakan Oleh: ${x.namaTeknisi}
                  <p style="text-align:'center'">
                  </p>

                  <br>
                  </p>
                </div>
              </td>
            </tr>
        </table>
        </body>
        </html>`
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
    const printW = async (x) => {
      if (x.status === 'Batal') {
        printA4(x, 'ambil')
      } else {
        let { data } = await getBankCab(x.kodeCab)
        let bankCabanga = data.map(s => {
          let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
          return ss
        })
        let bankCabang = await bankCabanga.toString().replace(/,/g, '')
        let cabA = dt.cabAll.find(a => a.kodeCab === x.kodeCab)
        let detail = await detTrx(x)
        let wd = window.open('', 'transPrint', 'resize = 1')
        let html = `<html><head>`
        let dtPrint = `
          <title>Transaksi ${x.nomorBukti}</title>
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
                                  <b>NOTA BIAYA SERVICE</b>
                              </td>
                          </tr>
                          <tr>
                              <td width="35%">ID Service</td>
                              <td>: ${x.nomorServis}</td>
                          </tr>
                          <tr>
                              <td width="35%">ID Invoice</td>
                              <td>: <b>${x.nomorBukti || 'Belum ada tagihan'}</b></td>
                          </tr>
                          <tr>
                              <td>Tanggal </td>
                              <td>: ${x.tglAmbil ? new Date(x.tglAmbil).toLocaleString('en-GB').slice(0, 10) : new Date().toLocaleString('en-GB')}</td>
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
                              <td width='15%'>Nama Pelanggan</td>
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
                              <td>: ${x.telpPIC || ''}</td>
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
              <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
              <td align='right'>${new Intl.NumberFormat('en').format(Number(det.jmlHarga / det.qty).toFixed(2))}</td>
              <td align='right'>${new Intl.NumberFormat('en').format(Number(det.jmlHarga).toFixed(2))}</td>
          </tr>`
        })
        let biaya = detail.data.reduce((s, i) => root.$dwn.jumlah([s, i.jmlHarga]), 0)
        let ttp = `</tbody>
            </table>
                  </td>
              </tr>
              <tr>
                  <td colspan="4">
                      <table width='100%' >
                          <tr>
                              <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                                Pembayaran dapat dilakukan melalui:
                                <ul>
                                  ${bankCabang}
                                </ul>
                                Catatan tambahan : ${x.note || ''}
                                <br/>
                                Nama Teknisi : ${x.namaTeknisi}
                              </td>`
        let ttpNote = `<td align="right" valign="top">
                                  <table width="100%" >
                                    <tr>
                                        <td align='right'><b>Jumlah Total</b></td>
                                        <td align='right' style="text-decoration : underline; text-decoration-style: double;"><b>${new Intl.NumberFormat('en').format(Number(biaya).toFixed(2))}</b></td>
                                    </tr>
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
                              <td width='33.3%' align='center'>
                                  Diambil Oleh<br/>
                                  <br/><br/><br/><br/>
                                  ${x.namaPartner}
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
              <button type=button onclick='window.print();'>Cetak Nota Service</button>
          </div>`
        html += dtPrint + dtDet + ttp + ttpNote + '</body></html>'
        if (typeof cordova !== 'undefined') {
          cordova.plugins.printer.print(html)
        } else {
          wd.document.open()
          wd.document.write(html)
          wd.document.close()
        }
      }
    }
    const printWP = async (x) => {
      let { data } = await getBankCab(x.kodeCab)
      let pilih = dt.pilih.filter(s => s.kodePartner === x.kodePartner)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let cabA = dt.cabAll.find(a => a.kodeCab === x.kodeCab)
      let detail = []
      pilih.forEach(async (a, i) => {
        let { data } = await detTrx(a)
        let ss = data.map(s => {
          s.nomorBukti = a.nomorBukti
          s.namaTeknisi = a.namaTeknisi
          return s
        })
        detail.push(...ss)
        if (i === pilih.length - 1) {
          let wd = window.open('', 'transPrint', 'resize = 1')
          let html = `<html><head>`
          let dtPrint = `
            <title>Transaksi ${x.nomorBukti}</title>
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
                                    <b>NOTA BIAYA SERVICE</b>
                                </td>
                            </tr>
                            <tr>
                                <td>Tanggal </td>
                                <td>: ${x.tglAmbil ? new Date(x.tglAmbil).toLocaleString('en-GB').slice(0, 10) : new Date().toLocaleString('en-GB')}</td>
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
                                <td width='15%'>Nama Pelanggan</td>
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
                                <td>: ${x.telpPIC || ''}</td>
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
                                <td class="bdr_btm">Nomor Service</td>
                                <td class="bdr_btm">Nomor Invoice</td>
                                <td class="bdr_btm">Teknisi</td>
                                <td width='10%' class="bdr_btm" align='right'>QTY</td>
                                <td width='10%' class="bdr_btm" align='right'>Harga</td>
                                <td width='10%' class="bdr_btm" align='right'>Jumlah</td>
                            </tr>
                          </thead>
                          <tbody>`
          let dtDet = ''
          detail.forEach((det, u) => {
            dtDet += `<tr>
                <td>${u + 1}</td>
                <td>${det.namaBarang}</td>
                <td>${det.nomorServis}</td>
                <td>${det.nomorBukti}</td>
                <td>${det.namaTeknisi}</td>
                <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
                <td align='right'>${new Intl.NumberFormat('en').format(Number(det.jmlHarga / det.qty).toFixed(2))}</td>
                <td align='right'>${new Intl.NumberFormat('en').format(Number(det.jmlHarga).toFixed(2))}</td>
            </tr>`
          })
          let ttp = `</tbody>
              </table>
                    </td>
                </tr>
                <tr>
                    <td colspan="4">
                        <table width='100%' >
                            <tr>
                                <td style='border : 1px dotted #000000; padding:10px' width='60%'>
                                  Pembayaran dapat dilakukan melalui:
                                  <ul>
                                    ${bankCabang}
                                  </ul>
                                  Catatan tambahan : ${x.note || ''}
                                </td>`
          let ttpNote = `<td align="right" valign="top">
                                    <table width="100%" >
                                      <tr>
                                          <td align='right'><b>Jumlah Total</b></td>
                                          <td align='right' style="text-decoration : underline; text-decoration-style: double;"><b>${new Intl.NumberFormat('en').format(Number(detail.reduce((a, b) => root.$dwn.jumlah([a, b.jmlHarga]), 0)).toFixed(2))}</b></td>
                                      </tr>
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
                                <td width='33.3%' align='center'>
                                    Diambil Oleh<br/>
                                    <br/><br/><br/><br/>
                                    ${x.namaPartner}
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
                <button type=button onclick='window.print();'>Cetak Nota Service</button>
            </div>`
          html += dtPrint + dtDet + ttp + ttpNote + '</body></html>'
          if (typeof cordova !== 'undefined') {
            cordova.plugins.printer.print(html)
          } else {
            wd.document.open()
            wd.document.write(html)
            wd.document.close()
          }
        }
      })
    }
    const printWr = async (x) => {
      let cabA = dt.cabAll.find(a => a.kodeCab === x.kodeCab)
      let detail = dataServis.value.filter(a => dt.pilih.some(s => s.nomorServis === a.nomorServis && a.kodePartner === x.kodePartner))
      let wd = window.open('', 'transPrint', 'resize = 1')
      let html = `<html><head>`
      let dtPrint = `
        <title>Transaksi ${x.nomorBukti}</title>
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
                                <b>TANDA TERIMA SERVICE</b>
                            </td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${new Date(x.tglMasuk).toLocaleString('en-GB').slice(0, 10)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='15%'>Nama Pelanggan</td>
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
                            <td>: ${x.telpPIC || ''}</td>
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
                            <td class="bdr_btm">Nomor Servis</td>
                            <td class="bdr_btm">Nama Produk</td>
                            <td class="bdr_btm">Nomor SN</td>
                            <td class="bdr_btm">Keluhan</td>
                            <td class="bdr_btm">Kelengkapan</td>
                        </tr>
                      </thead>
                      <tbody>`
      let dtDet = ''
      detail.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.nomorServis}</td>
            <td>${det.namaBarang}</td>
            <td>${det.nomorSN}</td>
            <td>${det.keluhan}</td>
            <td>${det.kelengkapan}</td>            
        </tr>`
      })
      let ttp = `</tbody>
          </table>
                </td>
            </tr>
            <tr>
              <td colspan="4">
                <table width='100%' >
                  <tr>
                    <td style='border : 1px dotted #000000; padding:10px' width='100%'>
                      <span style="font-size:11px">
                        Pernyataan : Saya serahkan barang tsb kepada aston, apabila dalam waktu 2 bulan belum saya ambil maka saya berikan barang tsb kepada aston
                      </span>
                    </td>`
      let ttpNote = `<td align="right" valign="top">
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
                      Diserahkan Oleh<br/>
                      <br/><br/><br/><br/>
                      ${x.namaPIC}
                    </td>
                    <td width='33.3%' align='center'>
                    </td>
                    <td width='33.3%' align='center'>
                      Diterima Oleh<br/>
                      <br/><br/><br/><br/>
                      ${x.namaSales}
                    </td>
                  </tr>                        
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="4" >
                <div>*** Ketentuan :
                  <br>
                  ${x.note || ''}
                  <p style="text-align:'center'">
                  </p>
                  <br>
                  Nama Teknisi: ${x.namaTeknisi}
                  <br>
                  </p>
                </div>
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
            <button type=button onclick='window.print();'>Cetak Nota Service</button>
        </div>`
      html += dtPrint + dtDet + ttp + ttpNote + '</body></html>'
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
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
    const updTeknisi = (x) => {
      if (root.$store.state.auth.user.userType !== 'teknisi') {
        root.$q.notify({ message: 'Hanya teknisi yang bisa update...', color: 'warning' })
      } else {
        const y = { ...x }
        y.nomorServis = dt.servis.nomorServis
        y.analisa = JSON.stringify(x.analisa)
        // y.aksi = JSON.stringify(x.aksi)
        updServis(y)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            getAll()
            // dt.adP = false
            // onReset()
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
      }
    }
    const cekBiaya = (x) => {
      const ck = dt.detTrx.find(a => a.kodeProduk === x.kodeProduk)
      if (x.repair === 'Y' && !ck) {
        const biaya = {
          nomorServis: x.nomorServis,
          kodeProduk: x.kodeProduk,
          qty: 1,
          hpp: 0,
          hargaSat: x.hargaRetail,
          jmlHarga: x.hargaRetail,
          jmlPoint: x.hargaRetail * x.pointMember / 100,
          namaBarang: x.namaBarang
        }
        simpan(biaya)
        dt.detTrx.push(biaya)
      } else if (x.repair === 'N' && ck) {
        dt.detTrx.splice(dt.detTrx.indexOf(ck), 1)
        dele(ck)
      }
    }
    const toDown = (y, z) => {
      let cabang = dt.filt.kodeCab.map(a => dt.cabAll.find(s => s.kodeCab === a).namaCabang)
      y.map((a, i) => {
        a.nom = i + 1
        return a
      })
      let x = {
        judul: `Data Service Cabang ${cabang} Periode ${dt.filt.tgla} s/d ${dt.filt.tglb} `,
        dt: y,
        hdr: z,
        naFile: `LapService`
      }
      root.$dwn.toExcel(x)
    }
    return {
      toDown,
      ...toRefs(dt),
      cekBiaya,
      updTeknisi,
      filterFn,
      gantiByr,
      addServis,
      getAll,
      partner,
      onReset,
      cetak,
      printA4,
      printW,
      printWr,
      addPt,
      onpil,
      onSave,
      simpan,
      dele,
      upD,
      ambil,
      dtRekap,
      dataServis,
      printWP,
      filterKn,
      pilihProduk
    }
  }
}
</script>
<style lang="sass" scoped>
.detTrans
  /* max height is important */
  .q-table__middle
    max-height: 600px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #ffff

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
</style>
