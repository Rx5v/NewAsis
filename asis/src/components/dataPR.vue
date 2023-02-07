<template>
  <div class="q-pb-md">
    <q-table
      class="dataPR"
      :data="dtPR"
      :columns="jdl"
      row-key="nomorPR"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data PR</div>
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-btn
          flat round dense
          icon="add_circle"
          @click="tmbPR(filt)"
          class="q-ml-md"
          color="accent"
        />
        <!-- <q-select
          v-if="['MAN','purchase','acc'].some(a=> a== $store.state.auth.user.userType)"
          v-model="filt.kodeCab"
          :options="cabAll"
          :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
          option-value="kodeCab"
          options-dense
          emit-value
          map-options
          single
          style="min-width: 250px; max-width: 300px"
          label="Pilih cabang... "
          dense
          @input="getPR"
          lazy-rules>
        </q-select> -->
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
            <template v-else-if="col.name === 'ac'">
              <q-select
                v-model="props.row.ac"
                :options="['Y','N']"
                style="max-width: 300px"
                label="antar cabang..."
                dense
                @input="updPR(props.row,'Antar Cabang')"/>
            </template>
            <template v-else-if="col.name === 'cabLain'">
              <template v-if="['MAN','purchase', 'acc'].some(a=> a===$store.state.auth.user.userType) && props.row.ac==='Y'">
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
            <template v-else-if="col.name === 'statusPR'">
              <template v-if="['MAN','purchase','mitra','admin', 'acc'].some(a=> a===$store.state.auth.user.userType)">
                <q-select
                  v-model="props.row.statusPR"
                  dense
                  options-dense
                  :options="['Release','Sebagian','Closed']"
                  @input="updPR(props.row,'Status')"/>
              </template>
              <template v-else>
                {{ col.value }}
              </template>
            </template>
            <template v-else-if="col.name === 'act'">
              <q-btn
                flat round dense
                icon="add_circle"
                class="q-ml-md"
                color="teal"
                @click="addetPR(props.row)"
              />
              <q-btn icon-right="print" color="warning" size="sm" @click="cetak(props.row)"></q-btn>
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <template v-if="dtTrxPR.some(a=> a.nomorPR=== props.row.nomorPR)">
              <q-markup-table>
                <q-tr>
                  <q-th align="left">No</q-th>
                  <q-th align="left">Kode Produk</q-th>
                  <q-th align="left">Nama Produk</q-th>
                  <q-th>Qty Request</q-th>
                  <q-th>Terkirim</q-th>
                  <q-th>Act</q-th>
                </q-tr>
                <q-tr
                  v-for="(dt,i) in dtTrxPR.filter(a=> a.nomorPR === props.row.nomorPR)"
                  :key="dt.iddetTrans">
                  <q-td>{{ i+1 }}</q-td>
                  <q-td>{{ dt.kodeProduk }}</q-td>
                  <q-td>{{ dt.namaBarang }}</q-td>
                  <q-td align="right">{{ dt.qty }}
                    <q-popup-edit v-model="dt.qty" v-if="['MAN','purchase','mitra','acc','admin'].some(a=> a===$store.state.auth.user.userType)">
                      <q-input v-model="dt.qty" type="number" dense autofocus counter @change="updetPR(dt)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td align="right">{{ dt.kirim }}</q-td>
                  <q-td>
                    <q-btn icon="send" color="teal" @click="ambil(dt,props.row)" flat round dense/>
                    <q-btn
                      v-if="dt.kirim < 1 || dt.kirim === null"
                      flat round dense
                      icon="close"
                      class="q-ml-md" color="red" @click="delDet(dt,props.row)" />
                  </q-td>
                </q-tr>
              </q-markup-table>
            </template>
            <template v-else>
              <span style="font-style: italic; font-color: orange;">Belum ada pembelian untuk nomor PR {{ props.row.nomorPR }}</span>
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
     <q-dialog
      v-model="adP"
      full-width
      >
      <q-card>
        <q-card-section>
          <div class="text-h6">Permintaan Pembelian Barang</div>
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
              :pagination.sync="halaman"
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail PR</div>
                  <q-input filled v-model="pr.tglRequest" readonly>
                    <template v-slot:append>
                      <q-icon name="event" class="cursor-pointer">
                        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)">
                          <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                        </q-popup-proxy>
                      </q-icon>
                    </template>
                  </q-input>
                  <q-input
                    v-model="pr.keterangan"
                    label="Keterangan"
                    class="q-ml-md"
                    style="width: 500px"
                    :rules="inRul"/>
                <q-space/>
                <q-toggle
                  v-if="['MAN','purchase', 'acc'].some(a=> a== $store.state.auth.user.userType)"
                  v-model="pr.ac"
                  color="teal"
                  keep-color
                  false-value="N"
                  true-value="Y"
                  @input="pr.cabLain=''"
                  checked-icon="check"
                  label="Antar Cabang"
                  unchecked-icon="clear"
                />
                <q-select
                  v-if="pr.ac==='Y'"
                  v-model="pr.cabLain"
                  :options="cabAll"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  emit-value
                  map-options
                  style="min-width: 250px; max-width: 300px"
                  label="Partner"
                  class="q-ml-md"
                  dense
                  lazy-rules/>
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
                      <q-input v-model="props.row.newQty" dense autofocus counter @input="adQty(props.row)"/>
                    </q-popup-edit>
                  </q-td>
                  <q-td key="act"  :props="props">
                    <q-icon name="send" color="teal" @click="ambil(props.row)" />
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
        <produk @dtStok="onpil" :cabang="filt.kodeCab" ref="stokPrd"/>
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
              Detail <q-chip outline>Nomor PR :{{ pr.nomorPR }}</q-chip>
              <q-input filled v-model="pr.tglRequest" readonly/>
                <!-- <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                      <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input> -->
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
                <q-td key="hargaSat" :props="props">
                  {{ props.row.hargaSat | duit }}
                  <q-popup-edit v-model="props.row.hargaSat">
                    <q-input v-model="props.row.hargaSat" dense autofocus counter  @change="onSave(props.row)"/>
                  </q-popup-edit>
                </q-td>
                <q-td key="act"  :props="props">
                  <template v-if="['MAN','purchase','acc'].some(a=> a===$store.state.auth.user.userType)">
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
    <q-dialog
      v-model="crB">
      <cariProduk @dtProduk="tmb"/>
    </q-dialog>
    <q-dialog v-model="confirm" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="print" color="primary" text-color="white" />
          <span class="q-ml-sm">Menu Cetak : #{{ ctk.nomorPR }}</span>
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
  </div>
