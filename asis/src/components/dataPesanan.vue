<template>
  <div class="q-pb-md">
    <q-table
      class="dataPR"
      :data="statusPR === 'Closed' ? dtPR.filter(a =>  a.statusPR === 'Closed') : dtPR.filter(a =>  a.statusPR !== 'Closed')"
      :columns="jdl"
      row-key="nomorPR"
      :filter="cari"
      :pagination.sync="hal"
      dense>
      <template v-slot:top>
        <div class="col-2 q-table__title">Data Pesanan Masuk</div>
        <q-toggle
          v-model="statusPR"
          :label="`Status Pesanan ${statusPR}`"
          false-value="Closed"
          true-value="Open"
          />
        <q-space />
        <q-input dense debounce="300" v-model="cari" placeholder="Search">
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
        <!-- <q-btn
          v-if="['MAN','purchase'].every(a=> a != $store.state.auth.user.userType)"
          flat round dense
          icon="add_circle"
          @click="adP = true"
          class="q-ml-md"
          color="accent"
        /> -->
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props">
            <template v-if="col.name === 'nom'">
              <q-icon size="sm" color="orange-13" :name="props.expand ? 'expand_less' : 'expand_more'" @click="dtCek(props.row,props.expand),props.expand = !props.expand" />
            </template>
            <template v-else-if="col.name === 'statusPR'">
              <q-select
                v-model="props.row.statusPR"
                dense
                options-dense
                :options="['Release','Sebagian','Closed']"
                @input="updPR(props.row)"/>
            </template>
            <template v-else-if="col.name === 'act'">
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
                  <q-td align="right">{{ dt.qty }}</q-td>
                  <q-td align="right">{{ dt.kirim }}</q-td>
                  <q-td>
                    <q-icon name="send" color="teal" @click="ambil(dt,props.row)" />
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
              row-key="kodeProduk"
              dense>
              <template v-slot:top>
                <div class="col-4 q-table__title">Detail PR</div>
                <q-input filled v-model="pr.tglRequest" readonly>
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" v-if="['MAN','purchase'].some(a=> a== $store.state.auth.user.userType)">
                        <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
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
        <produk @dtStok="onpil"/>
      </q-card>
    </q-dialog>
    <q-dialog
      v-model="dPr">
      <q-table
        v-if="selected.length>0"
        class="detPR"
        :data="detPR"
        :columns="jdld"
        row-key="kodeProduk"
        dense>
        <template v-slot:top>
          Detail <q-chip outline>Nomor PR :{{ pr.nomorPR }}</q-chip>
          <q-input filled v-model="pr.tglRequest" readonly>
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy v-if="['MAN','purchase'].some(a=> a===$store.state.auth.user.userType)" ref="qDateProxy" transition-show="scale" transition-hide="scale">
                  <q-date v-model="pr.tglRequest" @input="() => $refs.qDateProxy.hide()" mask="YYYY-MM-DD" />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
          <q-input
            v-model="pr.keterangan"
            label="Keterangan"/>
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
              <q-icon name="send" color="teal" @click="ambil(props.row,pr)" />
              <q-icon name="close" color="red" @click="ondel(props.row)" />
            </q-td>
          </q-tr>
        </template>
      </q-table>
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
          <q-btn outline label="Data Pesanan A4" color="primary" @click="printA4(ctk)" />
          <q-btn outline label="Data Pesanan Kertas Ply" color="primary" @click="printW(ctk)" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { reactive, toRefs, onMounted } from '@vue/composition-api'
