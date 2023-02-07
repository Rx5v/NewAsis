<template>
  <q-card>
    <q-card-section>
      <q-toolbar>
        <q-toolbar-title>Detail Transaksi Keuangan</q-toolbar-title>
      </q-toolbar>
    </q-card-section>
    <q-card-section>
      <q-table
        :data="detJurr"
        :columns="jdl"
        dense
        separator="cell"
        :pagination.sync="myPagination"
        row-key="iddetJur"
        class="dataPR">
        <template v-slot:top>
            <q-input filled :value="jhr.tglJurnal" label="Tanggal" dense lazy-rules readonly/>
            <q-chip outline>{{jhr.nomorJurnal}}
                <!-- <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy ref="qDateProxye" transition-show="scale" transition-hide="scale">
                    <q-date v-model="jh.tglBaru" @input="ubahTrx(jh), () => $refs.qDateProxye.hide()" mask="YYYY-MM-DD" lazy-rules :rules="inRul"/>
                  </q-popup-proxy>
                </q-icon> -->
            </q-chip>
            <q-space/>
            <q-chip>{{ detJurr.length ? detJurr[0].judulJurnal : jhr.judulJurnal }}
              <q-popup-edit v-model="jhr.judulJurnal" @save="ubahTrx(jhr)" buttons>
                <q-input v-model="jhr.judulJurnal" label="Judul Jurnal" style="width: 300px"/>
              </q-popup-edit>
            </q-chip>
            <!-- <q-btn
              v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
              flat round dense
              icon="add_circle"
              @click="plus"
              class="q-ml-md"
              color="accent"
            /> -->
        </template>
        <template
          v-slot:body="props">
          <q-tr :props="props" :class="props.row.DK === 'D' ? 'text-teal-8' : 'text-orange-13'" >
            <q-td>{{props.row.kodeCab }}</q-td>
            <q-td key="desk" :props="props">
              {{ props.row.desk }}
              <q-popup-edit v-model="props.row.desk">
                <q-input
                  v-model="props.row.desk"
                  label="Deskripsi..."/>
              </q-popup-edit>
            </q-td>
            <q-td key="kodeAkun" :props="props">
              {{ props.row.kodeAkun }} {{props.row.namaSubAkun}} {{ props.row.namaAkun }}
              <q-popup-edit v-model="props.row.kodeAkun">
                <q-select
                  filled
                  v-model="props.row.akun"
                  use-input
                  dense
                  options-dense
                  input-debounce="0"
                  label="Pilih Akun COA"
                  :options="options"
                  :option-label="(item) => item && `${item.kodeAkun} ${item.namaSubAkun} ${item.namaAkun}`"
                  option-value="kodeAkun"
                  map-options
                  @filter="filterFn"
                  @input="pilC(props.row)"
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
              </q-popup-edit>
            </q-td>
            <q-td key="DK" :props="props">
              <q-select
                filled
                v-model="props.row.DK"
                :options="['D','K']"
                dense
                stack-label
                label="DK"
              />
            </q-td>
            <q-td key="debit" :props="props">
              <template v-if="props.row.debit">
                {{ props.row.debit | duit }}
                <q-popup-edit v-model="props.row.debit">
                  <q-input v-model="props.row.debit" @input="props.row.nilai=props.row.debit" dense autofocus counter />
                </q-popup-edit>
              </template>
            </q-td>
            <q-td key="kredit" :props="props">
              <template v-if="props.row.kredit">
                {{ props.row.kredit | duit }}
                <q-popup-edit v-model="props.row.kredit">
                  <q-input v-model="props.row.kredit" @input="props.row.nilai=props.row.kredit" dense autofocus counter />
                </q-popup-edit>
              </template>
            </q-td>
            <q-td key="act" :props="props">
              <!-- <q-icon
                v-if="['MAN','acc'].some(a=> a== $store.state.auth.user.userType)"
                color="teal"
                name="save"
                style="font-size:1.5rem"
                @click="upDet(props.row)"/> -->
            </q-td>
          </q-tr>
        </template>
        <template v-slot:body-cell-debit="props">
          <q-td align="right">
            {{ props.row.debit | duit }}
          </q-td>
        </template>
        <template v-slot:body-cell-kredit="props">
          <q-td align="right">
            {{ props.row.kredit | duit }}
          </q-td>
        </template>
        <template v-slot:bottom-row>
          <q-tr>
            <q-td
              align="center"
              colspan="3">
              <strong>Total</strong>
            </q-td>
            <q-td align="right"><strong>{{ total.tdebit | duit }}</strong></q-td>
            <q-td align="right"><strong>{{ total.tkredit | duit }}</strong></q-td>
          </q-tr>
          <q-tr>
            <q-td
              align="center"
              colspan="3">
              <strong>Balance</strong>
            </q-td>
            <q-td
              align="center"
              colspan="2"><strong>{{ total.tblnce | nomer }}</strong></q-td>
          </q-tr>
        </template>
      </q-table>
      <div align="right">
        <q-btn label="Tutup" type="reset" color="warning" class="q-ml-sm" @click="$emit('ok','Y')" />
        <q-btn v-if="jhr.ac==='N' && jhr.nomorSuratJalan === ''" label="Batal" type="reset" color="red" class="q-ml-sm" @click="simpan(jhr,'B')" />
        <q-btn v-if="['MAN','acc','mitra'].some(a=> a== $store.state.auth.user.userType)" label="Update" type="submit" color="teal" class="q-ml-sm" @click="editj()" />
      </div>
    </q-card-section>
  </q-card>
