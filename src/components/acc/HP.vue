<template>
  <div>
    <q-card>
      <q-card-actions>
            <div class="col-12 q-table__title text-blue">Data {{ jenis }}
            <q-select
              v-if="['MAN','acc','purchase'].some(a=> a== $store.state.auth.user.userType)"
              v-model="kodeCab"
              :options="cabGrup"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              options-dense
              emit-value
              map-options
              class="absolute-top-right text-blue"
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              @input="getHP"
              lazy-rules/>
              </div>
          </q-card-actions>
          <q-card-actions class="justify-between">
            <q-toggle
              label="Antar Cabang"
              color="red"
              false-value="N"
              true-value="Y"
              v-model="ac"
              checked-icon="check"
              unchecked-icon="clear"
              @input="getHP()"/>
            <q-select
              v-model="kodeSubAkun"
              dense
              options-dense
              label="Pilih Jenis HP"
              :options="pilSub"
              style="width: 250px"
              @input="getHP(), filt.kodeAkun =''"
              class="q-ml-sm"
            />
            <q-toggle
              label="Per COA"
              color="pink"
              v-model="perCoA"
              keep-color
              readonly class="q-ml-sm"
              @change="filt.kodeAkun=''"
            />
            <q-select
              filled
              v-if="perCoA"
              v-model="filt.kodeAkun"
              use-input
              dense
              options-dense
              input-debounce="0"
              label="Akun COA"
              :options="akunPerCoA"
              :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
              option-value="kodeAkun"
              :rules="inRul"
              map-options
              emit-value
              style="width: 350px"
            />
            <q-input filled v-model="jh.tgl" label="Tanggal" dense lazy-rules :rules="inRul"  class="q-ml-sm" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="jh.tgl" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-select
              v-model="jh.overDue"
              :options="['All', 'Over Due', 'Non']"
              options-dense
              dense
              style="width: 200px"
              label="Overdue"/>
            <q-toggle
              label="Rekap"
              color="pink"
              v-model="rekap"
              keep-color
              readonly class="q-ml-sm"
            />
            <q-select
              v-model="jh.status"
              :options="sto"
              options-dense
              dense
              @input="getHP()"
              label="Status"/>
            <q-input dense debounce="300" v-model="cari" placeholder="Search" class="q-ml-sm">
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn
              flat round dense
              icon="add_circle"
              @click="adHP=true"
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
            <q-btn
              flat dense
              icon="file_download"
              @click="toDownAll"
              class="q-ml-md"
              color="orange-7"
              label="Download All Cabang"
            />
            <div class="q-gutter-sm">
              <span class="text-h6 q-ml-md">Antar Divisi</span>
              <q-checkbox v-model="filt.antarDivisi" val="Y" label="Ya" color="pink-3" keep-color/>
              <q-checkbox v-model="filt.antarDivisi" val="N" label="Bukan" color="yellow-3" keep-color/>
            </div>
          </q-card-actions>
        </q-card>
    <q-table
      class="dataTrx"
      :data="detHP"
      :columns="jdl"
      row-key="iddetJur"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
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
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-icon size="sm" color="accent" round dense
              @click="props.expand = !props.expand,getByr(props.row,'ok',props.expand)"
              :name="props.expand ? 'expand_less' : 'expand_more'" />
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <template v-if="col.name==='act'">
              <q-btn v-if="props.row.sisa !== '0'" class="q-ml-md" icon="queue" dense outline color="red" @click="addByr(props.row)" />
              <q-btn v-if="rekap" icon="print" class="q-ml-md" dense outline color="orange" @click="printRekap(props.row)" />
            </template>
            <template v-else-if="col.name === 'nomorSuratJalan'">
              {{ col.value }} <q-btn v-if="!rekap" icon="fas fa-shipping-fast" class="q-ml-md" dense outline color="teal-13" @click="cetak(props.row)" />
            </template>
            <template v-else-if="col.jml==='Y'">
              {{ col.value | duit }}
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="rekap ? dtJurnal.filter(x=> x.kodeRekan === props.row.kodeRekan).length>0 : detByr.filter(x=> x.nomorReff === props.row.nomorJurnal).length>0">
              <q-markup-table
                dense
                bordered>
                <q-tr>
                  <q-th v-for="(jd, i) in jdlB" :key="i"
                    :align="jd.align || 'left'">
                    {{ jd.label }}</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt) in (rekap ? dtJurnal.filter(x=> x.kodeRekan === props.row.kodeRekan) : detByr.filter(x=> x.nomorReff === props.row.nomorJurnal))"
                  :key="dt.iddetJur"
                  class="text-italic">
                  <q-td auto-width>{{ dt.tgl }}</q-td>
                  <q-td auto-width>{{ dt.nomorJurnal }}</q-td>
                  <q-td >{{ dt.judulJurnal }}</q-td>
                  <template v-if="rekap">
                    <q-td align="right">{{ dt.nilai | duit }}</q-td>
                    <q-td align="right">{{ dt.tbayar | duit }}</q-td>
                    <q-td align="right">{{ dt.sisa | duit }}</q-td>
                  </template>
                  <template v-if="!rekap">
                    <q-td >{{ dt.namaAkun }}</q-td>
                    <q-td align="right">{{ dt.nilai | duit }}</q-td>
                    <q-td auto-width>{{ dt.status }}</q-td>
                  </template>
                  <q-td auto-width>
                    <q-btn v-if="props.row.status !='B' && jhp === 'P'" dense icon="print" color="warning" @click="cek(dt, props.row)"/>
                  </q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              <span class="text-orange-13 text-italic">Belum ada pembayaran</span>
            </template>
          </q-td>
        </q-tr>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-td colspan="2">Total {{ jenis}}</q-td>
          <q-td class="text-right">{{ total.nilai | duit}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Bayar</q-td>
          <q-td class="text-right">{{ total.tbayar | duit}}</q-td>
        </q-tr>
        <q-tr>
          <q-td colspan="2">Total Sisa</q-td>
          <q-td class="text-right">{{ total.sisa | duit}}</q-td>
        </q-tr>
      </template>
    </q-table>
    <q-table
      :data="rkpJurReff"
      :columns="jdljb"
      row-key="nomorJurnal"
      title="Referensi pembayaran dari cabang lain"
      class="q-mt-md text-teal text-italic">
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            auto-width
          >
          <template v-if="col.name === 'no'">
            <q-icon size="sm" color="accent" round dense
              @click="props.expand = !props.expand"
              :name="props.expand ? 'expand_less' : 'expand_more'" />
          </template>
          <template v-else>
            {{ col.value }}
          </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="jurReff.length">
              <q-markup-table
                dense
                bordered>
                <q-tr>
                  <q-th v-for="(jd, i) in jdljb" :key="i"
                    :align="i === 4 ? 'right' : 'left'">
                    {{ jd.label }}</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt, s) in jurReff.filter(a => a.nomorJurnal === props.row.nomorJurnal)"
                  :key="dt.iddetJur"
                  class="text-italic">
                  <q-td auto-width>{{s + 1 }}</q-td>
                  <q-td auto-width>{{ dt.tgl }}</q-td>
                  <q-td auto-width>{{ dt.nomorJurnal }}</q-td>
                  <q-td >{{ dt.judulJurnal }}</q-td>
                  <q-td >{{ dt.nomorBukti }}</q-td>
                  <q-td align="right">{{ dt.nilai | duit }}</q-td>
                  <q-td >{{ dt.cabLain }}</q-td>
                  <q-td >{{ dt.namaCabang }}</q-td>
                  <q-td auto-width>
                    <q-btn icon="done_all" color="teal" fab-mini outline @click="kopi(dt)">
                      <q-tooltip content-class="bg-teal" :offset="[10, 10]" anchor="center left">
                        Akui Pembayaran
                      </q-tooltip>
                    </q-btn>
                  </q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              <span class="text-orange-13 text-italic">Belum ada pembayaran</span>
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <q-dialog
      v-model="adB"
      persistent>
      <q-card style="width: 400px; max-width: 80vw;">
        <q-card-section class="bg-secondary text-white">Pembayaran {{ jhp==='P' ? 'Piutang' : 'Hutang'}}</q-card-section>
        <q-form
          ref="form"
          @submit="simpan(j)"
          @reset="onReset"
          class="q-gutter-md">
          <q-card-section class="column">
            <q-input filled v-model="j.tgl" label="Tanggal" dense lazy-rules :rules="inRul" readonly>
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy v-if="['MAN','acc','mitra'].some(a=> a==$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                    <q-date v-model="j.tgl" @input="() => $refs.qDateProxy.hide()" :options="optionsFn" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
            <q-input
              :value="namaPartner"
              label="Nama Partner"/>
            <q-input
              v-model="j.judulJurnal"
              :rules="inRul"
              dense
              label="Judul Transaksi"/>
            <q-chip color="red" outline>Belum Bayar : {{ j.sisa | nomer }}</q-chip>
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
            <q-select
              v-if="ac==='Y'"
              filled
              v-model="j.kodeAkunD"
              use-input
              dense
              options-dense
              input-debounce="0"
              :label="jhp === 'P' ? 'Akun Pengirim' : 'Akun Penerima'"
              :options="akunKas"
              :option-label="(item) => item && item.kodeAkun + ' ' + item.namaAkun"
              option-value="kodeAkun"
              :rules="inRul"
              map-options
              emit-value
              style="width: 250px"
            />
            <q-chip color="green" outline>
              Jumlah Bayar {{ j.nilai | duit}}
              <q-popup-edit v-model="j.nilai">
                <q-input
                  v-model="j.nilai"
                  :rules="inRul"
                  type="number"
                  label="Nilai"
                  @input="hit(j)"/>
              </q-popup-edit>
            </q-chip>
            <q-checkbox v-model="j.lunas" :label="jhp ==='P' ? 'Potongan' : 'Biaya Admin Bank'" @input="j.biaya=0, hit(j)"/>
            <q-chip color="green" outline v-if="j.lunas">
              {{ j.biaya | duit }}
              <q-popup-edit v-model="j.nilai">
                <q-input
                  v-model="j.biaya"
                  :rules="inRul"
                  type="number"
                  label="Biaya"
                  @input="j.biaya= j.biaya > j.sbbiaya && jhp === 'P' ? 0 : j.biaya, hit(j)"/>
              </q-popup-edit>
            </q-chip>
            <q-chip color="red" outline>Sisa {{ jenis }} :{{ j.sisaHP | nomer }} </q-chip>
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
      full-width
      persistent
      v-model="adBa">
      <q-card>
        <q-card-section>
          <bayar :detBayar="muldet" :jhp="jhp" @ttp="tutup" :cab="kodeCab"/>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="adHP"
      full-width>
      <addHP :jhp="jhp"/>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.x.nomorJurnal }}</span>
          <q-space/>
          <q-btn round
            icon="close"
            color="red"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Cetak A4" color="primary" @click="printA4(ctk)" />
          <q-btn outline label="Cetak Kertas Ply" color="primary" @click="printW(ctk)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="trx"
      full-width>
      <dataTransaksi :jh="hdTrx" :edDet="detailTrx"/>
    </q-dialog>
    <q-dialog v-model="pilPrint" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu cek : #{{ nota.nomorBukti }}</span>
          <q-space/>
          <q-btn round
            size="small"
            icon="close"
            color="red"
            class="absolute-top-right"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Detail" color="primary" @click="cekTrx(nota)" />
          <q-btn outline label="Invoice A4" color="primary" @click="printNota(nota)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { subAkun, dtHP, cekByr, accRek, bayarHP, dtCab, detKas, cekBayarReff, getBankCab, detTrx, transaksi } from '../../services/apiList'