import { dtPesanan, detPR, addPR, rekPR, upPR, dtCab } from '../services/apiList'
import produk from '../components/stok'
export default {
  components: {
    produk
  },
  setup (props, { root, emit }) {
    const dt = reactive({
      dtPR: [],
      confirm: false,
      ctk: {},
      jdl: [
        { name: 'nom', label: 'check', align: 'left' },
        { name: 'kodeCab', label: 'Kode Cab', field: row => row.cabID, align: 'left' },
        { name: 'namaCabang', label: 'Cabang Pembeli', field: row => row.namaCabang, align: 'left' },
        { name: 'nomorPR', label: 'Nomor PR', field: row => row.nomorPR, align: 'left' },
        { name: 'tglRequest', label: 'Tanggal Request', field: row => row.tglRequest, align: 'left' },
        { name: 'keterangan', label: 'Keterangan', field: row => row.keterangan, align: 'left' },
        { name: 'partner', label: 'Pemasok', field: row => row.partner, align: 'left' },
        { name: 'statusPR', label: 'Status', field: row => row.statusPR, align: 'left' },
        { name: 'act', label: 'Act' }
      ],
      detPR: [],
      jdld: [
        { name: 'kodeProduk', label: 'Kode Produk', field: row => row.kodeProduk, align: 'left' },
        { name: 'namaBarang', label: 'Nama Produk', field: row => row.namaBarang, align: 'left' },
        { name: 'stok', label: 'Stok', field: row => row.stok, jml: 'Y', align: 'right' },
        { name: 'qty', label: 'Qty Request', field: row => row.qty, jml: 'Y', align: 'right' },
        { name: 'hargaSat', label: 'harga @', field: row => row.hargaSat, jml: 'Y', align: 'right' },
        { name: 'act', label: 'Act' }
      ],
      dtTrxPR: [],
      adP: false,
      dPr: false,
      inRul: [ v => !!v || 'Isi data' ],
      pr: { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01' },
      selected: [],
      cari: '',
      hal: { rowsPerPage: 10 },
      statusPR: 'Open',
      cabAll: []
    })
    const updPR = (x) => {
      console.log(x)
      upPR(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch((err) => {
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const dtCek = (x, y) => {
      console.log(y)
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
    const getPR = () => {
      dtPesanan()
        .then(res => {
          dt.dtPR = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const adQty = (x) => {
      x.qty = x.newQty
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
    const onReset = () => {
      dt.pr = { tglRequest: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10) }
      dt.detPR = []
    }
    const onpil = (x) => {
      let ax = [...x]
      dt.detPR = ax
    }
    const ambil = (x, y) => {
      emit('ambil', x, y)
      root.$q.notify({ message: `${x.namaBarang} terpilih...`, color: 'teal' })
    }
    const ondel = (item) => {
      const index = dt.detPR.indexOf(item)
      root.$q.dialog({
        title: `Hapus Detail`,
        message: `Hapus ${item.namaBarang} ?`,
        cancel: true,
        persistent: false
      }).onOk(() => {
        dt.detPR.splice(index, 1)
        /* if (item.iddetPR) {
          api.delPRd(item)
            .then(res => this.$q.notify({ message: 'Data tersimpan', color: 'success' }))
            .catch(err => this.$q.notify({ message: 'Gagal simpan...' }))
        } */
      })
    }
    onMounted(() => {
      getPR()
      dtCab()
        .then(({ data }) => {
          dt.cabAll = data
        })
    })
    const cetak = (x) => {
      dt.ctk = x
      dt.confirm = true
    }
    const printA4 = async (x) => {
      let detail = await detPR(x)
      let cab = dt.cabAll.find(cb => cb.kodeCab === x.cabLain)
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
        }
        </style>
        <body style="font-size: 11px">

          <table width='100%' id="tss" >
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
                    <td><b>Payment:</b><br/>14 Hari</td>
                    <td colspan="2">
                      <b>Customers:</b><br/> ${x.namaCabang}
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
            <tr>
              <td rowspan="" colspan="4" class="">
                <br/><br/>
                <table width='100%' id="table_product">
                  <tr>
                    <th>Deskripsi Barang</th>
                    <th width='10%'>QTY</th>
                  </tr>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
          <td>${(i + 1).toString().padStart(3, ' ')}. ${det.namaBarang}</td>
          <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
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
                    ${cab.namaCabang}
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
      let cab = dt.cabAll.find(a => a.kodeCab === x.cabLain)
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
              }
          </style>
          <body style="font-size: 11px">
          <table width='100%' id="tss" >
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
            <tr>
                <td colspan="4" class="bdr_btm">
                    <table width='100%'>
                        <tr>
                            <td width='3%'>No</td>
                            <td>Deskripsi Barang</td>
                            <td width='10%' align='right'>QTY</td>
                        </tr>`
      let dtDet = ''
      detail.data.forEach((det, i) => {
        dtDet += `<tr>
            <td>${i + 1}</td>
            <td>${det.namaBarang}</td>
            <td style="text-align:right">${new Intl.NumberFormat('en').format(Number(det.qty).toFixed(2))}</td>
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
                                ${cab.namaCabang}
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
    return { ...toRefs(dt), updPR, dtCek, adQty, addPRa, onpil, ambil, ondel, getdetPR, onReset, dtPesanan, cetak, printA4, printW }
  }
}
</script>