</template>
<script>
import { upHP, accRek, edjur, editJur, editTglTrx } from '../../services/apiList'
import { reactive, computed, toRefs } from '@vue/composition-api'
export default {
  props: {
    detJur: {
      type: Array,
      default: function () {
        return []
      }
    },
    jh: {
      type: Object,
      default: function () {
        return {
          tgl: null,
          judulJurnal: ''
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      jdl: [
        { name: 'kodeCab', label: 'KodeCab', field: row => row.kodeCab, align: 'left' },
        { name: 'desk', label: 'Deskripsi', field: row => row.desk, align: 'left' },
        { name: 'kodeAkun', label: 'Kode Akun', field: row => row.kodeAkun, align: 'left' },
        // { name: 'DK', label: 'DK', field: row => row.DK, align: 'left' },
        { name: 'debit', label: 'Debit', field: row => row.debit, jml: 'Y', align: 'right' },
        { name: 'kredit', label: 'Kredit', field: row => row.kredit, jml: 'Y', align: 'right' }
      ],
      alAkun: [],
      options: [],
      addJur: { kodeAkun: null, DK: 'D', nilai: 0 },
      myPagination: {
        rowsPerPage: 0
      },
      inRul: [ v => !!v || 'Isi data' ],
      jhr: { ...props.jh },
      detJurr: [ ...props.detJur ]
    })
    accRek()
      .then(res => {
        dt.alAkun = res.data
      })
    const total = computed(() => {
      let x = {}
      x.tdebit = root.$dwn.jumlah(dt.detJurr.map(a => a.DK === 'D' && a.nilai))
      x.tkredit = root.$dwn.jumlah(dt.detJurr.map(a => a.DK === 'K' && a.nilai))
      x.tblnce = root.$dwn.jumlah([x.tdebit, -x.tkredit])
      return x
    })
    const editj = () => {
      if (Number(total.value.tblnce) !== 0) {
        root.$q.notify({ message: `Cek Balance ${total.value.tblnce} ...`, color: 'purple' })
      } else {
        editJur(dt.detJurr)
          .then(({ data }) => {
            //          this.$emit('ok', 'Y')
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }
    }
    const simpan = (x, y) => {
      if (y) {
        dt.jhr.status = y
        x.status = y
      }
      root.$q.dialog({
        title: 'Batalkan Jurnal Keuangan',
        message: `Nomor transaksi: <b>${x.nomorJurnal}</b> <br/> <i> ${x.judulJurnal}</i> ?`,
        html: true,
        cancel: {
          label: 'Tutup',
          color: 'negative'
        },
        ok: {
          push: true
        },
        persistent: true
      }).onOk(() => {
        upHP(x)
          .then(({ data }) => {
            root.$emit('ok', 'Y')
            root.$q.notify({ message: `${data.st}`, color: 'teal' })
          })
          .catch((err) => {
            console.log(err)
            root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
          })
      }).onCancel(() => {
      }).onDismiss(() => {
        // console.log('I am triggered on both OK and Cancel')
      })
    }
    const upDet = (x) => {
      edjur(x)
        .then(({ data }) => {
          root.$q.notify({ message: `${data.st}`, color: 'teal' })
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
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
        dt.options = dt.alAkun.filter(v => (v.namaSubAkun.toLowerCase().indexOf(needle) > -1 || v.namaAkun.toLowerCase().indexOf(needle) > -1 || v.kodeAkun.toLowerCase().indexOf(needle) > -1))
      })
    }
    const pilC = (x) => {
      x.kodeAkun = x.akun.kodeAkun
      x.namaSubAkun = x.akun.namaSubAkun
      x.namaAkun = x.akun.namaAkun
    }
    const plus = () => {
      dt.detJurr.push(Object.assign({}, dt.addJur))
    }
    const ubahTrx = (x) => {
      editTglTrx(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
        })
        .catch(err => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, type: 'warning' })
        })
    }
    return { ...toRefs(dt), plus, pilC, filterFn, upDet, simpan, editj, total, ubahTrx }
  }
}
</script>
