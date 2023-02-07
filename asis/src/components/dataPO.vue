<template>
  <div class="q-pb-md">
    <q-table
      class="dataTrx"
      :data="filt.status === 'Closed' ? dtPR.filter(a=> a.statusPO === 'Closed') : dtPR.filter(a=> a.statusPO !== 'Closed')"
      :columns="jdl"
      row-key="idPO"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Pesanan Pelanggan</div>
        <div >
          <div >Belum Terkirim => Year to date</div>
          <q-separator color="orange" spaced/>
          <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.tahun).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
          <q-separator color="orange" spaced/>
        </div>
        <div>
          <div>Belum Terkirim => {{ periode }} Berjalan</div>
          <q-separator color="orange" spaced/>
          <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.periode).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
          <q-separator color="orange" spaced/>
        </div>
        <q-space />
        <q-select
          v-model="filt.status"
          dense
          options-dense
          :options="['Open','Closed']"/>
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
          color="accent"
        />
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props">
            <template v-if="col.name === 'nom'">
              <q-icon size="md" color="warning" :name="props.expand ? 'expand_less' : 'expand_more'" @click="dtCek(props.row,props.expand),props.expand = !props.expand" />
            </template>
            <template v-else-if="col.name === 'cabLain'">
              <template v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType) && props.row.ac==='Y'">
                <q-select
                  v-model="props.row.cabLain"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Pilih cabang... "
                  dense
                  @input="updPR(props.row,'Partner')"/>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </template>
            <template v-else-if="col.name === 'statusPO'">
              <template>
                <q-select
                  :disable="!['MP01', 'AM01'].some(a=> a== $store.state.auth.user.kodeCab)"
                  v-model="props.row.statusPO"
                  dense
                  options-dense
                  :options="['Release','Sebagian','Closed']"
                  @input="updPR(props.row,'Status')"/>
              </template>
            </template>
            <template v-else-if="col.name === 'act'">
              <q-btn
                flat round dense
                icon="add_circle"
                class="q-ml-md"
                color="teal"
                @click="addetPO(props.row)"
              />
              <q-btn
                v-if="!props.row.nomorPR"
                round dense
                label="PR"
                class="q-ml-md"
                color="blue-4"
                @click="buatPR(props.row)"
              />
              <q-btn v-if="props.row.statusPO !== 'Closed'" icon-right="print" :color="props.row.statusPO==='Release' ? 'teal' : 'warning'" size="sm" @click="cetak(props.row)"></q-btn>
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="dtTrxPR.some(a=> a.nomorPO=== props.row.nomorPO)">
              <q-markup-table>
                <q-tr>
                  <q-th align="left">No</q-th>
                  <q-th align="left">Kode Produk</q-th>
                  <q-th align="left">Nama Produk</q-th>
                  <q-th>Stok</q-th>
                  <q-th>Qty Request</q-th>
                  <q-th>Harga @</q-th>
                  <q-th>Jumlah Harga</q-th>
                  <q-th>Terkirim</q-th>
                  <q-th>Act</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt,i) in dtTrxPR.filter(a=> a.nomorPO === props.row.nomorPO)"
                  :key="dt.iddetTrans">
                  <q-td>{{ i+1 }}</q-td>
                  <q-td>{{ dt.kodeProduk }}</q-td>
                  <q-td>{{ dt.namaBarang }}</q-td>
                  <q-td align="right">{{ dt.stok }}</q-td>
                  <q-td align="right">{{ dt.qty }}
                    <q-popup-edit v-model="dt.qty" v-if="props.row.statusPO === 'Open'">
                      <q-input v-model="dt.qty" type="number" dense autofocus counter @change="updetPO(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">
                    <q-chip color="red" outline>{{ dt.hargaJual | duit}}</q-chip>
                    <q-popup-edit v-model="dt.hargaJual" v-if="props.row.statusPO === 'Open'">
                      <q-input v-model="dt.hargaJual" type="number" dense autofocus counter @change="updetPO(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">{{ dt.hargaJual * dt.qty  | duit }}</q-td>
                  <q-td align="right">{{ dt.kirim }}</q-td>
                  <q-td>
                    <q-btn icon="send" color="teal" @click="ambil(dt,props.row)" flat round dense/>
                    <q-btn
                      v-if="dt.kirim < 1 || dt.kirim === null"
                      flat round dense
                      icon="close"
                      class="q-ml-md" color="red" @click="delPod(dt,props.row)" />
                  </q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              <span style="font-style: italic; font-color: orange;">Belum ada pembelian untuk nomor PR {{ props.row.nomorPO }}</span>
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
<!--     <q-card dense class="fit" >
      <div class="text-h6 text-white q-pl-md q-pt-md bg-teal-6">Pesanan Belum Terkirim</div>
      <q-separator />
      <q-card-section horizontal class="q-pa-md row wrap q-gutter-xs justify-between">
        <div class="col-md-5">
          <div >Year to date</div>
          <q-separator color="orange" spaced/>
          <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.tahun).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
          <q-separator color="orange" spaced/>
        </div>
        <div class="col-md-5">
          <div>{{ periode }} Berjalan </div>
          <q-separator color="orange" spaced/>
          <q-input dense readonly rounded outlined color="orange" :value="new Intl.NumberFormat('en').format(Number(blmPos.periode).toFixed(0))" input-class="text-h6 text-right text-orange" label="Pesanan" />
          <q-separator color="orange" spaced/>
        </div>
      </q-card-section>
    </q-card> -->
    <q-dialog
      v-model="adP"
      full-width
      >
      <q-card>
        <q-card-section>
          <div class="text-h6">Pesanan Pelanggan</div>
        </q-card-section>
        <q-card-section>
          <q-form
            @submit="addPRa(pr)"
            @reset="onReset"
            class="q-gutter-md">
            <q-table
              class="detPR"
              :data="detPR"
              :columns="jdld"
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail Pesanan</div>
                <q-input filled v-model="pr.tglRequest" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                        <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-space/>
                <q-input :value="cust.namaPartner" label="Customer" :hint="`alamat : ${cust.alamat}`" dense lazy-rules :rules="inRul" readonly @click="crp = true"/>
                <q-dialog v-model="crp" persistent>
                  <q-card style="min-width: 350px">
                    <q-card-section>
                      <div class="text-h6">Nama Customer</div>
                    </q-card-section>
                    <q-card-section class="q-pt-none">
                      <cariPartner @dtPartner="partner" :pil="false"/>
                    </q-card-section>
                    <q-card-actions align="right" class="text-primary">
                      <q-btn flat label="Cancel" v-close-popup />
                      <q-btn flat label="Pilih" v-close-popup />
                    </q-card-actions>
                  </q-card>
                </q-dialog>
                <q-chip color="teal">Total Pesanan : {{ totalPesanan.jmlHarga | duit }}</q-chip>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td key="kodeProduk" :props="props">
                    {{ props.row.kodeProduk }}
                  </q-td>
                  <q-td key="namaBarang" :props="props">
                    {{ props.row.namaBarang }}
                  </q-td>
                  <q-td key="stok" :props="props">
                  </q-td>
                  <q-td key="qty" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.qty }}</q-chip>
                    <q-popup-edit v-model="props.row.qty">
                      <q-input v-model="props.row.newQty" type="number" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="hargaJual" :props="props" align="right">
                    <q-chip color="red" outline>{{ props.row.hargaJual | duit}}</q-chip>
                    <q-popup-edit v-model="props.row.hargaJual">
                      <q-input v-model="props.row.hargaJual" type="number" dense autofocus counter/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="jmlHarga"  :props="props" align="right">
                    {{ props.row.jmlHarga | duit}}
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div align="right">
              <q-btn label="Submit" type="submit" color="primary"/>
              <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
            </div>
          </q-form>
        </q-card-section>
        <produk @dtStok="onpil"/>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="dPr">
      <q-card>
          <q-table
            v-if="selected.length>0"
            class="detPR"
            :data="detPR"
            :columns="jdld"
            row-key="kodeProduk"
            dense>
            <template v-slot:top>
              Detail <q-chip outline>Nomor PO :{{ pr.nomorPO }}</q-chip>
              <q-input filled v-model="pr.tglRequest" readonly/>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="kodeProduk" :props="props">
                  {{ props.row.kodeProduk }}
                </q-td>
                <q-td key="namaBarang" :props="props">
                  {{ props.row.namaBarang }}
                </q-td>
                <q-td key="qty" :props="props">
                  {{ props.row.qty }}
                  <q-popup-edit v-model="props.row.qty">
                    <q-input v-model="props.row.qty" dense autofocus counter />
                  </q-popup-edit>
                </q-td>
                <q-td key="hargaJual" :props="props">
                  {{ props.row.hargaJual | duit }}
                  <q-popup-edit v-model="props.row.hargaJual">
                    <q-input v-model="props.row.hargaJual" dense autofocus counter  @change="onSave(props.row)"/>
                  </q-popup-edit>
                </q-td>
                <q-td key="act"  :props="props">
                  <template v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)">
                    <q-icon name="send" color="teal" @click="ambil(props.row,pr)" />
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </template>
                  <template v-else-if="pr.cabID === $store.state.auth.user.kodeCab">
                    <q-icon name="close" color="red" @click="ondel(props.row)" />
                  </template>
                  <template v-else>
                    <q-icon name="send" color="teal" @click="ambil(props.row,pr)" />
                  </template>
                </q-td>
              </q-tr>
            </template>
          </q-table>
      </q-card>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorPO }}</span>
          <q-space/>
          <q-btn round
            icon="close"
            color="red"
            v-close-popup/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn outline label="Invoice A4" color="primary" @click="printA4(ctk)" />
          <q-btn outline label="Invoice Kertas Ply" color="primary" @click="printW(ctk)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="crB">
      <cariProduk @dtProduk="tmbDetPO"/>
    </q-dialog>
    <q-dialog
      v-model="cpPR">
      <copyPR :pra="pr" :detPRa="detPR" @ttp="cpPR = false, getPR()"/>
    </q-dialog>
  </div>