import bayar from './tHutang'
import addHP from './addHP'
import dataTransaksi from '../detTrx'
import { computed, reactive, toRefs, watch } from '@vue/composition-api'
export default {
  // name: 'PageName',
  props: {
    jhp: {
      type: String,
      default: 'P'
    }
  },
  components: {
    bayar,
    addHP,
    dataTransaksi
  },
  setup (props, { root }) {
    const dt = reactive({
      dtJurnal: [],
      jdld: [
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left', sortable: true },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left', sortable: true },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left', sortable: true },
        { name: 'nomorSuratJalan', label: 'Invoice', field: row => row.nomorSuratJalan, align: 'left', sortable: true },
        { name: 'nomorPO', label: 'Nomor PO', field: row => row.nomorPO, align: 'left', sortable: true },
        { name: 'umur', label: 'Umur(hari)', field: row => row.umur, align: 'right', sortable: true },
        { name: 'tempo', label: 'Tempo', field: row => row.tempo, align: 'right', sortable: true },
        { name: 'overDue', label: 'Overdue(hari)', field: row => row.overDue, align: 'right', sortable: true },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', align: 'right', sortable: true },
        { name: 'tbayar', label: 'Terbayar', field: row => row.tbayar, jml: 'Y', align: 'right', sortable: true },
        { name: 'sisa', label: 'Sisa', field: row => row.sisa, jml: 'Y', align: 'right', sortable: true },
        { label: 'Kode Partner', name: 'kodeRekan', field: row => row.kodeRekan, align: 'left', sortable: true },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left', sortable: true },
        { name: 'Oleh', label: 'Nama Sales', field: row => row.Oleh, align: 'left, sortable: true' },
        { name: 'status', label: 'status', field: row => row.status, align: 'left', sortable: true },
        { name: 'act', label: 'act', align: 'left' }
      ],
      jdlr: [
        { label: 'Kode Partner', name: 'kodeRekan', field: row => row.kodeRekan, align: 'left' },
        { label: 'Nama Partner', name: 'namaPartner', field: row => row.namaPartner, align: 'left' },
        { label: 'Total', name: 'nilai', field: row => row.nilai, jml: 'Y', align: 'right' },
        { label: 'Bayar', name: 'tbayar', field: row => row.tbayar, jml: 'Y', align: 'right' },
        { label: 'Sisa', name: 'sisa', field: row => row.sisa, jml: 'Y', align: 'right' },
        { name: 'act', label: 'act', align: 'left' }
      ],
      jdljb: [
        { name: 'no', label: 'No', align: 'left' },
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left', sortable: true },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left', sortable: true },
        { name: 'desk', label: 'Judul', field: row => row.desk, align: 'left', sortable: true },
        { name: 'nomorBukti', label: 'Invoice', field: row => row.nomorBukti, align: 'left', sortable: true },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', format: val => new Intl.NumberFormat('en').format(Number(val).toFixed(0)), align: 'right', sortable: true },
        { label: 'Kode Cab.', name: 'cabLain', field: row => row.cabLain, align: 'left', sortable: true },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left', sortable: true },
        { name: 'act', label: 'act', align: 'left' }
      ],
      jurReff: [],
      detByr: [],
      adP: false,
      adHP: false,
      inRul: [ v => !!v || 'Isi data' ],
      jh: { tgl: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        status: {
          label: 'Open',
          value: 'O'
        },
        overDue: 'All' },
      selected: [],
      cari: '',
      adB: false,
      adBa: false,
      subAkun: [],
      kodeSubAkun: null,
      alAkun: [],
      rekap: false,
      perCoA: false,
      filt: { kodeAkun: '', antarDivisi: ['Y', 'N'] },
      ac: 'N',
      j: { },
      namaPartner: '',
      dtCabang: [],
      kodeCab: root.$store.state.auth.setCabang,
      hal: { rowsPerPage: 10 },
      sto: [
        { label: 'Open', value: 'O' },
        { label: 'Lunas', value: 'T' }
      ],
      muldet: [],
      akunB: [],
      confirm: false,
      ctk: { x: '', y: '' },
      trx: false,
      hdTrx: {},
      detailTrx: [],
      pilPrint: false,
      nota: {}
    })
    const jdlB = computed(() => {
      const a = dt.rekap ? [
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', format: row => new Intl.NumberFormat('en').format(Number(row).toFixed(0)), align: 'right' },
        { name: 'tbayar', label: 'Terbayar', field: row => row.tbayar, jml: 'Y', format: row => new Intl.NumberFormat('en').format(Number(row).toFixed(0)), align: 'right' },
        { name: 'sisa', label: 'Sisa', field: row => row.sisa, jml: 'Y', format: row => new Intl.NumberFormat('en').format(Number(row).toFixed(0)), align: 'right' },
        { name: 'act', label: 'act', align: 'left' }
      ] : [
        { name: 'tgl', label: 'Tanggal', field: row => row.tgl, align: 'left' },
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul', field: row => row.judulJurnal, align: 'left' },
        { name: 'kodeAkun', label: 'Akun', field: row => row.namaAkun, align: 'left' },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, jml: 'Y', format: row => new Intl.NumberFormat('en').format(Number(row).toFixed(0)), align: 'right' },
        { name: 'status', label: 'Status', field: row => row.status, align: 'left' },
        { name: 'act', label: 'act', align: 'left' }
      ]
      return a
    })
    const getHP = () => {
      if (!dt.kodeSubAkun) {
        root.$q.notify({ message: `Pilih jenis ${jenis.value} dulu... `, color: 'deep-orange-7' })
      } else {
        let x = { jhp: props.jhp, kodeSubAkun: dt.kodeSubAkun.value, tgl: dt.jh.tgl, ac: dt.ac, kodeCab: dt.kodeCab, status: dt.jh.status.value }
        dtHP(x)
          .then(res => {
            let a = res.data.map(u => {
              let y = u
              y.tbayar = u.tbayar
              return y
            })
            dt.dtJurnal = a
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.kodeCab = val
      getHP()
      /* if (dt.jh.kodeAkun) {
        cekSal(dt.jh.kodeAkun)
      } */
    })
    const printNota = async (y) => {
      // let bankCabang = ''
      y.nomorBukti = y.nomorSuratJalan
      y.jnsTrx = props.jhp === 'H' ? 'B' : 'J'
      let x = await transaksi(y)
      let { data } = await getBankCab(y.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let cabA = props.jhp === 'H' && x.data.ac === 'Y' ? dt.dtCabang.find(a => a.kodeCab === x.data.cabLain) : dt.dtCabang.find(a => a.kodeCab === y.cabID)
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let detail = await detTrx(y)
      let tdpp = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.dpp, -b.hrgRetur]), 0)
      let tppn = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.ppn]), 0)
      let wd = window.open('', 'InvoiceA4', 'resize = 1')
      let html = `<html>
        <title>Cetak Nota </title>
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
                      <img src="/statics/logo/${cabA.kodeCab}.png" alt="" style="width:8%">
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
                      <b><i>${props.jhp === 'P' ? 'Customers' : 'Supplier'}</i></b>
                    </td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">${y.namaPartner}</td>
                  </tr>
                  <tr>
                    <td width='100%' colspan="4">
                      ${y.alamat || ''}
                    </td>
                  </tr>

                  <tr>
                    <td width='100%' colspan="4">${y.tlp || ''}</td>
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
                        <b>INVOICE #${y.nomorBukti}</b>
                      </h1>
                    </td>
                    <td align="right">
                      <b>Date Ordered:</b><br/>${new Date(x.data.tglKirim).toLocaleString('en-GB').slice(0, 10)}
                    </td>
                  </tr>
                  <tr>
                    ${props.jhp === 'P' ? '<td width="15%"><b>Sales person:</b><br/>' + x.data.namaSales + `</td><td><b>Payment:</b><br/>${x.data.pembayaran}</td> ` : ''}
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
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.jmlKemasan).toFixed(2))} ${det.kemasan.kemasan}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.hargaKemasan).toFixed(2))}</td>
          <td align="right" style='text-align: right'>${new Intl.NumberFormat('en').format(Number(det.dpp - det.hrgRetur).toFixed(2))}</td>
        </tr>`
      })
      let ttpj = `<table width='100%' >
                  <tr>
                    <td width='60%' valign="top">
                      <b>
                        <i>
                          Terbilang : ${root.$dwn.bilang(Number(detail.data.reduce((j, k) => j + k.jmlHarga, 0)).toFixed(2))}
                        </i>
                      </b>`
      let note = props.jhp === 'P' && x.ancab !== 'Y' ? `
                      <div style='border : 1px dotted #000000; padding:10px' width='60%'>
                        Note : Pembayaran dapat dilakukan melalui:
                        <ul>
                          ${bankCabang}
                        </ul>
                        ${x.data.ct === 'tempo' && x.data.jnsTrx === 'J' ? 'Bukti pembayaran mohon diemail ke finance@astonsistem.com' : ''}
                        <br/>Catatan tambahan : ${x.data.note || ''}
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
      let ttpUM = x.data.uangMuka && `<tr>
                            <td align='right'><b>Uang Muka</b></td>
                            <td align='right'><b></b></td>
                          </tr>`
      let ttpDiskon = x.data.diskon && `<tr>
                            <td align='right'><b>Diskon</b></td>
                            <td align='right'><b><span contenteditable="">- ${new Intl.NumberFormat('en').format(Number(x.diskon || 0).toFixed(2))}</span></b></td>
                          </tr>`
      let ttpxBiaya = x.data.biaya && `<tr>
                            <td align='right'><b>Ongkos Kirim</b></td>
                            <td align='right'><b><span style="text-decoration: ${x.data.ongkir === 'N' ? 'line-through' : ''}">${new Intl.NumberFormat('en').format(Number(x.data.biaya || 0).toFixed(2))}</span></b></td>
                          </tr>`
      let ttpTotal = x.data.totalAkhir !== tdpp && `<tr>
                            <td align='right'><b>Jumlah Pembayaran</b></td>
                            <td align='right' style="border-top: double black;"><b>${new Intl.NumberFormat('en').format(Number(Number(x.data.totalAkhir).toFixed(2)))}</b></td>
                          </tr>`
      let ttpJ = props.jhp === 'P' && `</table>
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
                    ${x.data.namaSales}
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
          <button type=button onclick='window.print();'>Cetak Nota</button>
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
    }
    const cetak = (x) => {
      x.nomorBukti = x.nomorSuratJalan
      dt.nota = { ...x }
      dt.pilPrint = true
    }
    const toDownAll = () => {
      if (!dt.kodeSubAkun) {
        root.$q.notify({ message: `Pilih jenis ${jenis.value} dulu... `, color: 'deep-orange-7' })
      } else {
        let x = { jhp: props.jhp, kodeSubAkun: dt.kodeSubAkun.value, tgl: dt.jh.tgl, ac: dt.ac, kodeCabFilt: root.$store.state.auth.user.cabGrup, status: dt.jh.status.value }
        dtHP(x)
          .then(res => {
            let a = res.data.map(u => {
              let y = u
              y.tbayar = u.tbayar
              return y
            })
            root.$dwn.toExcel({
              judul: `Laporan semua cabang ${jenis.value} `,
              dt: a,
              hdr: [{ name: 'cabang', label: 'Nama Cabang' }, ...jdl.value],
              naFile: `LapHPall`
            })
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    const jenis = computed(() => {
      return props.jhp === 'H' ? 'Hutang' : 'Piutang'
    })
    const jdl = computed(() => {
      let x = dt.rekap ? dt.jdlr : dt.jdld
      return x
    })
    return { ...toRefs(dt), getHP, printNota, cetak, jenis, jdl, toDownAll, jdlB }
  },
  watch: {
    selected: function (v) {
      let e = Object.assign({}, v[0])
      this.$emit('byr', e)
      this.toDown()
    }
  },
  computed: {
    akunKas () {
      let x = this.alAkun.filter(a => a.arusKas === 'Y')
      return x
    },
    akunKasB () {
      let x = this.alAkun.filter(a => a.BP === 'Y')
      return x
    },
    akunPerCoA () {
      let x = [...new Set(this.dtJurnal.map(a => a.kodeAkun))]
      let y = this.alAkun.filter(a => x.some(u => u === a.kodeAkun))
      return y
    },
    dataJurnal () {
      let x = this.perCoA ? this.dtJurnal.filter(a => a.kodeAkun === this.filt.kodeAkun) : this.dtJurnal
      let y = this.jh.overDue === 'Over Due' ? x.filter(a => a.overDue > 0) : this.jh.overDue === 'Non' ? x.filter(a => a.overDue <= 0) : x
      return y.filter(a => this.filt.antarDivisi.some(s => s === a.antarDivisi))
    },
    detHP () {
      let x = this.rekap ? this.dtRekap : this.dataJurnal
      return x
    },
    pilSub () {
      let p
      if (this.jhp === 'P') {
        p = [
          {
            label: 'Piutang Usaha',
            value: ['11050']
          },
          {
            label: 'Piutang Non Usaha',
            value: this.subAkun.filter(a => a.jhp === 'P' && a.kodeSubAkun !== '11050').map(s => s.kodeSubAkun)
          }
        ]
      } else {
        p = [
          {
            label: 'Hutang Usaha',
            value: ['21010']
          },
          {
            label: 'Hutang Non Usaha',
            value: this.subAkun.filter(a => (a.jhp === 'H' && a.kodeSubAkun !== '21010') || a.kodeSubAkun === '22010').map(s => s.kodeSubAkun)
          }
        ]
      }
      return p
    },
    dtRekap () {
      let dta = []
      if (this.dataJurnal.length > 0) {
        let sp = [...new Set(this.dataJurnal.map(x => x.kodeRekan))] // ambil dt kode rekanan as array
        for (let i in sp) {
          // filter datPi where kode = sp[i] per grup rekanan
          let f = this.dataJurnal.filter(x => x.kodeRekan === sp[i])
          let s = { ...f[0] } // ambil value untuk rekanan
          s.nilai = f.reduce((x, y) => this.$dwn.jumlah([x, y.nilai]), 0)
          s.tbayar = f.reduce((x, y) => x + (+y.tbayar), 0)
          s.sisa = f.reduce((x, y) => x + (+y.sisa), 0)
          dta.push(s) // add to data array
          // tinggal add judulnya
        }
      }
      return dta
    },
    total () {
      let x = {}
      x.nilai = this.dtRekap.reduce((a, b) => this.$dwn.jumlah([a, b.nilai]), 0)
      x.tbayar = this.dtRekap.reduce((a, b) => this.$dwn.jumlah([a, b.tbayar]), 0)
      x.sisa = this.dtRekap.reduce((a, b) => this.$dwn.jumlah([a, b.sisa]), 0)
      return x
    },
    rkpJurReff () {
      let nomorJurnal = [...new Set(this.jurReff.map(a => a.nomorJurnal))]
      let rkp = nomorJurnal.map(a => {
        let det = this.jurReff.find(d => d.nomorJurnal === a)
        let s = {
          nomorJurnal: a,
          tgl: det.tgl,
          namaCabang: det.namaCabang,
          nomorBukti: '',
          cabLain: det.cabLain,
          desk: det.desk,
          nilai: this.jurReff.filter(x => x.nomorJurnal === a).reduce((x, y) => x + y.nilai, 0)
        }
        return s
      })
      return rkp
    },
    cabGrup () {
      const pegang = this.$store.state.auth.user.cabGrup || this.$q.cookies.get('cabGrup')
      return this.dtCabang.filter(a => pegang.some(s => s === a.kodeCab))
    }
  },
  mounted () {
    this.getSub()
    accRek()
      .then(res => {
        this.alAkun = res.data
      })
    dtCab()
      .then(res => {
        this.dtCabang = res.data
      })
    this.cekReff()
  },
  methods: {
    async cekTrx (x) {
      try {
        let { data } = await transaksi({ nomorBukti: x.nomorSuratJalan, jnsTrx: this.jhp === 'H' ? 'B' : 'J' })
        this.hdTrx = data
        detTrx({ nomorBukti: x.nomorSuratJalan })
          .then(({ data }) => {
            this.detailTrx = data
            this.trx = true
          })
      } catch (error) {
        console.log(error)
      }
    },
    kopi (x) {
      if (!x) {
        this.$q.notify({ message: 'Pilih jenis hutang piutang dulu...', color: 'accent' })
      } else {
        let nomer = x.jhp === 'H' ? x.pitPokok : x.hutPokok
        let y = this.dataJurnal.find(a => a.nomorJurnal === nomer)
        if (!y) {
          this.$q.notify({ message: 'Pilih jenis hutang piutang dulu...', color: 'accent' })
        } else if (y.sisa < x.nilai) {
          this.$q.notify({ message: `Sisa pembayaran tinggal ${y.sisa.toLocaleString()}`, color: 'accent' })
        } else {
          y.jurKop = x.nomorJurnal
          y.jurKopreff = x.nomorReff
          this.addByr(y, x.nilai)
        }
      }
    },
    cekReff () {
      cekBayarReff({ kodeCab: this.kodeCab, jhp: this.jhp })
        .then(({ data }) => {
          this.jurReff = data
        })
    },
    filterFn (val, update) {
      if (val === '') {
        update(() => {
          this.akunB = this.alAkun.filter(a => a.BP === 'Y')
        })
        return
      }
      update(() => {
        const needle = val.toLowerCase()
        this.akunB = this.alAkun.filter(v => (v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    },
    getSub () {
      subAkun()
        .then(res => {
          this.subAkun = res.data
        })
        .catch(err => {
          console.log(err)
        })
    },
    onReset () {
      this.p = { product_name: '', catID: '', product_description: '' }
    },
    toDown () {
      let x = {
        judul: `Laporan ${this.jenis} `,
        dt: this.detHP,
        hdr: this.jdl,
        naFile: `LapHP`
      }
      this.$dwn.toExcel(x)
    },
    async getByr (x, y, z) {
      if (z) {
        x.rekap = this.rekap
        let dbyr = await cekByr(x)
        if (dbyr.data.length) {
          this.detByr.forEach((a, b, c) => {
            if (a.nomorReff === x.nomorJurnal.toString()) {
              c.splice(b, 1)
            }
          })
          this.detByr.push(...dbyr.data)
        }
      }
    },
    async printRekap (x, y) {
      if (this.rekap && x.ac === 'N') {
        let { data } = await getBankCab(x.cabID)
        let bankCabanga = data.map(s => {
          let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
          return ss
        })
        let bankCabang = await bankCabanga.toString().replace(/,/g, '')
        let detB = this.dtJurnal.filter(s => s.kodeRekan === x.kodeRekan)
        let a = detB.map(s => {
          let c = { ...s }
          const sj = s.nomorSuratJalan.length ? `Inv: ${s.nomorSuratJalan}` : ''
          const p = s.nomorPO ? `PO: ${s.nomorPO}` : ''
          c.tagihan = s.nilai
          c.nilai = 0
          c.kurang = s.sisa
          c.DK = this.jhp === 'P' ? 'K' : 'D'
          // s.lunas = 'N'
          c.nomorReff = s.nomorJurnal
          c.desk = `Pembayaran ${s.nomorJurnal} ${sj} ${p}`
          c.akunPot = ''
          c.tglPokok = s.tgl
          c.terbayar = s.tbayar
          return c
        })
        // a.dk = x.jhp === 'P' ? 'K' : 'D'
        this.kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === this.$store.state.auth.user.userType) ? this.kodeCab : this.$store.state.auth.user.kodeCab
        this.muldet = [ ...a ]
        let detKas = this.muldet
        let jnsKas = x.DK === 'D' ? 'Hutang' : 'Piutang'
        let cab = this.dtCabang.find(a => a.kodeCab === x.cabID)
        let tKas = detKas.reduce((a, b) => this.$dwn.jumlah([a, b.sisa]), 0)
        let wd = window.open('', `Tagihan ${jnsKas}`, 'resize = 1')
        let html = `<!DOCTYPE html>
          <!--
          To change this license header, choose License Headers in Project Properties.
          To change this template file, choose Tools | Templates
          and open the template in the editor.
          -->
          <html>
          <head>
            <meta charset="UTF-8">
            <title>ADES SURAT TAGIHAN CUSTOMER</title>
            <style>
                      /*
                    CSS-Tricks Example
                    by Chris Coyier
                    http://css-tricks.com
                      */

                      * { margin: 0; padding: 5px; }
                      body { font: 14px/1.4 Georgia, serif; }
                      #page-wrap { width: 800px; margin: 0 auto; }

                      textarea { border: 0; font: 14px Georgia, Serif; overflow: hidden; resize: none; }
                      table { border-collapse: collapse; }
                      table td, table th { border: 1px solid black; padding: 5px; }

                      #header { height: 15px; width: 100%; margin: 20px 0; background: #222; text-align: center; color: white; font: bold 15px Helvetica, Sans-Serif; text-decoration: uppercase; letter-spacing: 20px; padding: 8px 0px; }

                      #address { width: 250px; height: 150px; float: left; }
                      #customer { overflow: hidden; }

                      #logo { text-align: right; float: right; position: relative; margin-top: 25px; border: 1px solid #fff; max-width: 540px; max-height: 100px; overflow: hidden; }
                      #logo:hover, #logo.edit { border: 1px solid #000; margin-top: 0px; max-height: 125px; }
                      #logoctr { display: none; }
                      #logo:hover #logoctr, #logo.edit #logoctr { display: block; text-align: right; line-height: 25px; background: #eee; padding: 0 5px; }
                      #logohelp { text-align: left; display: none; font-style: italic; padding: 10px 5px;}
                      #logohelp input { margin-bottom: 5px; }
                      .edit #logohelp { display: block; }
                      .edit #save-logo, .edit #cancel-logo { display: inline; }
                      .edit #image, #save-logo, #cancel-logo, .edit #change-logo, .edit #delete-logo { display: none; }
                      #customer-title { font-size: 20px; font-weight: bold; float: left; }

                      #meta { margin-top: 1px; width: 300px; float: right; }
                      #meta td { text-align: right;  }
                      #meta td.meta-head { text-align: left; background: #eee; }
                      #meta td textarea { width: 80%; height: 20px; text-align: right; }

                      #items { clear: both; width: 100%; margin: 30px 0 0 0; border: 1px solid black; }
                      #items th { background: #eee; }
                      #items textarea { width: 80px; height: 50px; }
                      #items tr.item-row td { border: 0; vertical-align: top; }
                      #items td.description { width: 300px; }
                      #items td.item-name { width: 175px; }
                      #items td.description textarea, #items td.item-name textarea { width: 100%; }
                      #items td.total-line { border-right: 0; text-align: right; }
                      #items td.total-value { border-left: 0; padding: 10px; }
                      #items td.total-value textarea { height: 20px; background: none; }
                      #items td.balance { background: #eee; }
                      #items td.blank { border: 0; }

                      #terms { text-align: center; margin: 20px 0 0 0; }
                      #terms h5 { text-transform: uppercase; font: 13px Helvetica, Sans-Serif; letter-spacing: 10px; border-bottom: 1px solid black; padding: 0 0 8px 0; margin: 0 0 8px 0; }
                      #terms textarea { width: 100%; text-align: center;}

                      textarea:hover, textarea:focus, #items td.total-value textarea:hover, #items td.total-value textarea:focus, .delete:hover { background-color:#EEFF88; }

                      .delete-wpr { position: relative; }
                      .delete { display: block; color: #000; text-decoration: none; position: absolute; background: #EEEEEE; font-weight: bold; padding: 0px 3px; border: 1px solid; top: -6px; left: -22px; font-family: Verdana; font-size: 12px; }
                      @media print {

                          .noprint {
                              display: none;
                          }

                          table tbody tr td:before,
                          table tbody tr td:after {
                              content : "" ;
                              height : 4px ;
                              display : block ;
                          }
                      }
            </style>
          </head>
          <body>
            <div id="page-wrap">
              <textarea id="header">INVOICE</textarea>
              <div id="identity">
                <div id="address">
                  <h5>${cab.namaCabang.toUpperCase()}</h5>
                  <p>Alamat : ${cab.alamatCabang}</p>
                  <p>No Telp : ${cab.telp}</p>
                </div>
                <div align="right"><img src="/statics/logo/${cab.kodeCab}.png" style="width:20%"></div>
              </div>
              <div style="clear:both"></div>
              <div id="customer">
                <p>Kepada Yth :<br>
                <br>
                <b>${x.namaPartner}</b></p><br>
                <p>Dengan hormat,</p>
                <table id="meta">
                  <tr>
                    <td>
                    <textarea id="date">${new Date(this.jh.tgl).toLocaleDateString('id-ID', { dateStyle: 'full' })}</textarea></td>
                  </tr>
                </table>
              </div>
              <p>Berikut ini kami sampaikan daftar Hutang yang belum Anda selesaikan sampai dengan tanggal ${this.jh.tgl.toLocaleString()}</p><br>
              <hr>
              <table width="100%">
                <thead>
                  <tr class="bg-lightBlue">
                    <th class="fg-white">No</th>
                    <th class="fg-white">Tanggal</th>
                    <th class="fg-white">No Invoice</th>
                    <th class="fg-white">Total Tagihan</th>
                    <th class="fg-white">Terbayar</th>
                    <th class="fg-white">Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody>`
        let dtDet = ''
        detKas.forEach((det, i) => {
          dtDet += `<tr style="height:25px">
            <td align='center'>${(i + 1).toString().padStart(3, ' ')}</td>
            <td >${det.tglPokok}</td>
            <td >${det.nomorSuratJalan}</td>
            <td >
              <div style="float: left">
                Rp.
              </div>
              <div style="float: right">
                ${new Intl.NumberFormat('en').format(Number(det.tagihan).toFixed(2))}
              </div>
            </td>
            <td >
              <div style="float: left">
                Rp.
              </div>
              <div style="float: right">
                ${new Intl.NumberFormat('en').format(Number(det.terbayar).toFixed(2))}
              </div>
            </td>
            <td >
              <div style="float: left">
                Rp.
              </div>
              <div style="float: right">
                ${new Intl.NumberFormat('en').format(Number(det.sisa).toFixed(2))}
              </div>
            </td>
          </tr>`
        })
        let ttp = `</tbody>
            <tr style="background: #C0C0C0">
              <th colspan="5" align="right"><i>Total Sisa Tagihan:</i></th>
              <td>
                <div style="float: left">
                  <h4>Rp.</h4>
                </div>
                <div style="float: right">
                  <h4>${new Intl.NumberFormat('en').format(Number(tKas).toFixed(2))}</h4>
                </div>
              </td>
            </tr>
            </table>
            <div style='border : 1px dotted #000000; padding:10px' width='60%'>
              Note : Pembayaran dapat dilakukan melalui:
              <ul>
                ${bankCabang}
              </ul>
            </div>
            <div>
              <p>Jika terdapat kesalahan pencatatan dari data yang kami berikan, mohon untuk segera dikonfirmasikan.</p>
              <p>Atas perhatian dan kerjasamanya, kami mengucapkan terima kasih.</p>
            </div>
            <div id="meta" style="text-align: right">
              <p>${new Date(this.jh.tgl).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p><br>
              <br>
              <br>
              <p>${this.$store.state.auth.user.nama}</p>
            </div>
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
      }
    },
    addByr (x, y) {
      // cek jml HP dan bayar
      if (this.rekap && x.ac === 'N') {
        let detB = this.dtJurnal.filter(s => s.kodeRekan === x.kodeRekan)
        let a = detB.map(s => {
          const sj = s.nomorSuratJalan.length ? `Inv: ${s.nomorSuratJalan}` : ''
          const p = s.nomorPO ? `PO: ${s.nomorPO}` : ''
          s.nilai = 0
          s.kurang = s.sisa
          s.DK = this.jhp === 'P' ? 'K' : 'D'
          // s.lunas = 'N'
          s.nomorReff = s.nomorJurnal
          s.desk = `Pembayaran ${s.nomorJurnal} ${sj} ${p}`
          s.akunPot = ''
          s.tglPokok = s.tgl
          return s
        })
        // a.dk = x.jhp === 'P' ? 'K' : 'D'
        this.kodeCab = ['MAN', 'acc', 'purchase'].some(a => a === this.$store.state.auth.user.userType) ? this.kodeCab : this.$store.state.auth.user.kodeCab
        this.muldet = [ ...a ]
        this.adBa = true
      } else {
        this.getByr(x)
        if (x.nilai >= x.sisa) {
          this.adB = true
          this.j = { lunas: false }
          this.namaPartner = x.namaPartner
          let a = {}
          a.DK = x.DK === 'K' ? 'D' : 'K'
          a.ac = this.ac
          a.biaya = 0
          a.salesID = x.salesID
          a.cabP = x.cabID
          a.tgl = new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
          a.nilai = y || x.sisa // nilai akan dibayar
          a.tHP = x.nilai // total HP
          a.sisa = x.sisa // sisa HP sebelum bayar
          a.sisaHP = this.$dwn.jumlah([x.sisa, -a.nilai]) // sisa HP setelah bayar
          a.judulJurnal = `Pembayaran tagihan ${x.nomorJurnal} ${x.namaPartner}`
          a.nomorReff = x.nomorJurnal
          a.akunHP = x.kodeAkun
          a.kodePartner = x.kodePartner
          a.cabLain = x.cabLain
          a.jhp = this.jhp
          a.desk = ''
          a.jurKop = x.jurKop || null
          a.jurKopreff = x.jurKopreff || null
          a.tglPokok = x.tgl
          this.j = a
        } else {
          this.$q.notify({ message: `Sudah lunas ?`, color: 'purple' })
        }
      }
    },
    async simpan (x) {
      x.akunLunas = !x.lunas ? '' : this.jhp === 'P' ? '510100005' : '510200004'
      if (x.nilai <= x.sisa) {
        this.adB = false
        bayarHP(x)
          .then(({ data }) => {
            this.getHP()
            this.cekReff()
            this.$q.notify({ message: `${data.st}`, color: 'success' })
          })
          .catch(err => {
            console.log(err.response.data)
            this.$q.notify({ message: 'gagal simpan...', color: 'warning' })
          })
      } else {
        this.$q.notify({ message: 'Kelebihan bayar ... ?', color: 'warning' })
      }
    },
    hit (x) {
      x.sbbiaya = this.$dwn.jumlah([x.sisa, -x.nilai])
      if (this.$dwn.jumlah([x.sisa, -x.nilai, -x.biaya]) >= 0) {
        x.sisaHP = this.$dwn.jumlah([x.sisa, -x.nilai, -x.biaya])
      } else {
        x.sisaHP = 0
        x.nilai = x.sisa
      }
    },
    tutup (x) {
      this.adBa = false
      this.getHP()
    },
    cek (x, y) {
      x.namaPartner = y.namaPartner
      x.jenis = y.DK
      x.DK = y.DK
      x.kodeCab = y.cabID
      detKas(x)
        .then(res => {
          // dt.dtJ = true
          let detJur = res.data
          this.ctk = { x: x, y: detJur }
          this.confirm = true
        })
        .catch((err) => {
          console.log(err)
        })
    },
    async printW (ctx) {
      let { x, y } = ctx
      let detLawan = y.filter(a => a.arusKas !== 'Y')
      let detKas = y.filter(a => a.DK === x.DK && a.arusKas === 'Y')
      let jnsKas = x.DK === 'D' ? 'PIUTANG' : 'HUTANG'
      let cab = this.dtCabang.find(a => a.kodeCab === x.kodeCab)
      let tKas = detLawan.reduce((a, b) => this.$dwn.jumlah([a, b.nilai]), 0)
      let wd = window.open('', 'Bukti Pembayaran', 'resize = 1')
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
                                <b>BUKTI PEMBAYARAN ${jnsKas}</b> 
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
                        <tr>
                            <td>Dari </td>
                            <td>: ${x.namaPartner}</td>
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
                            <td width="50%">Deskripsi </td>
                            <td align="right">Nilai</td>
                        </tr>`
      let dtDet = ''
      detLawan.forEach((det, i) => {
        dtDet += `<tr>
          <td align='center'>${(i + 1).toString().padStart(3, ' ')}</td>
          <td >${det.desk === '' ? x.judulJurnal : det.desk}</td>
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
                            <td align="right"><b>${tKas.toLocaleString()}</b></td>
                        </tr>
                    </tbody></table>
                </td>
            </tr>
            <tr>
                <td colspan="4" align="center">
                    <table width="90%" align="center">
                        <tbody><tr>
                            <td width="33%" align="center">Di buat oleh, <br><br><br><br><br>${x.namaKaryawan || this.$store.state.auth.user.nama}</td>
                            <td width="33%" align="center">Mengetahui, <br><br><br><br><br>(.....................)</td>                                                        
                            <td width="33%" align="center">Partner, <br><br><br><br><br>${x.namaPartner}</td>
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
            <button type="button" onclick="window.print();">Cetak Bukti</button>
        </div>
      </body></html>`
      html += dtDet + ttp
      wd.document.open()
      wd.document.write(html)
      wd.document.close()
    },
    printA4 (ctx) {
      let { x, y } = ctx
      let detLawan = y.filter(a => a.arusKas !== 'Y')
      let detKas = y.filter(a => a.DK === x.DK && a.arusKas === 'Y')
      let jnsKas = x.DK === 'D' ? 'PIUTANG' : 'HUTANG'
      let cab = this.dtCabang.find(a => a.kodeCab === x.kodeCab)
      let tKas = detLawan.reduce((a, b) => this.$dwn.jumlah([a, b.nilai]), 0)
      let wd = window.open('', 'BuktiPembayaran', 'resize = 1')
      let html = `<html>
        <title>Cetak Bukti Pembayaran ${jnsKas} ${x.nomorBukti}</title>
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

          <table width='100%' id="tss" class="report-container">
            <thead class="report-header">
            <tr>
              <td colspan="3" width='60%' valign="top">

                <table width="100%">
                  <tr>
                    <td>
                      <img src="/statics/logo/${cab.kodeCab}.png" alt="" style="width:8%">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cab.namaCabang.toUpperCase()}</b>
                    </td>
                  </tr>
                  <tr>
                    <td st>
                      <b>${cab.alamatCabang}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>${cab.tlp || ''}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%">
                    <tbody><tr>
                        <td colspan="4" class="bdr_btm">
                            <b>BUKTI PEMBAYARAN ${jnsKas}</b> 
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
                    <tr>
                        <td>Dari </td>
                        <td>: ${x.namaPartner}</td>
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
            </thead>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/>
                <table width='100%' id="table_product">
                <thead class="report-header">
                  <tr  class="bdr_btm">
                    <th width="5%" align="center">No</th>
                    <th>Deskripsi</th>
                    <th width='10%' style="text-align:right">Nilai</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detLawan.forEach((det, i) => {
        dtDet += `<tr>
          <td align='center'>${(i + 1).toString().padStart(3, ' ')}</td>
          <td >${det.desk === '' ? x.judulJurnal : det.desk}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.nilai).toFixed(2))}</td>
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
                        <td width='60%' align='right' colSpan="4"><b>Total Pembayaran</b></td>
                        <td style="text-align:right"><b>${new Intl.NumberFormat('en').format(Number(tKas).toFixed(2))}</b></td>
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
                      Dibuat Oleh<br/>
                      <br/><br/><br/><br/>
                      (${x.namaKaryawan})
                  </td>
                  <td width='33.3%' align='center'>
                    Disetujui Oleh<br/>
                    <br/><br/><br/><br/>
                    (.........................)
                  </td>
                  <td width='33.3%' align='center'>
                    Partner<br/>
                    <br/><br/><br/><br/>
                    (.........................)
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
          <button type=button onclick='window.print();'>Cetak Bukti</button>
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
    optionsFn (date) {
      return date >= this.j.tglPokok.replace(/-/g, '/')
    }
  }
}
</script>
<style lang="sass">
.detHP
  /* max height is important */
  /* .q-table__middle
    max-height: 300px */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: #ff8c66

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0
  tbody
    font-style: italic

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
</style>
