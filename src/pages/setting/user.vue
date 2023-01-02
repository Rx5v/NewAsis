<template>
  <q-page padding>
    <div>
      <q-table
        class="dataTrx"
        :data="dataUser"
        :columns="jdl"
        row-key="eID"
        selection="single"
        :selected.sync="selected"
        :pagination.sync="halaman"
        :filter="cari"
        dense>
        <template v-slot:top>
          <div class="col-2 q-table__title">Data Karyawan</div>
          <q-space />
          <q-input dense debounce="300" v-model="cari" placeholder="Search">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn
            flat round dense
            icon="add_circle"
            @click="adP = true, add='Add', p={}"
            color="purple"
            class="q-ml-md"
          />
        </template>
        <template v-slot:body-cell-act="props">
          <q-td :props="props">
            <q-icon name="add" color="orange" size="1.2em" @click="adAkun(props.row)"/>
          </q-td>
        </template>
      </q-table>
      <q-dialog
        v-model="adP"
        >
        <q-card style="width: 700px; max-width: 80vw;">
          <q-card-section>
            <div class="text-h6">{{add}} Data Karyawan</div>
          </q-card-section>
          <q-form
            @submit="inpUser(p)"
            @reset="onReset"
            class="q-gutter-md">
            <q-card-section>
              <div class="row justify-between">
                <div class="col-12 col-md-5">
                  <q-input
                    filled
                    v-model="p.kodeKar"
                    label="No. Karyawan "
                    lazy-rules
                    dense
                    :rules="inRul"
                  />
                  <q-input
                    filled
                    v-model="p.namaKaryawan"
                    label="namaKaryawan *"
                    lazy-rules
                    dense
                    :rules="inRul"
                  />
                  <q-input filled  v-model="p.jabatan"  label="jabatan *"  lazy-rules
                    dense
                    :rules="inRul"
                  />
                  <q-input filled  v-model="p.alamat"  label="alamat " type="textarea" lazy-rules
                    dense
                  />

                  <!--

                  <q-input filled  v-model="p.bank"  label="bank *"  lazy-rules
                    dense
                    :rules="inRul"
                  /> -->
                </div>
                <div class="col-12 col-md-5">
                  <!-- <q-input filled  v-model="p.masuk"  label="masuk *"  lazy-rules
                    dense
                    :rules="inRul"
                  />
                  <q-input filled  v-model="p.keluar"  label="keluar"  lazy-rules dense hint="Tanggal keluar"
                  />
                   -->
                  <q-input filled  v-model="p.ktp"  label="ktp"  lazy-rules
                    dense
                  />
                  <q-input filled  v-model="p.telp"  label="telp *"  lazy-rules
                    dense
                    :rules="inRul"
                  />
                  <q-select filled v-model="p.kodeCab" :options="cabang"
                    option-label="namaCabang" option-value="kodeCab" label="kodeCab *" emit-value  map-options options-dense :rules="inRul"/>
                  <q-select filled v-model="p.cabGrup" :options="cabang"
                    option-label="namaCabang" option-value="kodeCab" label="Grup Cabang *" emit-value multiple map-options :rules="inRul"/>
                </div>
              </div>
            </q-card-section>
            <q-card-actions align="right" class="bg-white text-teal">
              <q-btn label="Batal" v-close-popup color="accent" flat />
              <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
              <q-btn label="Submit" type="submit" color="primary" flat/>
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
      <q-dialog
        v-model="adU"
        >
        <q-card>
          <q-card-section>
            <div class="text-h6">Akun {{ u.namaKaryawan }}</div>
          </q-card-section>
          <q-form
            @submit="inAkun(u)"
            @reset="onReset"
            class="q-gutter-md">
            <q-card-section>
                <q-input filled  v-model="u.akun"  label="Akun "  lazy-rules
                  dense
                />
                <q-select filled  v-model="u.userType"
                  :options="['MAN','sales','admin','acc','purchase','mitra','produksi','gudang', 'investor', 'teknisi']"
                  label="userType "  lazy-rules
                  dense
                />
                <q-toggle filled v-model="u.active" true-value="Y" false-value="N" label="Aktif"
                  dense :rules="inRul"/>
            </q-card-section>
            <q-card-actions align="right" class="bg-white text-teal">
              <q-btn label="Batal" v-close-popup color="accent" flat />
              <q-btn label="Reset" type="reset" color="orange" flat class="q-ml-sm" />
              <q-btn label="Simpan" type="submit" color="primary" flat/>
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { reactive, toRefs } from '@vue/composition-api'
import { cabang, dtUser, inUser, inakun } from '../../services/apiList'
export default {
  setup (props, { root }) {
    const dt = reactive({
      dataUser: [],
      jdl: [
        { name: 'kodeKar', label: 'kodeKar', field: row => row.kodeKar, sortable: true, align: 'left' },
        { name: 'namaKaryawan', label: 'namaKaryawan', field: row => row.namaKaryawan, sortable: true, align: 'left' },
        { name: 'alamat', label: 'alamat', field: row => row.alamat, align: 'left' },
        { name: 'ktp', label: 'ktp', field: row => row.ktp, align: 'left' },
        { name: 'telp', label: 'telp', field: row => row.telp, sortable: true, align: 'left' },
        { name: 'masuk', label: 'masuk', field: row => row.masuk, sortable: true, align: 'left' },
        { name: 'keluar', label: 'keluar', field: row => row.keluar, align: 'left' },
        { name: 'jabatan', label: 'jabatan', field: row => row.jabatan, sortable: true, align: 'left' },
        { name: 'kodeCab', label: 'kodeCab', field: row => row.kodeCab, sortable: true, align: 'left' },
        { name: 'cabGrup', label: 'Cab Grup', field: row => row.cabGrup, sortable: true, align: 'left' },
        { name: 'userAkun', label: 'email', field: row => row.userAkun, align: 'left' },
        { name: 'userType', label: 'userType', field: row => row.userType, sortable: true, align: 'left' },
        { name: 'active', label: 'active', field: row => row.active, sortable: true, align: 'left' },
        { name: 'act', label: 'Add Akun', align: 'left' }
      ],
      adP: false,
      adU: false,
      inRul: [ v => !!v || 'Isi data' ],
      p: { cabGrup: [] },
      u: { active: 'Y', userType: 'sales' },
      selected: [],
      cari: '',
      cabang: [],
      add: 'Add',
      gambar: null,
      gambara: '',
      halaman: { rowsPerPage: 10 }
    })
    cabang()
      .then(res => {
        dt.cabang = res.data
      })
    const getUser = () => {
      dtUser()
        .then(({ data }) => {
          dt.dataUser = data/* .map(a => {
            a.cabGrup = JSON.parse(a.cabGrup)
            return a
          }) */
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const inpUser = (x) => {
      x.cabGrup = JSON.stringify(x.cabGrup)
      inUser(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          onReset()
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const adAkun = (x) => {
      x.akun = x.userAkun
      dt.u = x
      dt.adU = true
    }
    const inAkun = () => {
      let x = dt.u
      inakun(x)
        .then(res => {
          root.$q.notify({ message: `${res.data.st}`, color: 'teal' })
          onReset()
        })
        .catch((err) => {
          console.log(err)
          root.$q.notify({ message: `${err.response.data.st}`, color: 'purple' })
        })
    }
    const onReset = () => {
      dt.u = { active: 'Y', userType: 'sales' }
      dt.p = {}
      getUser()
    }
    getUser()
    return { ...toRefs(dt), onReset, inpUser, getUser, inAkun, adAkun }
  },
  watch: {
    selected: function (v) {
      if (v.length > 0) {
        this.p = v[0]
        this.adP = true
        this.add = 'Edit'
      }
    }
  }
}
</script>