</template>

<script>
import { dtPR, detPR, addPR, rekPR, upPR, dtCab, editPRd, delPRd } from '../services/apiList'
import { reactive, toRefs, computed, watch } from '@vue/composition-api'
import produk from '../components/stok'
import cariProduk from './cariProduk'
export default {
  components: {
    produk,
    cariProduk
  },
  setup (props, { root, emit, refs }) {
    const dt = reactive({
      detP: { nomorPR: '' },
      crB: false,
      dtPR: [],
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'cabID', label: 'Kode Cab', field: row => row.cabID, align: 'left', sortable: true },
        { name: 'namaCabang', label: 'Nama Cabang', field: row => row.namaCabang, align: 'left', sortable: true },
        { name: 'nomorPR', label: 'Nomor PR', field: row => row.nomorPR, align: 'left', sortable: true },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left', sortable: true },
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'left', sortable: true },
        { name: 'ac', label: 'Antar Cabang', field: row => row.ac, align: 'left', sortable: true },
        { name: 'cabLain', label: 'Partner', field: row => row.cabLain, align: 'left', sortable: true },
        { name: 'statusPR', label: 'Status', field: row => row.statusPR, align: 'left', sortable: true },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      dPr: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), ac: 'N', cabLain: '', keterangan: '' },
      category: [
        { label: 'Printer', value: '1' },
        { label: 'Tinta', value: '2' },
        { label: 'Laptop', value: '3' },
        { label: 'Komputer', value: '4' }
      ],
      selected: [],
      cari: '',
      filt: { kodeCab: root.$store.state.auth.user.kodeCab },
      cabAll: [],
      hal: { rowsPerPage: 10 },
      halaman: { rowsPerPage: 0 },
      ctk: {},
      confirm: false
    })
    dtCab().then(res => {
      dt.cabAll = res.data
    })
    const getPR = () => {
      if (dt.filt.kodeCab) {
        dtPR(dt.filt)
          .then(res => {
            dt.dtPR = res.data
          })
          .catch((err) => {
            console.log(err)
          })
      }
    }
    watch(() => root.$store.state.auth.setCabang, (newVal) => {
      dt.filt.kodeCab = newVal
      getPR()
    })
    const updPR = (x, y) => {
      root.$q.dialog({
        title: `Update PR`,
        message: `Update ${y} ?`,
        cancel: true,
        persistent: true
      }).onOk(() => {
        upPR(x)
          .then(res => {
            root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
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
          if (a.nomorPR === x.nomorPR.toString()) {
            c.splice(b)
          }
        })
        rekPR(x)
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
    }
    const onReset = () => {
      dt.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), ac: 'N', cabLain: '', keterangan: '', kodeCab: root.$store.state.auth.setCabang }
      dt.detPR = []
      refs.stokPrd.selected = []
    }
    const addPRa = (x) => {
      if (dt.detPR.every(a => a.qty > 0)) {
        addPR({ hd: x, det: dt.detPR })
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
      detPR(x)
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
      let ax = [...x]
      dt.detPR = ax
    }
    const addetPR = (x) => {
      dt.crB = true
      dt.detP.nomorPR = x.nomorPR
    }
    const tmb = (x) => {
      if (x.kodeProduk) {
        x.nomorPR = dt.detP.nomorPR
        x.kirim = 0
        x.qty = 0
        x.iddetPR = null
        let a = dt.dtTrxPR.find(s => s.kodeProduk === x.kodeProduk && s.nomorPR === x.nomorPR)
        if (a) {
          root.$q.notify({ message: `${x.namaBarang} ini sudah ada di PO: ${x.nomorPR}`, color: 'orange' })
        } else {
          dt.dtTrxPR.push(x)
        }
      }
    }
    const updetPR = (x) => {
      editPRd(x)
        .then(({ data }) => {
          if (data.id > 0) {
            x.iddetPR = data.id
          }
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
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
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      }
    }
    const totalPesanan = computed(() => {
      let x = {
        totalHarga: dt.detPR.reduce((a, b) => root.$dwn.jumlah([a, b.qty * b.hargaSat]), 0)
      }
      return x
    })
    getPR()
    const cetak = (x) => {
      dt.ctk = x
      dt.confirm = true
    }
    const delDet = (x) => {
      root.$q.dialog({
        title: `Hapus Detail PR`,
        message: `Hapus <span class="text-orange">${x.namaBarang}</span> dari PO:<span class="text-orange"> ${x.nomorPR} </span>?`,
        cancel: true,
        html: true,
        persistent: false
      }).onOk(() => {
        if (x.iddetPR) {
          delPRd(x)
            .then(({ data }) => {
              root.$q.notify({ message: `${data.st}`, color: 'teal' })
            })
            .catch((err) => {
              root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
            })
        }
        let idx = dt.dtTrxPR.indexOf(x)
        dt.dtTrxPR.splice(idx, 1)
      })
    }
    const printA4 = async (x) => {
      let detail = await detPR(x)
      let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabID)
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
                      <b>${cab.telp}</b>
                    </td>
                  </tr>
                </table>
              </td>
              <td align='right'>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="">
                <table width='100%' class="bdr_top">
                  <tr>
                    <td colspan="4">
                      <h1>
                        <b>PR #${x.nomorPR}</b>
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td width="15%"><b>Date Ordered:</b><br/>${new Date(x.tglRequest).toLocaleString('en-GB').slice(0, 10)}</td>
                    <td></td>
                    <td>
                      <b>Pemasok: </b><br/>
                      ${x.partner || 'Purchasing'}
                    </td>
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
                    <th width='10%'>QTY</th>
                  </tr>
                  </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
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
                          
                        </i>
                      </b>
                      <div style='border : 1px dotted #000000; padding:10px' width='60%'>
                        
                      </div>
                    </td>
                    <td align="right" valign="top">
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
          <button type=button onclick='window.print();'>Cetak Bukti PR</button>
        </div>

        </body>
        </html>`
      html += dtDet + ttp
      wd.document.open()
      wd.document.write(html)
      wd.document.close()
    }
    const printW = async (x) => {
      let detail = await detPR(x)
      let cab = dt.cabAll.find(a => a.kodeCab === x.cabID)
      let wd = window.open('', 'transPrint', 'resize = 1')
      let html = `<html><head>`
      let dtPrint = `
        <title>Bukti Pesanan Pembelian ${x.nomorPR}</title>
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
                                <b>Bukti Pesanan Pembelian</b>
                            </td>
                        </tr>
                        <tr>
                            <td width="35%">ID PR</td>
                            <td>: ${x.nomorPR}</td>
                        </tr>
                        <tr>
                            <td>Tanggal </td>
                            <td>: ${x.tglRequest}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                    </table>
                </td>
            </tr>
            </thead>
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                      <thead class="report-header">
                        <tr>
                            <td class="bdr_btm" width='3%'>No</td>
                            <tdclass="bdr_btm" >Deskripsi Barang</td>
                            <td class="bdr_btm" width='10%' align='right'>QTY</td>
                        </tr>
                      </thead>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td align='right'>${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
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
                            <!--
                                Barang telah di terima dalam kondisi baik dan cukup. <br>
                                Nota ini sekaligus sebagai kartu garansi. Garansi tidak berlaku bila nota hilang/rusak.<br>
                                <b>BCA 0130935010 a.n. PT. ASTON PRINTER INDONESIA</b>
                                -->
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
                                Disetujui Oleh<br/>
                                <br/><br/><br/><br/>
                                ${root.$store.state.auth.user.nama}
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
            <button type=button onclick='window.print();'>Cetak Bukti Pesanan Pembelian</button>
        </div>`
      html += dtPrint + dtDet + ttp + '</body></html>'
      wd.document.open()
      wd.document.write(html)
      wd.document.close()
    }
    const tmbPR = (x) => {
      dt.pr.kodeCab = x.kodeCab
      dt.adP = true
    }
    return { ...toRefs(dt), tmbPR, cetak, printA4, printW, updPR, dtCek, adQty, addPRa, onpil, ambil, ondel, getdetPR, onReset, getPR, totalPesanan, addetPR, tmb, updetPR, delDet }
  }
}
</script>
