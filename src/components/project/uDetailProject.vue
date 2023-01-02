<template>
  <q-card>
    <q-card-section>
      <q-toolbar class="text-h6">{{ jns }} Project
        <q-input
          dense
          readonly
          rounded
          outlined
          color="teal"
          class="q-ml-md text-right"
          :value="p.tglMasuk"
          label="Tanggal Masuk">
          <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="jns === 'Input'">
            <q-date v-model="p.tglMasuk" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
          </q-popup-proxy>
        </q-input>
        <q-space/>
        <q-input
          dense
          readonly
          rounded
          outlined
          color="teal"
          :value="
            dtSales.length ? dtSales.find(a => a.salesID === p.salesID).namaKaryawan : ''
          "
          input-class="text-right text-teal"
          label="Nama Sales"
        ><q-popup-edit v-model="p.salesID">
            <q-select
              v-model="p.salesID"
              use-input
              :options="pilihSales"
              :option-label="(item) => item && item.namaKaryawan +' '+ item.namaCabang"
              option-value="salesID"
              options-dense
              emit-value
              map-options
              style="min-width: 250px; max-width: 300px"
              label="Nama Sales"
              @filter="filterKn"
              :rules="inRul"
              :readOnly="jns !== 'Input'"
              dense
              lazy-rules/>
          </q-popup-edit>
        </q-input>
      </q-toolbar>

    <q-separator color="purple-7"/>
        <q-input :value="cust.namaPartner" label="Nama Pelanggan" input-class="text-teal"
        :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
          <q-dialog v-model="crp" persistent>
            <q-card style="min-width: 350px">
              <q-card-section class="q-pt-none">
                <cariPartner @dtPartner="partner" :pil="false"/>
              </q-card-section>
              <q-card-actions align="right" class="text-primary">
                <q-btn flat label="Cancel" v-close-popup />
                <q-btn flat label="Pilih" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>
    </q-card-section>
    <q-card-section>
      <q-form
        @submit="addProject(p)"
        @reset="onReset"
        class="q-gutter-md">
        <div class="row justify-between">
          <div class="col-12 col-sm-5 col-md-4">
            <q-select
              filled
              dense
              use-input
              @filter="filterFn"
              v-model="p.jnsProject"
              :options="jenisProject"
              :option-label="(item) => item && item.namaJenis"
              option-value="jnsProject"
              options-dense
              emit-value
              map-options
              label="Jenis Project *"
              lazy-rules
              :rules="inRul"
              :readonly="jns !== 'Input'"
            >
              <template v-slot:option="scope">
                <q-item
                  v-bind="scope.itemProps"
                  v-on="scope.itemEvents"
                  dense
                >
                  <q-item-section>
                    <q-item-label v-html="scope.opt.namaJenis" ></q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
            <q-file
              style="max-width: 300px"
              v-model="potoSket"
              filled
              rounded
              dense
              @input="fileSket"
              label="Sketsa"
              accept=".jpg, image/*" :readonly="jns !== 'Input'"
            />
            <q-input
              dense
              readonly
              rounded
              outlined
              color="teal"
              class="q-ml-md text-right"
              :value="p.estJadi"
              :rules="inRul"
              label="Estimasi Selesai">
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="jns === 'Input'">
                <q-date v-model="p.estJadi" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
              </q-popup-proxy>
            </q-input>
            <q-input
              filled
              v-model="p.catatan"
              label="Catatan *"
              lazy-rules
              :rules="inRul"
              autogrow
              dense
              style="min-width: 250px" :readonly="jns !== 'Input' && !editP"
            />
            <div class="q-px-sm q-mt-sm">
              Asal Bahan:
            </div>
            <div class="q-gutter-sm">
              <q-radio keep-color v-model="p.asalBahan" val="cust" label="Pelanggan" color="teal" :disable="jns !== 'Input' && !editP"/>
              <q-radio keep-color v-model="p.asalBahan" val="outlet" label="Outlet" color="orange" :disable="jns !== 'Input' && !editP"/>
            </div>
            <q-input
              filled
              dense
              v-model="p.uangMuka"
              type="number"
              label="Uang Muka"
              lazy-rules
              input-class="text-right"
              :hint="new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.uangMuka)"
              :readonly="jns !== 'Input'"
            />
            <q-select
              v-if="p.uangMuka > 0"
              filled
              v-model="p.akunBayar"
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
              :readonly="jns !== 'Input'"
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
              v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
              v-model="p.kodeCab"
              :options="cabAll"
              :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
              option-value="kodeCab"
              emit-value
              map-options
              options-dense
              style="min-width: 250px; max-width: 300px"
              label="Pilih cabang... "
              :rules="inRul"
              dense
              readonly
              lazy-rules/>
          </div>
          <div class="col-md-4">
             <div class="col-12 col-sm-5 col-md-3">
               <q-input
                filled
                :dense="dense" 
                :value="p.pStart" 
                :rules="inRul" 
                style="min-width: 250px"
                label="Mulai Project">
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                  <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" >
                    <q-date v-model="p.pStart" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
                  </q-popup-proxy>
                  
                </q-input>
               <q-input              
                filled
                :dense="dense" 
                :value="p.pFinish" 
                :rules="inRul" 
                label="Project Selesai"
                 style="min-width: 250px">
                  <template v-slot:prepend>
                    <q-icon name="event" />
                  </template>
                  <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="jns === 'Input'">
                    <q-date v-model="p.pFinish" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
                  </q-popup-proxy>
                </q-input>              

                <q-input
                rounded
                readonly
                dense
                outlined
                input-class="text-indigo-9 text-center"
                :value="dtSales.find(a => a.salesID === p.salesID).namaKaryawan.toUpperCase()"
                />
                <q-input
                  filled
                  v-model="p.jKonsumsi"
                  dense                  
                  type="number"
                  :rules="inRul"
                  label="Jumlah Konsumsi"
                  style="min-width: 250px; margin-top:1.5em"
                />
                <p>Informasi :</p>

                <div class="row justify-between">
                  <div class="col-md-3">
                      <q-input
                        filled
                        v-model="p.pBagus"
                                    
                        type="number"
                        :rules="inRul"
                        label="Jumlah Bagus"                        
                      />
                  </div>
                  <div class="col-md-3">
                      <q-input
                        filled
                        v-model="p.pReject"
                                    
                        type="number"
                        :rules="inRul"
                        label="Jumlah Reject"                        
                      />
                  </div>
                  <div class="col-md-3">
                      <q-input
                        filled
                        v-model="p.pSisa"
                                    
                        type="number"
                        :rules="inRul"
                        label="Jumlah Sisa"                        
                      />
                  </div>
                </div>
          </div>
          </div>
          <div class="col-12 col-sm-5 col-md-3" style="margin-bottom: 1.5em">
            <q-card style="margin-bottom: 1.5em">
              <q-card-actions class="text-h6">
                              Order
                <q-space/>
                <q-avatar rounded size="70px">
                  <q-img
                    :src="gambar"
                    :ratio="1"
                    class="q-mt-md "
                    @click="gmb = !gmb"/>
                </q-avatar>
              </q-card-actions>
              <q-separator color="cyan-7"/>
              <q-card-section>
                    <q-list v-for="(a, i) in detOrder" :key="i" dense>
                      <q-input :label="a.label" v-model="p.detOrder[a.val]" dense :readonly="jns !== 'Input' && !editP" />
                    </q-list>
              </q-card-section>
            </q-card>            
          </div>
          <div class="col-12">
            <q-table
              class="dataPR"
              :data="detProject"
              :columns="jdld"
              row-key="kodeProduk"
              dense
              wrap-cells
              hide-bottom
              :pagination.sync="hal"
              separator="cell">
              <template v-slot:top>
                    <div class="fit row wrap justify-between items-start content-start">
                      <div class="text-h5">Biaya dan Bahan jhahahah</div>
                      <q-chip color="blue" class="text-white q-ml-md">Nomor Project: {{p.nomorProject}}</q-chip>
                      <q-space/>
                      <q-btn icon="add" color="pink" round @click="stk = true"/>
                    </div>
              </template>
              <template v-slot:body-cell-nom="props">
                <q-td align="right">
                  {{ props.rowIndex + 1 }}
                </q-td>
              </template>
              <template v-slot:body-cell-qtySPK="props">
                <q-td align="right">{{ props.row.qtySPK }}
                  <q-popup-edit v-model="props.row.qtySPK" @save="onSave(props.row)" v-if="['Baru', 'Proses', 'Approve'].includes(p.status)">
                    <q-input v-model="props.row.qtySPK" dense autofocus counter @input="onSave(props.row)"/>
                  </q-popup-edit>
                </q-td>
              </template>
              <template v-slot:body-cell-hargaSat="props">
                <q-td align="right" :class="props.row.qtySPK <= 0 && 'text-red-13'">
                  <template v-if="props.row.qtySPK <= 0">
                    Tidak dimasuk invoice
                  </template>
                  <template v-else>
                    {{ props.row.hargaSat | duit }}
                    <q-popup-edit v-model="props.row.hargaSat" @save="onSave(props.row)" v-if="jns === 'Input'">
                      <q-input v-model="props.row.hargaSat" dense autofocus counter @input="onSave(props.row)"/>
                    </q-popup-edit>
                  </template>
                </q-td>
              </template>
              <template v-slot:body-cell-qtyProd="props">
                <q-td align="right">{{ props.row.qtyProd }}
                  <q-popup-edit v-model="props.row.qtyProd" @save="onSave(props.row)" v-if="jns !== 'Input' && !['Baru', 'Batal', 'Selesai', 'Diambil'].includes(p.status)">
                    <q-input v-model="props.row.qtyProd" dense autofocus counter/>
                  </q-popup-edit>
                </q-td>
              </template>
              <template v-slot:body-cell-act="props">
                <q-td>
                  <q-btn icon="close" color="pink" rounded dense outline @click="dele(props.row)" v-if="jns === 'Input' || props.row.qtySPK <= 0"/>
                </q-td>
              </template>
              <template v-slot:bottom-row>
                <q-tr>
                  <q-td align="right" colSpan="5">Total</q-td>
                  <q-td align="right" colSpan="4">{{ detProject.reduce((a, b) => a + b.jmlHarga, 0) | duit }} </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
        <div align="right" v-if="jns === 'Input'">
          <q-btn label="Simpan" outline type="submit" color="primary" class="shadow-3"/>
          <q-btn label="Reset" outline type="reset" color="warning" flat class="q-ml-sm shadow-3" />
        </div>
        <div align="right" v-if="jns !== 'Input'">
          <q-btn label="Simpan" outline color="primary" class="shadow-3" @click="simpan(detProject)"/>
          <q-btn label="Selesai" outline color="teal-7" class="q-ml-sm shadow-3" @click="selesai(p)" v-if="p.status === 'Approve'"/>
          <q-btn label="tutup" outline  color="warning" flat class="q-ml-sm shadow-3" v-close-popup/>
        </div>
      </q-form>
    </q-card-section>
    <q-dialog v-model="stk" seamless position="bottom">
      <q-card style="max-width: 100vw; max-height: 50vh">
        <q-card-section>
          <div class="text-h6 text-blue-13">Pilih Produk</div>
          <q-btn icon="close" color="red" dense v-close-popup class="absolute-top-right"/>
          <q-separator color="purple-13"/>
        </q-card-section>
        <q-card-section>
          <dataStok @dtStok="cekStoki"/>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="gmb" full-width>
      <q-card>
        <q-card-section>
          <q-img
            :src="gambar"
            spinner-color="white"
            class="rounded-borders shadow-3"
            contain
            style="height: 90vh"
          ><!--
            <q-btn icon-right="close" label="hapus" color="red" class="absolute-bottom-right"/> -->
            <div class="absolute-bottom text-subtitle1 text-center text-white-5">
              Sketsa untuk Nomor Project: {{ p.nomorProject }}
            </div>
          </q-img>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="pil"
      width="600px"
      persistent>
      <q-card>
        <q-card-section class="bg-secondary text-white">Cek Barang</q-card-section>
        <q-card-section class="row">
          <q-list dense>
            <q-item dense>
              <q-item-section>
                <q-item-label>Kode Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.kodeProduk }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Nama Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.namaBarang }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Stok Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>{{ dtpil.stok }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Qty Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-chip outline color="teal" >{{ dtpil.jmlKemasan }} {{ dtpil.kemasan.kemasan || '' }}</q-chip>
                  <q-popup-edit v-model="dtpil.jmlKemasan">
                    <q-input v-model="dtpil.jmlKemasan" @input="onSaved(dtpil)" dense autofocus counter/>
                  </q-popup-edit>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Kemasan Barang</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-select
                    :options="dtpil.konversi"
                    v-model="dtpil.kemasan"
                    map-options
                    :option-label="(val) => val.isi + ' pcs/ ' + val.kemasan"
                    label="Kemasan *"
                    :rules="inRul"
                    @input="onSaved(dtpil)"
                    style="width: 200px"/>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-show="['gudang','produksi'].every(a=> a !== $store.state.auth.user.userType)" dense>
              <q-item-section>
                <q-item-label>Harga @ Barang</q-item-label>
                <!-- <q-select
                  v-model="dtpil.jns"
                  :options="['hargaRetail','hargaGrosir']"
                  @input="hrg(dtpil)"
                  label="Harga"
                  /> -->
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <q-chip outline color="teal" >{{ dtpil.hargaKemasan | duit }}</q-chip>
                  <q-popup-edit v-model="dtpil.hargaKemasan" >
                    <q-input v-model="dtpil.hargaKemasan" @input="onSaved(dtpil)" dense autofocus counter/>
                  </q-popup-edit>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item dense>
              <q-item-section>
                <q-item-label>Jumlah Harga</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  {{ dtpil.jmlHarga | duit }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn rounded label="Kembali" color="warning" v-close-popup />
          <q-btn rounded label="Pilih" color="primary" v-close-popup @click="onpil(dtpil)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>
<script>
import { computed, onMounted, onUnmounted, reactive, toRefs } from '@vue/composition-api'
import { accRek, carikar, cekStok, delDetProject, dtCab, getdetProject, getJnsProject, getSketsa, postdetProject, projectDone, upProject } from '../../services/apiList'
import dataStok from '../stokSatu'
import cariPartner from '../cariPartner'
export default {
  components: {
    dataStok,
    cariPartner
  },
  props: {
    detail: {
      type: Array,
      default: () => {
        return []
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
          uangMuka: 0,
          akunBayar: '',
          materialCust: '--',
          catatan: '',
          salesID: null,
          estimasi: 1,
          estJadi: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
          pFinish: "" ,
          pStart: "" ,
          jkonsumsi: null,
          jnsProject: '',
          nomorProject: null,
          akunUangMuka: '',
          pBagus:null,
          pReject: null,
          pSisa: null,
          detOrder: {}
        }
      }
    },
    jns: {
      type: String,
      default: 'Input'
    },
    gmbr: {
      type: Blob,
      default: null
    },
    pelanggan: {
      type: Object,
      default: function () {
        return { namaPartner: '', alamat: '' }
      }
    }
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      detProject: [...props.detail],
      p: { ...props.hdr, kodeCab: root.$store.state.auth.setCabang },
      Project: {
        nomorProject: ''
      },
      editP: false,
      cabAll: [],
      inRul: [ v => !!v || 'Isi data' ],
      hal: { rowsPerPage: 10 },
      cust: { namaPartner: props.hdr.namaPartner || '', alamat: '', point: 'N' },
      crp: false,
      jdld: [
        { name: 'nom', label: 'No', align: 'left' },
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Barang', field: row => row.namaBarang, align: 'left' },
        { name: 'saldo', label: 'Stok', field: row => row.saldo, jml: 'Y', align: 'right' },
        { name: 'qtySPK', label: 'Qty SPK', field: row => row.qtySPK, jml: 'Y', align: 'right' },
        { name: 'qtyProd', label: 'Konsumsi', field: row => row.qtyProd, jml: 'Y', align: 'right' },
        { name: 'qtyInv', label: 'Qty Jual', field: row => row.qtyInv, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, format: v => v && v.toLocaleString(), align: 'right' },
        { name: 'jmlHarga', label: 'Jml Harga', field: row => row.jmlHarga, format: v => v && v.toLocaleString(), jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      akunCOA: [],
      jenisProject: [],
      dtSales: [],
      pilihSales: [],
      stk: false,
      potoSket: null,
      gambar: props.gmbr,
      gmb: false,
      detOrder: [
        { label: 'Nama Kain', val: 'namaKain' },
        { label: 'Motif Kain', val: 'motifKain' },
        { label: 'Jumlah Kain', val: 'jmlKain' },
        { label: 'Lebar Kain', val: 'lbrKain' },
        { label: 'Aplikasi Produk', val: 'aplikasiProduk' },
        { label: 'Jumlah Produksi', val: 'jmlProduksi' },
        { label: 'Panjang Layout', val: 'pjLayout' },
        { label: 'Judul File', val: 'jdlFile' }
      ],
      dtpil: { kemasan: { isi: 1, kemasan: 'Pcs' }, hargaKemasan: 0, jmlKemasan: 1 },
      pil: false
    })
    onMounted(() => {
      getJnsProject()
        .then(({ data }) => {
          dt.jenisProject = data
        })
      accRek()
        .then(({ data }) => {
          dt.akunCOA = data.filter(a => a.kasMasuk === 'Y')
        })
      carikar(root.$store.state.auth.user.kodeCab)
        .then(({ data }) => {
          dt.dtSales = data
        })
        .catch(err => {
          console.log(err)
        })
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
      getSketsa(props.hdr.nomorProject)
        .then(res => {
          /* const oo = Buffer.from(res.data, 'base64')
          const blob = new Blob([oo], { type: res.headers['content-type'] }) */
          // console.log(res.data)
          dt.gambar = `data: 'png';base64, ${res.data.to64}`
          // console.log(dt.gambar)
        })
      /* cariPartner(props.hdr.kodePartner)
        .then(({ data }) => {
          dt.cust = data
        }) */
    })
    onUnmounted(() => {
      emit('done')
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
    const cekStoki = (s) => {
      let x = { ...s }
      x.qty = x.qty || 1
      x.jmlKemasan = x.jmlKemasan || 1
      let kodeCab = dt.p.kodeCab
      if (x.kodeProduk) {
        if (dt.detProject.find(a => a.kodeProduk === x.kodeProduk)) {
          root.$q.notify({ message: `Barang ${x.kodeProduk} sudah ada di list... `, color: 'red-13' })
        } else {
          cekStok({ kodeProduk: x.kodeProduk, kodeCab: kodeCab, kodePartner: s.kodePartner })
            .then(res => {
              /* if (res.data[1]) {
                this.kongsi = res.data[1]
                this.pr.pjKongsi = 'Y'
              } else {
                this.pr.pjKongsi = null
              } */
              x.hargaRetail = x.hargaJual || res.data[0].hargaRetail
              x.hargaGrosir = res.data[0].hargaGrosir || 0
              x.price1 = res.data[0].hargaGrosir || 0
              x.stok = res.data[0].jasa === 'Y' || x.jasa === 'Y' ? 1000 : res.data[0].saldo
              x.hp = res.data[0].hpp || 0
              x.qty = x.qty > 0 ? (x.stok > x.qty ? x.qty : x.stok) : 0
              x.hargaSat = x.hargaRetail > x.price1 ? x.hargaRetail : x.price1
              x.jns = 'hargaRetail'
              x.pointMember = res.data[0].pointMember
              // x.konversi = JSON.parse(x.konversi) || []
              x.kemasan = x.kemasan || { isi: 1, kemasan: 'Pcs' }
              x.hargaKemasan = x.hargaKemasan || x.hargaSat * x.kemasan.isi
              x.jmlPoint = dt.cust.point === 'Y' ? (x.pointMember * x.qty * x.hargaSat) / 100 : 0
              dt.dtpil = { ...x }
              // this.kodeCab = kodeCab
              dt.pil = true

              // this.onpil(x)
            })
            .catch((err) => {
              console.log(err)
            // this.$q.notify({ message: `Stok kosong`, color: 'purple' })
            })
        }
      }
    }
    const onpil = (x) => {
      // x.qty = 1
      x.nomorProject = dt.p.nomorProject
      if (dt.detProject.find(a => a.kodeProduk === x.kodeProduk)) {
        root.$q.notify({ message: `${x.namaBarang} sudah di list...`, color: 'warning' })
      } else {
        // x.hargaSat = x.hargaRetail
        /* x.jmlHarga = x.hargaRetail
        x.jmlPoint = x.pointMember * x.jmlHarga / 100 */
        // x.nomorProject = dt.Project.nomorProject
        x.qtySPK = x.qty
        x.qtyInv = 0
        dt.detProject.push({ ...x })
      }
    }
    const onSaved = (x) => {
      if (x.kodeProduk) {
        x.qty = x.kemasan.isi * x.jmlKemasan
        x.hargaSat = x.hargaKemasan / x.kemasan.isi
        if (x.qty > x.stok) {
          x.qty = x.stok
          x.jmlKemasan = x.qty / x.kemasan.isi
          //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
          root.$q.notify({ message: `stok hanya tersedia ${x.stok} pcs`, color: 'purple' })
        }
        if (x.qty > x.sisa) {
          x.qty = x.sisa
          x.jmlKemasan = 0
          //          x.hargaSat = x.hargaSat > x.hpp ? x.hargaSat : x.hpp
          root.$q.notify({ message: `sisa permintaan hanya ${x.sisa} pcs`, color: 'purple' })
        }
        if (x.hargaSat < x.price1) {
          root.$q.notify({ message: `harga terlalu rendah...`, color: 'purple' })
          x.hargaSat = x.price1
          x.hargaKemasan = x.price1
        }
      }

      /* if (this.ppn === 'in') {
        x.ppn = this.$dwn.kali([x.dpp, 1 / 11])
      } else {
        x.ppn = this.$dwn.kali([x.dpp, 0.1])
      } */
      x.jmlHarga = root.$dwn.kali([x.qty, x.hargaSat])
      x.jmlPoint = x.pointMember > 0 && dt.cust.point === 'Y' ? root.$dwn.kali([x.qty, x.hargaSat, x.pointMember]) / 100 : 0
      x.dpp = x.jmlHarga
    }
    const onSave = (x) => {
      x.jmlHarga = x.qtySPK * x.hargaSat
      x.jmlKemasan = x.qtySPK
      x.hargaKemasan = x.hargaSat
      x.kemasan = x.kemasan || { isi: 1, kemasan: 'Pcs' }
      /*  postdetProject(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal-4' })
        }) */
      // simpan(x)
      /* if (dt.detProject.find(a => a.saldo < Number(a.qty)) && x.jasa !== 'Y') {
        dt.project.status = 'Part'
        upD(dt.project, 'Part', 'Part')
      } */
    }
    const simpan = async (x) => {
      let a
      try {
        a = await postdetProject(x)
        root.$q.notify({ message: a.st, color: 'teal-4' })
        return 'done'
      } catch (error) {
        root.$q.notify({ message: error.response.data.st, color: 'orange-4' })
      }
      /* postdetProject(x)
        .then(({ data }) => {
          root.$q.notify({ message: data.st, color: 'teal-4' })
          a = 'dono'
        })
        .catch(err => {
          root.$q.notify({ message: err.response.data.st, color: 'orange-4' })
          a = 'eror'
        }) */
    }
    const addProject = (x) => {
      x.kodePartner = dt.cust.kodePartner
      x.akunUangMuka = dt.jenisProject.find(a => a.jnsProject === x.jnsProject).akunUangmuka
      console.log(x.akunUangMuka)
      if (dt.cust.kodePartner && dt.detProject.length) {
        // const aa = { ...x }
        const formData = new FormData()
        // const blob = await new Blob([dt.potoabs], { type: 'image/png' })
        formData.append('potoSket', dt.potoSket, `${new Date().getTime()}x_${root.$store.state.auth.user.akun}.png`)
        // Object.keys(aa).forEach(key => formData.append(key, aa[key]))
        formData.append('hd', JSON.stringify(x))
        formData.append('det', JSON.stringify(dt.detProject))
        root.$axios.post('/inProject', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            onReset()
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
      } else {
        root.$q.notify({ message: 'Isi data pelanggan...', color: 'warning' })
      }
    }
    const dele = (x) => {
      const index = dt.detProject.indexOf(x)
      x.kodeCab = dt.p.kodeCab
      if (x.idprojectDetail) {
        delDetProject(x)
          .then(({ data }) => {
            root.$q.notify({ message: data.st, color: 'teal' })
            getdetProject(x)
              .then(({ data }) => {
                dt.detProject = data
              })
          })
          .catch(err => {
            root.$q.notify({ message: err.response.data.st, color: 'warning' })
          })
      } else {
        dt.detProject.splice(index, 1)
      }
    }
    const onReset = () => {
      dt.p = {
        tglMasuk: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        asalBahan: '',
        uangMuka: 0,
        akunBayar: '',
        materialCust: '--',
        catatan: '',
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        estJadi: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsProject: '',
        detOrder: []
      }
      dt.Project = {
        kodeCab: root.$store.state.auth.user.kodeCab,
        kodePartner: null,
        asalBahan: '',
        uangMuka: 0,
        akunBayar: '',
        materialCust: '',
        catatan: '',
        salesID: root.$store.state.auth.user.eID,
        estimasi: 1,
        jnsProject: ''
      }
      dt.detProject = []
      emit('done')
    }
    const partner = (x) => {
      dt.cust = x
      dt.p.kodePartner = x.kodePartner
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
    const base64toBlob = (base64Data, contentType) => {
      contentType = contentType || ''
      var sliceSize = 1024
      var byteCharacters = window.atob(base64Data)
      var bytesLength = byteCharacters.length
      var slicesCount = Math.ceil(bytesLength / sliceSize)
      var byteArrays = new Array(slicesCount)

      for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize
        var end = Math.min(begin + sliceSize, bytesLength)

        var bytes = new Array(end - begin)
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0)
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes)
      }
      return new Blob(byteArrays, { type: contentType })
    }
    const fileSket = (x) => {
      // console.log(x)
      /* const blob = base64toBlob(x, 'image/png')
      console.log(blob) */
      dt.gambar = window.URL.createObjectURL(x)
    }
    const selesai = (x) => {
      if (dt.detProject.some(a => a.qtyProd === 0)) {
        root.$q.notify({ message: 'Konsumsi belum diisi...', color: 'pink-4' })
      } else {
        root.$q.dialog({
          title: `Project ${x.nomorProject} selesai ?`,
          options: {
            type: 'radio',
            model: 'konfr',
            // inline: true
            items: [
              { label: 'Selesai', value: 'Selesai', color: 'secondary' },
              { label: 'Tutup', value: 'Tutup', color: 'yellow' }
            ],
            isValid: val => ['Selesai', 'Tutup'].some(a => a === val)
          },
          ok: {
            push: true
          },
          persistent: false
        }).onOk(async (data) => {
          if (data !== 'Tutup') {
            let sp = await simpan(dt.detProject)
            if (sp === 'done') {
              x.status = data
              x.cabID = x.kodeCab
              projectDone(x)
                .then(({ data }) => {
                  root.$q.notify({ message: data.st, color: 'teal' })
                  onReset()
                })
                .catch(err => {
                  root.$q.notify({ message: err.response.data.st, color: 'warning' })
                })
            }
          }
        })
      }
    }
    const editAble = computed(() => {
      let a = ['Baru', 'Proses', 'Approve'].some(s => s === dt.p.status)
      return a
    })
    const updateProject = (x) => {
      root.$q.dialog({
        html: true,
        title: `<span class="text-teal" >Konfirmasi update project ${x.nomorProject}</span>`,
        options: {
          type: 'radio',
          model: 'konfr',
          // inline: true
          items: [
            { label: 'Update', value: 'Update', color: 'teal' },
            { label: 'Tutup', value: 'Tutup', color: 'yellow' }
          ],
          isValid: val => ['Update', 'Tutup'].some(a => a === val)
        },
        ok: {
          push: true
        },
        persistent: false
      }).onOk((data) => {
        if (data !== 'Tutup') {
          upProject(x)
            .then(({ data }) => {
              root.$q.notify({ message: data.st, color: 'teal' })
              dt.editP = false
            })
            .catch(err => {
              root.$q.notify({ message: err.response.data.st, color: 'warning' })
            })
        }
      })
    }
    return { ...toRefs(dt), cekStoki, onSaved, updateProject, filterKn, onpil, dele, onSave, onReset, partner, filterFn, simpan, addProject, fileSket, selesai, base64toBlob, editAble }
  }
}
</script>