</template>

<script>
import { dtPO, detPO, addPO, rekPO, upPO, editPOd, getBankCab, dtCab, delPOd, rkpPOnew } from '../services/apiList'
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
import produk from '../components/stokSatu'
import cariPartner from '../components/cariPartner'
import cariProduk from './cariProduk'
import copyPR from './addPR'
export default {
  components: {
    produk,
    cariPartner,
    cariProduk,
    copyPR
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      cpPR: false,
      crB: false,
      detP: { nomorPO: '' },
      dtPR: [],
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'nomorPO', label: 'Nomor PO', field: row => row.nomorPO, align: 'left' },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left' },
        { name: 'kodePartner', label: 'Kode Partner', field: row => row.kodePartner, align: 'left' },
        { name: 'namaPartner', label: 'Nama Partner', field: row => row.namaPartner, align: 'left' },
        { name: 'totalHarga', label: 'Total Harga', field: row => row.totalHarga, jml: 'Y', format: val => new Intl.NumberFormat('en-ID', { style: 'currency', currency: 'IDR' }).format(val), align: 'right' },
        { name: 'statusPO', label: 'Status', field: row => row.statusPO, align: 'left' },
        { name: 'namaSales', label: 'Nama Sales', field: row => row.namaSales, align: 'left' },
        { name: 'nomorPR', label: 'Nomor PR', field: row => row.nomorPR, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'stok', label: 'Stok', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaJual', label: 'harga @', field: row => row.hargaJual, jml: 'Y', align: 'right' },
        { name: 'jmlHarga', label: 'Jumlah Harga', field: row => row.jmlHarga, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      dPr: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: {
        tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        ac: 'N',
        cabLain: '',
        kodePartner: '',
        namaCabang: '',
        alamatCabang: '',
        salesID: root.$store.state.auth.user.eID
      },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      crp: false,
      filt: {
        kodeCab: [],
        status: 'Open',
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) },
      cabAll: [],
      hal: { rowsPerPage: 10 },
      cust: { namaPartner: '', alamat: '' },
      ctk: {},
      confirm: false,
      blmPos: { periode: 0, tahun: 0 }
    })
    const periode = computed(() => {
      return dt.filt.tgla.slice(0, 7) === dt.filt.tglb.slice(0, 7) ? 'Bulan' : 'Periode'
    })
    dtCab().then(res => {
      dt.cabAll = res.data
    })
    const getPR = () => {
      dtPO(dt.filt)
        .then(res => {
          dt.dtPR = res.data
        })
        .catch((err) => {
          console.log(err)
        })
      rkpPOnew(dt.filt)
        .then(({ data }) => {
          dt.blmPos.periode = data.periode.length && data.periode.reduce((a, b) => a + b.jmlHarga, 0)
          dt.blmPos.tahun = data.tahun && data.tahun.jmlHarga
        })
    }
    watch(() => root.$store.state.auth.setCabang, (newVal) => {
      dt.filt.kodeCab = [newVal]
      getPR()
    })
    const addetPO = (x) => {
      dt.crB = true
      dt.detP.nomorPO = x.nomorPO
    }
    const tmbDetPO = (x) => {
      if (x.kodeProduk) {
        x.nomorPO = dt.detP.nomorPO
        x.kirim = 0
        x.qty = 0
        x.hargaJual = x.hargaRetail
        x.iddetPO = null
        let a = dt.dtTrxPR.find(s => s.kodeProduk === x.kodeProduk && s.nomorPO === x.nomorPO)
        if (a) {
          root.$q.notify({ message: `${x.namaBarang} ini sudah ada di PO: ${x.nomorPO}`, color: 'orange' })
        } else {
          dt.dtTrxPR.push(x)
        }
      }
    }
    const updPR = (x, y) => {
      root.$q.dialog({
        title: `Update PO`,
        message: `Update ${y} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        upPO(x)
          .then(({ data }) => {
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
          })
          .catch((err) => {
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const dtCek = (x, y) => {
      if (!y) {
        dt.dtTrxPR.forEach((a, b, c) => {
          if (a.nomorPO === x.nomorPO.toString()) {
            c.splice(b)
          }
        })
        rekPO(x)
          .then(res => {
            dt.dtTrxPR.push(...res.data)
          })
          .catch(err => {
            console.log(err)
          })
      }
    }
    const adQty = (x) => {
      x.qty = x.newQty
      x.jmlHarga = x.qty * x.hargaJual
    }
    const onReset = () => {
      dt.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), salesID: root.$store.state.auth.user.eID }
      dt.detPR = []
      dt.cust = { namaPartner: '', alamat: '' }
    }
    const addPRa = (x) => {
      x.cabID = root.$store.state.auth.setCabang
      if (dt.detPR.every(a => a.qty > 0)) {
        addPO({ hd: x, det: dt.detPR })
          .then(res => {
            onReset()
            getPR()
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      } else {
        root.$q.notify({ message: `isi detail dan qty dulu...`, color: 'purple' })
      }
    }
    const getdetPR = (x) => {
      dt.dPr = true
      dt.pr = x
      dt.selected = [x]
      dt.detPR = []
      detPO(x)
        .then(res => {
          dt.detPR = res.data
          let e = Object.assign({}, x)
          emit('dtBrg', e)
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onpil = (x) => {
      let ada = dt.detPR.find(a => a.kodeProduk === x.kodeProduk)
      let ax = { ...x } // x.filter(a => ada.every(s => s !== a.kodeProduk))
      if (ax && !ada) {
        let sx = { ...ax }
        sx.hargaJual = sx.hargaRetail
        dt.detPR.push(sx)
      }
    }
    const ambil = (x, y) => {
      emit('ambil', x, y)
      root.$q.notify({ message: `${x.namaBarang} terpilih...`, color: 'teal' })
    }
    const ondel = (item) => {
      const index = dt.detPR.indexOf(item)
      let cf = confirm(`Hapus ${item.kodeProduk} ?`)
      if (cf) {
        dt.detPR.splice(index, 1)
      }
    }
    const delPod = (x) => {
      root.$q.dialog({
        title: `Hapus Detail PO`,
        message: `Hapus <span class="text-orange">${x.namaBarang}</span> dari PO:<span class="text-orange"> ${x.nomorPO} </span>?`,
        cancel: true,
        html: true,
        persistent: false
      }).onOk(() => {
        if (x.iddetPO) {
          delPOd(x)
            .then(res => {
              root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
            })
            .catch((err) => {
              root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
            })
        }
        let idx = dt.dtTrxPR.indexOf(x)
        dt.dtTrxPR.splice(idx, 1)
      }).onCancel(() => {
        // console.log('>>>> Cancel')
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const partner = (x) => {
      dt.cust = x
      dt.pr.kodePartner = x.kodePartner
    }
    const totalPesanan = computed(() => {
      let x = {
        jmlHarga: dt.detPR.reduce((a, b) => root.$dwn.jumlah([a, b.qty * b.hargaJual]), 0)
      }
      return x
    })
    getPR()
    const cetak = (x) => {
      dt.ctk = x
      dt.confirm = true
    }
    const printA4 = async (x) => {
      let { data } = await getBankCab(x.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let detail = await detPO(x)
      let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabID)
      let diskon = x.diskon || 0
      let tHarga = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.hargaJual * b.qty]), 0)
      let wd = window.open('', 'InvoiceA4', 'resize = 1')
      let html = `<html>
        <title>Cetak Pesanan Penjualan</title>
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

          <table width='100%' id="tss" class="report-container" >
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
                      <b>${cab.telp}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
                <table width="100%" >
                  <tr>
                    <td colspan="4">
                      <b><i>CUSTOMER</i></b>
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
                    <td colspan="4">
                      <h1>
                        <b>Order #${x.nomorPO}</b>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td width="15%"><b>Date Ordered:</b><br/>${new Date(x.tglRequest).toLocaleString('en-GB').slice(0, 10)}</td>
                     <td width="15%"><b>Salesperson:</b><br/>${x.namaSales || ''}</td>
                    <td><b>Payment:</b><br/>14 Hari</td>
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
                    <th width='10%' style="text-align:right">QTY</th>
                    <th width='10%' style="text-align:right">Harga</th>
                    <th width='10%' style="text-align:right">Jumlah</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))} ${det.satuan}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.hargaJual).toFixed(2))}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.hargaJual * det.qty).toFixed(2))}</td>
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
                      <b>
                        <i>
                          Terbilang : ${root.$dwn.bilang(tHarga)}
                        </i>
                      </b>
                      <div style='border : 1px dotted #000000; padding:10px' width='60%'>
                        Note : Pembayaran dapat dilakukan melalui:
                        <ul>
                          ${bankCabang}
                        </ul>
                      </div>
                    </td>
                    <td align="right" valign="top">
                      <table width="100%" >
                        <td width='50%' align='right'><b>Total</b></td>
                        <td width='50%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tHarga).toFixed(2))}</b></td>
                          <tr>
                            <td align='right'><b>Uang Muka</b></td>
                            <td align='right'><b></b></td>
                          </tr>
                          <tr>
                            <td align='right'><b>Diskon</b></td>
                            <td align='right'><b><span contenteditable="">${new Intl.NumberFormat('en').format(Number(x.diskon || 0).toFixed(2))}</span></b></td>
                          </tr>
                          <tr>
                            <td align='right'><b>Jumlah Pembayaran</b></td>
                            <td align='right'><b>${new Intl.NumberFormat('en').format(Number(root.$dwn.jumlah([tHarga, -diskon])).toFixed(2))}</b></td>
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
                    <td >

                  </td>
                  <td width='33.3%' align='center'>
                  </td>
                  <td width='33.3%' align='center'>
                    Di Buat Oleh<br/>
                    <br/><br/><br/><br/>
                    ${root.$store.state.auth.user.nama}
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
          <button type=button onclick='window.print();'>Cetak Nota Penjualan</button>
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
    const printW = async (x) => {
      let { data } = await getBankCab(x.cabID)
      let bankCabanga = data.map(s => {
        let ss = `<li>${s.namaBank}: ${s.rekening} a.n ${s.atasNama}</li>`
        return ss
      })
      let bankCabang = await bankCabanga.toString().replace(/,/g, '')
      let detail = await detPO(x)
      let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabID)
      let tHarga = detail.data.reduce((a, b) => root.$dwn.jumlah([a, b.hargaJual * b.qty]), 0)
      let wd = window.open('', 'transPrint', 'resize = 1')
      let html = `<html><head>`
      let dtPrint = `
        <title>Transaksi Penjualan ${x.nomorPO}</title>
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
          <table width='100%' id="tss" class="report-container" >
            <thead class="report-header"> 
              <tr>
                <td colspan="3" width='60%' class="bdr_btm" valign="top">
                    <table width="100%">
                        <tr>
                            <td>
                                <b>${cab.namaCabang.toUpperCase()}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.alamatCabang}</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <b>${cab.telp}</b>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="bdr_btm" align='right'>
                    <table width="100%" >
                        <tr>
                            <td colspan="4">
                                <b>NOTA PESANAN</b>
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID Pesanan</td>
                            <td>: ${x.nomorPO}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${x.tglRequest}</td>
                        </tr>
                        <tr>
                            <td>Pembayaran </td>
                            <td>: Tempo</td>
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
                            <td>: ${x.tlp || ''}</td>
                            <td valign="top"></td>
                            <td></td>
                        </tr>
                    </table>
                </td>
              </tr>
            </thead>
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
                        </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td>${det.keterangan || ''}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))} ${det.satuan}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.hargaJual).toFixed(2))}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.hargaJual * det.qty).toFixed(2))}</td>
        </tr>`
      })
      let ttp = `</table>
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
                            </td>
                            <td align="right" valign="top">
                                <table width="100%" >
                                    <td width='40%' align='right'><b>Total</b></td>
                                    <td width='60%' align='right'><b>${new Intl.NumberFormat('en').format(Number(tHarga).toFixed(2))}</b></td>
                                        <tr>
                                            <td align='right'><b>Uang Muka</b></td>
                                            <td align='right'><b>0</b></td>
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
                                Diterima Oleh<br/>
                                <br/><br/><br/><br/>
                                
                            </td>
                            <td width='33.3%' align='center'>
                            </td>
                            <td width='33.3%' align='center'>
                                Di Buat Oleh<br/>
                                <br/><br/><br/><br/>
                                ${root.$store.state.auth.user.nama}
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
            <button type=button onclick='window.print();'>Cetak Nota Penjualan</button>
        </div>`
      html += dtPrint + dtDet + ttp + '</body></html>'
      if (typeof cordova !== 'undefined') {
        cordova.plugins.printer.print(html)
      } else {
        wd.document.open()
        wd.document.write(html)
        wd.document.close()
      }
    }
    const updetPO = (x) => {
      editPOd(x)
        .then(({ data }) => {
          if (data.id > 0) {
            x.iddetPO = data.id
          }
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const buatPR = async (x) => {
      try {
        dt.pr = x
        const det = await detPO(x)
        if (det) {
          dt.detPR = det.data
          dt.cpPR = true
          dt.dPr = false
        }
      } catch (error) {
        root.$q.notify({ message: 'Belum tersedia...', color: 'pink' })
      }
    }
    return { ...toRefs(dt),
      buatPR,
      tmbDetPO,
      cetak,
      printA4,
      updetPO,
      updPR,
      dtCek,
      adQty,
      addPRa,
      onpil,
      ambil,
      ondel,
      getdetPR,
      onReset,
      getPR,
      partner,
      printW,
      totalPesanan,
      delPod,
      addetPO,
      periode
    }
  }
}
</script>
