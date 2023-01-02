<template>
  <div class="">
    <q-card dense>
      <q-card-section>
        <q-toolbar>
          <q-toolbar-title>Arus Kas </q-toolbar-title>
          <q-space/>
          <q-chip color="blue-6" class="text-white text-bold q-mr-md">Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
              <q-date range v-model="tgl" @input="(x) => x && ($refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
            </q-popup-proxy>
          </q-chip>
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
                  v-model="filt.kodeCab"
                  :options="cabAll.filter(a => divisi === a.compCode)"
                  :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
                  option-value="kodeCab"
                  option-dense
                  emit-value
                  map-options
                  multiple
                  style="min-width: 250px; max-width: 550px"
                  label="Pilih cabang... "
                  dense
                  @input="gantiCab"
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
                        <q-checkbox v-model="filt.kodeCab" :val="scope.opt.kodeCab" @input="cekAkas"/>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected>
                    {{ filt.kodeCab.length }} cabang
                  </template>
                </q-select>
                <q-toggle v-model="filt.allCab" label="Pilih semua..." @input="gantiCab(filt.allCab)"/>
          <q-btn dense round icon="folder_open" color="purple" @click="cekAkas()"/>
          <q-btn
            round dense
            icon="file_download"
            @click="toExcel()"
            class="q-ml-md"
            color="primary"
          />
        </q-toolbar>
      </q-card-section>
      <q-card-section>
        <q-list bordered dense>
          <q-expansion-item
            dense-toggle
            expand-separator
            label="Penerimaan Penjualan Tunai"
            header-class="bg-teal text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="account_balance"/>
              </q-item-section>
              <q-item-section>
                Aktivitas operasional
              </q-item-section>
              <q-item-section side class="text-white">
                {{ rekap.penerimaanOp - rekap.pengeluaranOp | duit }}
              </q-item-section>
            </template>
            <q-expansion-item
              dense-toggle
              expand-separator
              label="Penerimaan Penjualan Tunai"
              header-class="bg-green-12 text-primary">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-cash-register"/>
                </q-item-section>
                <q-item-section>
                  Penerimaan Kas Operasional
                </q-item-section>
                <q-item-section side >
                  {{ rekap.penerimaanOp | duit }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="bubble_chart"
                label="Penerimaan Penjualan Tunai"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal-13"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Penjualan Tunai
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.pjTunai && dta.pjTunai.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.rkpTunai" :key="i"
                  header-class="bg-teal-1"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodePartner }} {{ item.namaPartner }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.pjTunai.filter(c => c.kodePartner === item.kodePartner)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}. {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Penerimaan Piutang Usaha"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal-13"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Piutang Usaha
                  </q-item-section>
                  <q-item-section side >
                    {{ dta.pitUsaha && dta.pitUsaha.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.pitUsaha" :key="i"
                  header-class="text-teal"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodePartner }} {{ item.namaPartner }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.pitUsaha.filter(c => c.namaPartner === item.namaPartner)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Penerimaan Piutang Usaha"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal-13"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Non Usaha
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.pdNonUsaha && dta.pdNonUsaha.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.pdNonUsaha" :key="i"
                  header-class="text-teal"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodeAkun }} {{ item.namaAkun }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.pdNonUsaha.filter(c => c.kodeAkun === item.kodeAkun)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Penerimaan Piutang Usaha"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal-13"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Bunga Bank
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.pdpBunga && dta.pdpBunga.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.pdpBunga" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Penerimaan Piutang Usaha"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal-13"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Lain-lain
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.pdpLain && dta.pdpLain.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.pdpLain" :key="i"
                  header-class="text-teal"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodeAkun }} {{ item.namaAkun }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.pdpLain.filter(c => c.kodeAkun === item.kodeAkun)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
            </q-expansion-item>
            <q-expansion-item
              dense-toggle
              expand-separator
              icon="account_balance"
              label="Penerimaan Penjualan Tunai"
              header-class="bg-orange-13 text-white">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-file-invoice-dollar" color="red-13"/>
                </q-item-section>
                <q-item-section>
                  Pengeluaran Kas Operasional
                </q-item-section>
                <q-item-section side class="text-white">
                  {{ rekap.pengeluaranOp | duit }}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Biaya Operasional"
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Biaya Operasional
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.BoP && dta.BoP.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.BoP" :key="i"
                  header-class="text-orange"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodeAkun }} {{ item.namaAkun }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.BoP.filter(c => c.kodeAkun === item.kodeAkun)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Pembayaran ke Supplier
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.hutUsaha && dta.hutUsaha.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.hutUsaha" :key="i"
                  header-class="text-orange"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodePartner }} {{ item.namaPartner }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.hutUsaha.filter(c => c.kodePartner === item.kodePartner)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Pembelian Tunai
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.blTunai && dta.blTunai.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.blTunai" :key="i"
                  header-class="text-orange"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodePartner }} {{ item.namaPartner }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.blTunai.filter(c => c.kodePartner === item.kodePartner)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}. {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Biaya Operasional"
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Biaya Non Usaha
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.hutNonUsaha && dta.hutNonUsaha.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.hutNonUsaha" :key="i"
                  header-class="text-orange"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodeAkun }} {{ item.namaAkun }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.hutNonUsaha.filter(c => c.kodeAkun === item.kodeAkun)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Penerimaan Piutang Usaha"
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Biaya Bunga Bank/ Bagi Hasil
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.biayaPjkBagiHasil && dta.biayaPjkBagiHasil.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.biayaPjkBagiHasil" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                label="Biaya Operasional"
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-file-invoice" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Biaya Lain-lain
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.biayaLain && dta.biayaLain.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                <q-expansion-item
                  dense
                  dense-toggle
                  expand-separator
                  v-for="(item, i) in rekap.biayaLain" :key="i"
                  header-class="text-orange"
                  :content-inset-level="1">
                  <template v-slot:header>
                    <q-item-section avatar>
                      {{ i + 1 }}
                    </q-item-section>
                    <q-item-section>
                      {{ item.kodeAkun }} {{ item.namaAkun }}
                    </q-item-section>
                    <q-item-section side>
                      {{ item.total | nomer }}
                    </q-item-section>
                  </template>
                  <q-item v-for="(u, s) in dta.biayaLain.filter(c => c.kodeAkun === item.kodeAkun)" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
                </q-expansion-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list>
          <q-expansion-item
            dense-toggle
            expand-separator
            header-class="bg-blue-13 text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="far fa-gem"/>
              </q-item-section>
              <q-item-section>
                Aktivitas Investasi
              </q-item-section>
              <q-item-section side class="text-white">
                {{ rekap.invesMasuk - rekap.invesKeluar | duit}}
              </q-item-section>
            </template>
            <q-expansion-item
              dense-toggle
              expand-separator
              label="Penerimaan Penjualan Tunai"
              header-class="bg-green-12">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-hand-holding-usd"/>
                </q-item-section>
                <q-item-section>
                  Penjualan Asset
                </q-item-section>
                <q-item-section side>
                  {{ rekap.invesMasuk | duit}}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Penjualan Aktiva Tetap
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.jualAktivaTetap && dta.jualAktivaTetap.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.jualAktivaTetap" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Penjualan Aktiva Tak Berwujud
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.jualTakWujud && dta.jualTakWujud.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.jualTakWujud" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
            </q-expansion-item>
            <q-expansion-item
              dense-toggle
              expand-separator
              header-class="bg-orange-12">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-hand-holding-usd"/>
                </q-item-section>
                <q-item-section>
                  Pembelian Asset
                </q-item-section>
                <q-item-section side>
                  {{ rekap.invesKeluar | duit}}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-orange-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Pembelian Asset Tetap
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.beliAktivaTetap && dta.beliAktivaTetap.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.beliAktivaTetap" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Pembelian Aktiva Tak Berwujud
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.beliTakWujud && dta.beliTakWujud.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.beliTakWujud" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-list>
          <q-expansion-item
            dense-toggle
            expand-separator
            header-class="bg-blue-13 text-white">
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon name="fas fa-business-time"/>
              </q-item-section>
              <q-item-section>
                Aktivitas Pendanaan
              </q-item-section>
              <q-item-section side class="text-white">
                {{ rekap.pendanaanMasuk - rekap.pendanaanKeluar | duit}}
              </q-item-section>
            </template>
            <q-expansion-item
              dense-toggle
              expand-separator
              label="Penerimaan Penjualan Tunai"
              header-class="bg-green-12">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-hand-holding-usd"/>
                </q-item-section>
                <q-item-section>
                  Penerimaan Pendanaan
                </q-item-section>
                <q-item-section side>
                  {{ rekap.pendanaanMasuk | duit}}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Modal Disetor
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.sawal && dta.sawal.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.sawal" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                icon="account_balance"
                header-class="bg-teal-1">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-comments-dollar" color="teal"/>
                  </q-item-section>
                  <q-item-section>
                    Penerimaan Pinjaman Bank
                  </q-item-section>
                  <q-item-section side>
                    {{ dta.pinjamBank && dta.pinjamBank.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.pinjamBank" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
            </q-expansion-item>
            <q-expansion-item
              dense-toggle
              expand-separator
              header-class="bg-orange-13 text-white">
              <template v-slot:header>
                <q-item-section avatar>
                  <q-icon name="fas fa-money-check-alt" color="red"/>
                </q-item-section>
                <q-item-section>
                  Pengeluaran Pendanaan
                </q-item-section>
                <q-item-section side class="text-white">
                  {{ rekap.pendanaanKeluar | duit}}
                </q-item-section>
              </template>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-money-check-alt" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Pembayaran Pinjaman Bank
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.bayarBank && dta.bayarBank.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.bayarBank" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-money-check-alt" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Piutang Direksi
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.pitDireksi && dta.pitDireksi.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.pitDireksi" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-money-check-alt" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Pengembalian Modal
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.balikModal && dta.balikModal.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.balikModal" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-money-check-alt" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Deviden
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.deviden && dta.deviden.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.deviden" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
              <q-expansion-item
                dense-toggle
                expand-separator
                header-class="bg-brown-6 text-white">
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="fas fa-money-check-alt" color="red"/>
                  </q-item-section>
                  <q-item-section>
                    Prive
                  </q-item-section>
                  <q-item-section side class="text-white">
                    {{ dta.prive && dta.prive.reduce((a, b) => $dwn.jumlah([a, b.nilai]), 0) | duit }}
                  </q-item-section>
                </template>
                  <q-item v-for="(u, s) in dta.prive" :key="u.nomorJurnal" dense>
                    <q-item-section @click="cek(u)">
                      {{s+1}}.  {{ u.nomorJurnal }} {{ u.judulJurnal }}
                    </q-item-section>
                    <q-item-label>
                      {{ u.nilai | nomer }}
                    </q-item-label>
                  </q-item>
              </q-expansion-item>
            </q-expansion-item>
          </q-expansion-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <div class="col text-right" >
          <div>
            Saldo Awal : <q-chip outline color="teal">{{ dta.saldoAwal ? dta.saldoAwal.sawalIDR : 0 | duit }}
            </q-chip>
          </div>
          <div>
            Kenaikan/Penurunan Kas : <q-chip outline color="teal">{{  dta.saldoAwal ? $dwn.jumlah([rekap.penerimaanOp, -rekap.pengeluaranOp, rekap.pendanaanMasuk, -rekap.pendanaanKeluar, rekap.invesMasuk, -rekap.invesKeluar]) : 0 | duit }}
            </q-chip>
          </div>
          <div>
            Saldo Akhir : <q-chip outline color="teal">{{ dta.saldoAwal ? $dwn.jumlah([dta.saldoAwal.sawalIDR, rekap.penerimaanOp, -rekap.pengeluaranOp, rekap.pendanaanMasuk, -rekap.pendanaanKeluar, rekap.invesMasuk, -rekap.invesKeluar]) : 0 | duit }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
      <q-dialog
        v-model="dtJ"
        full-width>
        <edJur ref="apJur" :detJur="detJur" @ok="dtJ=false" :jh="jh"/>
      </q-dialog>
    </q-card>
  </div>
</template>
<script>
import Excel from 'exceljs'
import FileSaver from 'file-saver'
import { computed, onMounted, reactive, toRefs } from '@vue/composition-api'
import { aruskas, company, detailJur, dtCab } from '../../services/apiList'
import edJur from './edJur'
export default {
  components: {
    edJur
  },
  setup (props, { root }) {
    const dt = reactive({
      filt: { tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01', tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10), kodeAkun: '', kodeCab: [root.$store.state.auth.user.kodeCab], allCab: false },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      cabAll: [],
      inRul: [ v => !!v || 'Isi data' ],
      sawal: 0,
      dta: {},
      jdl: [
        { name: 'nomorJurnal', label: 'Nomor Jurnal', field: row => row.nomorJurnal, align: 'left' },
        { name: 'tglJurnal', label: 'Tgl Jurnal', field: row => row.tglJurnal, align: 'left' },
        { name: 'judulJurnal', label: 'Judul Jurnal', field: row => row.judulJurnal, align: 'left' },
        { name: 'nilai', label: 'Nilai', field: row => row.nilai, format: val => new Intl.NumberFormat('en-ID').format(val), align: 'right' }
      ],
      detJur: [],
      jh: {},
      dtJ: false,
      divisi: '',
      dtComp: [],
      divCab: []
    })
    const cek = (x) => {
      dt.jh = { ...x }
      detailJur(x)
        .then(res => {
          dt.dtJ = true
          dt.detJur = res.data
        })
        .catch((err) => {
          console.log(err)
        })
    }
    const cekAkas = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.filt.kodeCab.length) {
        dt.dta = []
        aruskas(dt.filt)
          .then(({ data }) => {
            // dt.dtkas = data.dt
            // dt.sawal = data.sawal
            dt.dta = data
            dt.dta.blTunai = [...data.blTunai, ...data.dpBeli]
          })
      }
    }
    const toDown = (x, y) => {
      let z = {
        judul: `Data ${y}`,
        dt: x,
        hdr: dt.jdl,
        naFile: y
      }
      root.$dwn.toExcel(z)
    }
    onMounted(() => {
      company()
        .then(({ data }) => {
          dt.dtComp = data
        })
      dtCab()
        .then(({ data }) => {
          // dt.cabAll = data
          dt.cabGrup = data.filter(a => root.$store.state.auth.user.cabGrup.some(s => s === a.kodeCab))
          const pegang = root.$store.state.auth.user.cabGrup || root.$q.cookies.get('cabGrup')
          dt.cabAll = data.filter(a => pegang.some(s => s === a.kodeCab))
          let st = new Set(dt.cabAll.map(a => a.compCode))
          dt.divisi = '' // [...st]
          dt.divCab = dt.dtComp.filter(a => st.has(a.compCode))
        })
    })
    const kodeCab = computed(() => {
      let a = ['MAN', 'acc', 'mitra'].some(s => s === root.$store.state.auth.user.userType) ? dt.pr.kodeCab : [root.$store.state.auth.user.kodeCab]
      let s = a.map(d => {
        let nm = dt.cabAll.find(dd => dd.kodeCab === d)
        return nm
      })
      return s
    })
    const gantiCab = (x) => {
      dt.filt.kodeCab = []
      if (x === true) {
        dt.filt.kodeCab = dt.cabAll.filter(a => dt.divisi === a.compCode).map(a => a.kodeCab)
        dt.filt.allCab = true
        cekAkas()
      } else {
        dt.filt.kodeCab = []
        dt.filt.allCab = false
        // dt.divisi = []
      }
    }
    cekAkas()
    const rekap = computed(() => {
      let x = {}
      let kc = dt.filt.kodeCab
      // partner per pjTunai
      let ppjt = dt.dta.pjTunai ? [
        ...new Map(dt.dta.pjTunai.map(obj => [`${obj.kodePartner}:${obj.namaPartner}`, obj])).values()
      ] : []
      x.rkpTunai = ppjt.map(a => {
        a.total = dt.dta.pjTunai.filter(s => s.kodePartner === a.kodePartner).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.pjTunai.filter(s => s.kodePartner === a.kodePartner && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let pitu = dt.dta.pitUsaha ? [
        ...new Map(dt.dta.pitUsaha.map(obj => [`${obj.namaPartner}`, obj])).values()
      ] : []
      x.pitUsaha = pitu.map(a => {
        a.total = dt.dta.pitUsaha.filter(s => s.namaPartner === a.namaPartner).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.pitUsaha.filter(s => s.namaPartner === a.namaPartner && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let pnonU = dt.dta.pdNonUsaha ? [
        ...new Map(dt.dta.pdNonUsaha.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.pdNonUsaha = pnonU.map(a => {
        a.total = dt.dta.pdNonUsaha.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.pdNonUsaha.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let pdpLain = dt.dta.pdpLain ? [
        ...new Map(dt.dta.pdpLain.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.pdpLain = pdpLain.map(a => {
        a.total = dt.dta.pdpLain.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.pdpLain.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let BoP = dt.dta.BoP ? [
        ...new Map(dt.dta.BoP.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.BoP = BoP.map(a => {
        a.total = dt.dta.BoP.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.BoP.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let hutUsaha = dt.dta.hutUsaha ? [
        ...new Map(dt.dta.hutUsaha.map(obj => [`${obj.kodePartner}:${obj.namaPartner}`, obj])).values()
      ] : []
      x.hutUsaha = hutUsaha.map(a => {
        a.total = dt.dta.hutUsaha.filter(s => s.namaPartner === a.namaPartner).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.hutUsaha.filter(s => s.namaPartner === a.namaPartner && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let hutNonUsaha = dt.dta.hutNonUsaha ? [
        ...new Map(dt.dta.hutNonUsaha.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.hutNonUsaha = hutNonUsaha.map(a => {
        a.total = dt.dta.hutNonUsaha.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.hutNonUsaha.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let biayaLain = dt.dta.biayaLain ? [
        ...new Map(dt.dta.biayaLain.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.biayaLain = biayaLain.map(a => {
        a.total = dt.dta.biayaLain.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.biayaLain.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let jualAktivaTetap = dt.dta.jualAktivaTetap ? [
        ...new Map(dt.dta.jualAktivaTetap.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.jualAktivaTetap = jualAktivaTetap.map(a => {
        a.total = dt.dta.jualAktivaTetap.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.jualAktivaTetap.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let jualTakWujud = dt.dta.jualTakWujud ? [
        ...new Map(dt.dta.jualTakWujud.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.jualTakWujud = jualTakWujud.map(a => {
        a.total = dt.dta.jualTakWujud.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.jualTakWujud.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let beliTakWujud = dt.dta.beliTakWujud ? [
        ...new Map(dt.dta.beliTakWujud.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.beliTakWujud = beliTakWujud.map(a => {
        a.total = dt.dta.beliTakWujud.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.beliTakWujud.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let blTunai = dt.dta.blTunai ? [
        ...new Map(dt.dta.blTunai.map(obj => [`${obj.kodePartner}:${obj.namaPartner}`, obj])).values()
      ] : []
      x.blTunai = blTunai.map(a => {
        a.total = dt.dta.blTunai.filter(s => s.kodePartner === a.kodePartner).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.blTunai.filter(s => s.kodePartner === a.kodePartner && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      let beliAktivaTetap = dt.dta.beliAktivaTetap ? [
        ...new Map(dt.dta.beliAktivaTetap.map(obj => [`${obj.kodeAkun}:${obj.namaAkun}`, obj])).values()
      ] : []
      x.beliAktivaTetap = beliAktivaTetap.map(a => {
        a.total = dt.dta.beliAktivaTetap.filter(s => s.kodeAkun === a.kodeAkun).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = dt.dta.beliAktivaTetap.filter(s => s.kodeAkun === a.kodeAkun && s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      })
      /* x.sawal = dt.dta.sawal.map(a => {
        a.total = a.reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = a.filter(s => s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
      }) */
      x.pitDireksi = dt.dta.pitDireksi && dt.dta.pitDireksi.map(a => {
        // a.total = a.reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        kc.forEach(i => {
          a[i] = a.milik === i ? a.nilai : 0
        })
        return a
      })
      x.penerimaanOp = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.pjTunai, ...dt.dta.pitUsaha, ...dt.dta.pdNonUsaha, ...dt.dta.pdpLain, ...dt.dta.pdpBunga ].reduce((a, b) => a + Number(b.nilai), 0)
      x.pengeluaranOp = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.BoP, ...dt.dta.hutUsaha, ...dt.dta.blTunai, ...dt.dta.hutNonUsaha, ...dt.dta.biayaPjkBagiHasil, ...dt.dta.biayaLain ].reduce((a, b) => a + Number(b.nilai), 0)
      x.pendanaanMasuk = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.sawal, ...dt.dta.pinjamBank ].reduce((a, b) => a + Number(b.nilai), 0)
      x.pendanaanKeluar = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.bayarBank, ...dt.dta.balikModal, ...dt.dta.pitDireksi, ...dt.dta.deviden, ...dt.dta.prive ].reduce((a, b) => a + Number(b.nilai), 0)
      x.invesMasuk = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.jualAktivaTetap, ...dt.dta.jualTakWujud ].reduce((a, b) => a + Number(b.nilai), 0)
      x.invesKeluar = Object.keys(dt.dta).length === 0 ? 0 : [ ...dt.dta.beliAktivaTetap, ...dt.dta.beliTakWujud ].reduce((a, b) => a + Number(b.nilai), 0)
      // console.log(dt.dta.hutNonUsaha)
      // console.log(hutNonUsaha)
      return x
    })
    const toExcel = () => {
      // const x = rekap.value
      const kc = dt.filt.kodeCab
      // const pitDir = dt.dta.length && dt.dta.pitDireksi/* .map(a => {
      // a.total = a.reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
      /* kc.forEach(i => {
          a[i] = a.filter(s => s.milik === i).reduce((b, c) => root.$dwn.jumlah([b, c.nilai]), 0)
        })
        return a
      }) */
      console.log(rekap)
      const x = { ...rekap.value, sawal: dt.dta.sawal, pinjamBank: dt.dta.pinjamBank, bayarBank: dt.dta.bayarBank, pitDireksi: dt.dta.pitDireksi, balikModal: dt.dta.balikModal, deviden: dt.dta.deviden, prive: dt.dta.prive }
      console.log(x)
      const grup = Object.keys(x)
      console.log(grup)
      var wb = new Excel.Workbook()
      var ws = wb.addWorksheet('Data', { properties: { showGridLines: true } })
      ws.getCell('A1').value = {
        richText: [
          { font: { italic: true }, text: `Arus Kas Periode ${dt.filt.tgla} s/d/ ${dt.filt.tglb}` }
        ]
      }
      ws.mergeCells('A1:C1')
      ws.getCell('A1').alignment = { horizontal: 'center' }
      ws.getCell('A2').value = {
        richText: [
          { font: { italic: true }, text: dt.filt.kodeCab.map(a => dt.cabAll.find(c => c.kodeCab === a).namaCabang) }
        ]
      }
      ws.mergeCells('A2:C2')
      ws.getCell('A2').alignment = { horizontal: 'center' }

      ws.getColumn(3).numFmt = `#,##0.00`
      // label judul
      // ws.getRow(3).values = hdr.map(x => x.label)
      /* const row = ws.getRow(3)
      row.eachCell(function (cell, colNumber) {
        row.getCell(colNumber).fill = {
          type: 'pattern',
          pattern: 'darkTrellis',
          alignment: { wrapText: true },
          fgColor: { argb: '1DE9B6' }
        }
      })
      ws.mergeCells(0, 0, 1, row.cellCount)
      ws.columns = hdr.map(x => {
        const a = {}
        a.key = x.name
        // a.outlineLevel = 1
        a.style = { alignment: { vertical: 'top', horizontal: 'left' } }
        if (x.align === 'right') { a.style = { numFmt: '#,##0.00' } }
        if (x.wrap === true) { a.style.alignment.wrapText = true }
        return a
      }) */
      ws.addRow([''])
      ws.addRow(['Jenis', 'Keterangan', 'Jumlah', ...dt.filt.kodeCab.map(a => dt.cabAll.find(c => c.kodeCab === a).namaCabang)]).font = {
        bold: true,
        size: 12
      }
      let baris = 5
      grup.forEach(g => {
        let dta = x[g]
        let subTotal = dta.length && dta.reduce((a, b) => a + (b.total || b.nilai), 0)
        if (dta.length) {
          ws.addRow([dta[0].jenis, '', subTotal]).font = {
            bold: true
          }
          ws.mergeCells(`A${baris}:B${baris}`)
          baris++
        }
        for (const a in dta) {
          ws.addRow([Number(a) + 1, dta[a].namaAkun || dta[a].namaPartner || dta[a].judulJurnal, dta[a].total || dta[a].nilai, ...kc.map(k => dta[a][k])])
          baris++
        }
        if (dta.length) {
          /* ws.addRow(['SubTotal', '', subTotal]).font = {
            bold: true,
            italic: true
          }
          ws.mergeCells(`A${baris}:B${baris}`)
          ws.getCell(`A${baris}`).alignment = { vertical: 'middle', horizontal: 'center' } */
          ws.addRow([''])
          baris++
        }
      })
      ws.addRow()
      ws.addRow(['', 'Saldo Awal', dt.dta.saldoAwal.sawalIDR || 0]).font = {
        bold: true,
        italic: true
      }
      ws.addRow(['', 'Kenaikan/Penurunan Kas', dt.dta.saldoAwal ? root.$dwn.jumlah([x.penerimaanOp, -x.pengeluaranOp, x.pendanaanMasuk, -x.pendanaanKeluar, x.invesMasuk, -x.invesKeluar]) : 0]).font = {
        bold: true,
        italic: true
      }
      ws.addRow(['', 'Saldo Akhir', dt.dta.saldoAwal ? root.$dwn.jumlah([dt.dta.saldoAwal.sawalIDR, x.penerimaanOp, -x.pengeluaranOp, x.pendanaanMasuk, -x.pendanaanKeluar, x.invesMasuk, -x.invesKeluar]) : 0]).font = {
        bold: true,
        italic: true
      }
      // footer
      /* const cellFoot = dt.length + 4
      const foot = ws.getRow(cellFoot)
      const ft = hdr.reduce((z, x) => {
        if (x.jml) {
          z[x.name] = { formula: `SUM(${ws.getRow(4).getCell(x.name)._address}:${ws.getRow(cellFoot - 1).getCell(x.name)._address})` }
        }
        return z
      }, {})
      foot.values = ft */
      wb.xlsx.writeBuffer()
        .then(buffer => {
          if (typeof cordova !== 'undefined') {
            root.$q.notify({ message: `File ${dt.filt.kodeCab}.xlsx tersimpan di folder download...`, color: 'teal' })
            // saveBlob2File(`${naFile}.xlsx`, new Blob([buffer]))
          } else {
            FileSaver.saveAs(new Blob([buffer]), `${dt.filt.kodeCab}.xlsx`)
          }
        })
        .catch(err => console.log(err))
    }
    return { ...toRefs(dt), cekAkas, cek, toDown, rekap, toExcel, gantiCab, kodeCab }
  }
}
</script>
