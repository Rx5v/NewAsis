<template>
  <q-page padding>
    <div class="q-pa-sm row q-gutter-sm justify-end">
      <q-chip color="blue-6" class="text-white text-bold shadow-3" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}
        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
          <q-date range v-model="tgl" @input="(x) => x && (lihat(),$refs.qDateProxy.hide())" mask="YYYY-MM-DD" lazy-rules/>
        </q-popup-proxy>
      </q-chip>
      <q-toggle v-model="filt.allCab" label="Semua Cabang" class="q-ml-md" @input="gantiCab(filt.allCab)" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)"/>
      <q-select
        v-model="filt.cabID"
        :options="cabAll"
        :option-label="(item) => item && item.kodeCab + ' ' + item.namaCabang"
        option-value="kodeCab"
        options-dense
        emit-value
        map-options
        multiple
        style="min-width: 250px; max-width: 550px"
        label="Pilih cabang... "
        dense
        class="q-ml-md"
        @input="lihat()"
        lazy-rules>
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.namaCabang" ></q-item-label>
              {{ scope.opt.kodeCab }}
            </q-item-section>
            <q-item-section side>
              <q-checkbox v-model="filt.cabID" :val="scope.opt.kodeCab" @input="lihat()"/>
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:selected>
          {{ filt.cabID.length }} cabang
        </template>
      </q-select>
    </div>
    <div class="q-pa-sm row q-gutter-sm justify-between">
      <div style="width:600px" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)">
        <q-card class="fit">
          <q-card-actions
            style="background: linear-gradient(to left, transparent,rgba(0, 150,95,0.8))">
            <q-chip color="blue-6" class="text-white text-bold" clickable>Kas dan Setara Kas</q-chip>
            <q-space/>
            <q-chip color="blue-5"  outline class="text-white text-bold" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}</q-chip>
          </q-card-actions>
          <q-separator />
          <q-markup-table dense wrap-cells>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>PT ASI</th>
                <th>Cabang</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-bold">
                <td class="text-bold">Saldo Awal</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.saldoAwal : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAwal : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAwal +  Kas.pusat.saldoAwal : 0 | duit }}</td>
              </tr>
              <tr>
              </tr>
              <tr class="text-bold">
                <td>Uang Masuk</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.masuk : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.masuk : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.masuk + Kas.outlet.masuk  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Penjualan Tunai</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.tunai : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.tunai : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.tunai + Kas.outlet.tunai : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Pembayaran Piutang Usaha</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.pitUsaha : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.pitUsaha : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.pitUsaha + Kas.outlet.pitUsaha : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Lain-lain</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.masukLain : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.masukLain : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.masukLain +  Kas.outlet.masukLain : 0 | duit }}</td>
              </tr>
              <tr>
              </tr>
              <tr class="text-bold">
                <td>Uang Keluar</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.keluar : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.keluar : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.keluar + Kas.outlet.keluar  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Biaya Operasional</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.bop : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.bop : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.bop + Kas.outlet.bop : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Pembelian Tunai</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.beli : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.beli : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.beli + Kas.outlet.beli : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Pembayaran Hutang Usaha</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.hutUsaha : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.hutUsaha : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.hutUsaha + Kas.outlet.hutUsaha : 0 | duit }}</td>
              </tr>
              <tr>
                <td>* Lain-lain</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.keluarLain : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.keluarLain : 0 | duit }}</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.keluarLain +  Kas.outlet.keluarLain : 0 | duit }}</td>
              </tr>
              <tr>
              </tr>
              <tr class="text-bold">
                <td>Kenaikan/ (Penurunan)</td>
                <td align="right" :class="Kas.pusat.naik > 0 ? 'text-teal' : 'text-pink'">{{ Kas.pusat ? Kas.pusat.naik : 0 | duit }}</td>
                <td align="right" :class="Kas.outlet.naik > 0 ? 'text-teal' : 'text-pink'">{{ Kas.outlet ? Kas.outlet.naik : 0 | duit }}</td>
                <td align="right" :class="(Kas.outlet.naik +  Kas.pusat.naik) > 0 ? 'text-teal' : 'text-pink'">{{ Kas.outlet ? Kas.outlet.naik +  Kas.pusat.naik : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Saldo Akhir</td>
                <td align="right">{{ Kas.pusat ? Kas.pusat.saldoAkhir : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAkhir : 0 | duit }}</td>
                <td align="right">{{ Kas.outlet ? Kas.outlet.saldoAkhir +  Kas.pusat.saldoAkhir : 0 | duit }}</td>
              </tr>
              <tr>
              </tr>
              <tr class="text-bold">
                <td >Kebutuhan Dana</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.totala : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totala : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totala +  hutU.pusat.totala : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 14 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua14 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 + hutU.outlet.ua14  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 15 - 30 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua30 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 + hutU.outlet.ua30 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua60 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 + hutU.outlet.ua60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 61 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua61 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 +  hutU.outlet.ua61 : 0 | duit }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
      <div style="width:600px" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)">
        <q-card class="fit">
          <q-card-actions
            style="background: linear-gradient(to left, transparent,rgba(250, 215,5,0.8))">
            <q-chip color="blue-6" class="text-white text-bold" clickable>Dana Kesehatan</q-chip>
            <q-space/>
            <q-chip color="blue-5"  outline class="text-white text-bold" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}</q-chip>
          </q-card-actions>
          <q-separator />
          <q-markup-table dense wrap-cells>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>PT ASI</th>
                <th>Cabang</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-bold">
                <td >Jumlah Debit Dana Kesehatan</td>
                <td align="right">{{ danaKes.filter(a=> a.kodeCabang === 'MP01').reduce((a, b) => a + b.debit, 0) | duit }}</td>
                <td align="right">{{ danaKes.filter(a=> a.kodeCabang !== 'MP01').reduce((a, b) => a + b.debit, 0) | duit }}</td>
                <td align="right">{{ danaKes.reduce((a, b) => a + b.debit, 0) | duit }}</td>
              </tr>
              <tr v-for="(a, i) in danaKes" :key="i">
                <td>{{ i + 1 }} {{ a.namaPartner }}</td>
                <td align="right">{{ a.kodeCabang === 'MP01' ? a.debit : 0 | duit }}</td>
                <td align="right">{{  a.kodeCabang !== 'MP01' ? a.debit : 0 | duit }}</td>
                <td align="right">{{  a.debit | duit }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
      <div style="width:600px" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)">
        <q-card class="fit">
          <q-card-actions
            style="background: linear-gradient(to left, transparent,rgba(10, 255,175,0.8))">
            <q-chip color="blue-6" class="text-white text-bold" clickable>Piutang Usaha</q-chip>
            <q-space/>
            <q-chip color="blue-5"  outline class="text-white text-bold" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}</q-chip>
          </q-card-actions>
          <q-separator />
          <q-markup-table dense wrap-cells>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>PT ASI</th>
                <th>Cabang</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-bold">
                <td >Saldo Awal</td>
                <td align="right">{{ pitU.pusat.total| duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.total : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.total +  pitU.pusat.total : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 14 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u14 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.u14 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u14 + pitU.outlet.u14  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 15 - 30 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u30 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.u30 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u30 + pitU.outlet.u30 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u60 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.u60 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u60 + pitU.outlet.u60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 61 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u61 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.u61 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.u61 +  pitU.outlet.u61 : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Pemberian</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.masuk : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.masuk : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.masuk +  pitU.pusat.masuk : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Pembayaran</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.bayar : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.bayar : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.bayar +  pitU.pusat.bayar : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Kenaikan/ (Penurunan)</td>
                <td align="right" :class="pitU.pusat.naik > 0 ? 'text-teal' : 'text-pink'">{{ pitU.pusat ? pitU.pusat.naik : 0 | duit }}</td>
                <td align="right" :class="pitU.outlet.naik > 0 ? 'text-teal' : 'text-pink'">{{ pitU.outlet ? pitU.outlet.naik : 0 | duit }}</td>
                <td align="right" :class="(pitU.outlet.naik +  pitU.pusat.naik) > 0 ? 'text-teal' : 'text-pink'">{{ pitU.outlet ? pitU.outlet.naik +  pitU.pusat.naik : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Jatuh Tempo</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.totalOverdue : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.totalOverdue : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.totalOverdue +  pitU.pusat.totalOverdue : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Belum Tempo</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.blmOverdue : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.blmOverdue : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.blmOverdue +  pitU.pusat.blmOverdue : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Saldo Akhir</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.totala : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.totala : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.totala +  pitU.pusat.totala : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 14 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua14 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.ua14 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua14 + pitU.outlet.ua14  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 15 - 30 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua30 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.ua30 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua30 + pitU.outlet.ua30 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua60 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.ua60 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua60 + pitU.outlet.ua60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 61 Hari</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua61 : 0 | duit }}</td>
                <td align="right">{{ pitU.outlet ? pitU.outlet.ua61 : 0 | duit }}</td>
                <td align="right">{{ pitU.pusat ? pitU.pusat.ua61 +  pitU.outlet.ua61 : 0 | duit }}</td>
              </tr>
            </tbody>
          </q-markup-table>
          <!-- <q-list dense>
            <q-item>
              <q-item-section>
                <q-item-label></q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.qty | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Nilai HPP</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.hpp | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Omzet</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.jmlHarga | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Pencapaian</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.nilaiPencapaian | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Nilai Point Member</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.pointMember | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label>Margin</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>
                  <q-chip outline color="primary">{{ rkpPusat.laba | nomer }}</q-chip>
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list> -->
        </q-card>
      </div>
      <div style="width:600px" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)">
        <q-card class="fit">
          <q-card-actions
            style="background: linear-gradient(to left, transparent,rgba(210, 85,175,0.8))">
            <q-chip color="blue-6" class="text-white text-bold" clickable>Hutang Usaha</q-chip>
            <q-space/>
            <q-chip color="blue-5"  outline class="text-white text-bold" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}</q-chip>
          </q-card-actions>
          <q-separator />
          <q-markup-table dense wrap-cells>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>PT ASI</th>
                <th>Cabang</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-bold">
                <td>Saldo Awal</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.total : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.total : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.total +  hutU.pusat.total : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 14 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u14 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.u14 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u14 + hutU.outlet.u14  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 15 - 30 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u30 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.u30 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u30 + hutU.outlet.u30 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u60 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.u60 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u60 + hutU.outlet.u60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 61 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u61 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.u61 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.u61 +  hutU.outlet.u61 : 0 | duit }}</td>
              </tr>
               <tr class="text-bold">
                <td>Pemberian</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.masuk : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.masuk : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.masuk +  hutU.pusat.masuk : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Pembayaran</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.bayar : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.bayar : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.bayar +  hutU.pusat.bayar : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Kenaikan/ (Penurunan)</td>
                <td align="right" :class="hutU.pusat.naik > 0 ? 'text-pink' : 'text-teal'">{{ hutU.pusat ? hutU.pusat.naik : 0 | duit }}</td>
                <td align="right" :class="hutU.outlet.naik > 0 ? 'text-pink' : 'text-teal'">{{ hutU.outlet ? hutU.outlet.naik : 0 | duit }}</td>
                <td align="right" :class="(hutU.outlet.naik +  hutU.pusat.naik) > 0 ? 'text-pink' : 'text-teal'">{{ hutU.outlet ? hutU.outlet.naik +  hutU.pusat.naik : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Jatuh Tempo</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.totalOverdue : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totalOverdue : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totalOverdue +  hutU.pusat.totalOverdue : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Belum Tempo</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.blmOverdue : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.blmOverdue : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.blmOverdue +  hutU.pusat.blmOverdue : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Saldo Akhir</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.totala : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totala : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.totala +  hutU.pusat.totala : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 14 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua14 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua14 + hutU.outlet.ua14  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 15 - 30 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua30 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua30 + hutU.outlet.ua30 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua60 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua60 + hutU.outlet.ua60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 61 Hari</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 : 0 | duit }}</td>
                <td align="right">{{ hutU.outlet ? hutU.outlet.ua61 : 0 | duit }}</td>
                <td align="right">{{ hutU.pusat ? hutU.pusat.ua61 +  hutU.outlet.ua61 : 0 | duit }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
      <div style="width:600px" v-if="['MAN', 'acc'].some(a => a === $store.state.auth.user.userType)">
        <q-card class="fit">
          <q-card-actions
            style="background: linear-gradient(to left, transparent,rgba(0, 150,95,0.8))">
            <q-chip color="blue-6" class="text-white text-bold" clickable>Nilai Persediaan</q-chip>
            <q-space/>
            <q-chip color="blue-5"  outline class="text-white text-bold" clickable>Periode : {{ tgl && tgl.from ? tgl.from + ' ~ ' + tgl.to : tgl }}</q-chip>
          </q-card-actions>
          <q-separator />
          <q-markup-table dense wrap-cells>
            <thead>
              <tr>
                <th>Keterangan</th>
                <th>PT ASI</th>
                <th>Cabang</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-bold">
                <td class="text-bold">Saldo Awal</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.total : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.total - Stok.pusat.total : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.total : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 30 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u30 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.u30 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u30 + Stok.outlet.u30  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u60 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.u60 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u60 + Stok.outlet.u60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 61 - 90 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u90 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.u90 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u90 + Stok.outlet.u90 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 90 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u91 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.u91 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.u91 +  Stok.outlet.u91 : 0 | duit }}</td>
              </tr>
               <tr class="text-bold">
                <td>Barang Masuk</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.masuk : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.masuk : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.masuk +  Stok.pusat.masuk : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Barang Keluar</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.keluar : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.keluar : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.keluar +  Stok.pusat.keluar : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td>Kenaikan/ (Penurunan)</td>
                <td align="right" :class="Stok.pusat.naik > 0 ? 'text-teal' : 'text-pink'">{{ Stok.pusat ? Stok.pusat.naik : 0 | duit }}</td>
                <td align="right" :class="Stok.outlet.naik > 0 ? 'text-teal' : 'text-pink'">{{ Stok.outlet ? Stok.outlet.naik : 0 | duit }}</td>
                <td align="right" :class="(Stok.outlet.naik +  Stok.pusat.naik) > 0 ? 'text-teal' : 'text-pink'">{{ Stok.outlet ? Stok.outlet.naik +  Stok.pusat.naik : 0 | duit }}</td>
              </tr>
              <tr class="text-bold">
                <td >Saldo Akhir</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.totala : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.totala - Stok.pusat.totala : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.totala : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 30 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua30 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.ua30 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua30 + Stok.outlet.ua30  : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 31 - 60 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua60 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.ua60 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua60 + Stok.outlet.ua60 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur 61 - 90 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua90 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.ua90 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua90 + Stok.outlet.ua90 : 0 | duit }}</td>
              </tr>
              <tr>
                <td>Umur > 90 Hari</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua91 : 0 | duit }}</td>
                <td align="right">{{ Stok.outlet ? Stok.outlet.ua91 : 0 | duit }}</td>
                <td align="right">{{ Stok.pusat ? Stok.pusat.ua91 +  Stok.outlet.ua91 : 0 | duit }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>
      <div class="col-xs-12>">
        <trxJanggal :pilih="filt"/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api'
import { dtCab, faaAK, faaHP, faaKes, faaStk } from '../services/apiList'
import trxJanggal from '../components/trxJanggal'
export default {
  components: { trxJanggal },
  setup (props, { root }) {
    const dt = reactive({
      filt: {
        allCab: false,
        kodeCab: [root.$store.state.auth.user.kodeCab],
        cabID: [root.$store.state.auth.user.kodeCab],
        tgla: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        tglb: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10),
        jnsTrx: 'J'
      },
      tgl: {
        from: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 8) + '01',
        to: new Date().toLocaleString('sv', { timeZoneName: 'short' }).slice(0, 10)
      },
      inRul: [ v => !!v || 'Isi data' ],
      cabAll: [],
      dtPitU: [],
      dtHutU: [],
      dtp: [],
      dtStok: [],
      danaKes: [],
      dtKas: []
    })
    dtCab()
      .then(({ data }) => {
        // dt.filt.kodeCab = data.map(a => a.kodeCab)
        const pegang = root.$store.state.auth.user.cabGrup
        dt.cabAll = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) ? data.filter(a => pegang.some(s => a.kodeCab === s)) : [root.$store.state.auth.user.kodeCab]
        dt.filt.allCab = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) || false
        dt.filt.cabID = ['MAN', 'acc', 'purchase'].some(a => a === root.$store.state.auth.user.userType) ? dt.cabAll.map(a => a.kodeCab) : [root.$store.state.auth.user.kodeCab]
        lihat()
      })
    const lihat = () => {
      dt.filt.tgla = dt.tgl && dt.tgl.from ? dt.tgl.from : dt.tgl || new Date()
      dt.filt.tglb = dt.tgl && dt.tgl.from ? dt.tgl.to : dt.tgl || new Date()
      if (dt.filt.cabID.length) {
        faaHP({ ...dt.filt, kodeSubAkun: '11050' })
          .then(({ data }) => {
            dt.dtPitU = data
          })
        faaHP({ ...dt.filt, kodeSubAkun: '21010' })
          .then(({ data }) => {
            dt.dtHutU = data
          })
        faaStk({ ...dt.filt, kodeSubAkun: '11070' })
          .then(({ data }) => {
            dt.dtStok = {
            pusata: data.sawala.filter(a => ['', 'MP01'].includes(a.kodeCabang))
              .map(a => {
                a.totala = a.kodeCabang === 'MP01' ? a.totala : a.asal === 'MP01' ? a.keluara : a.tujuan === 'MP01' ? a.masuka : 0
                return a
              }),
            totala: data.sawala
              .map(a => {
                a.totalla = root.$dwn.jumlah([a.totala, a.masuka, a.keluara])
                return a
              }),
            pusat: data.sawal.filter(a => ['', 'MP01'].includes(a.kodeCabang))
              .map(a => {
                a.total = a.kodeCabang === 'MP01' ? a.total : a.asal === 'MP01' ? a.keluar : a.tujuan === 'MP01' ? a.masuk : 0
                return a
              }),
            total: data.sawal
              .map(a => {
                a.totall = root.$dwn.jumlah([a.total, a.masuk, a.keluar])
                return a
              }),
          }
          })
        faaKes({ ...dt.filt, kodeAkun: '210500002' })
          .then(({ data }) => {
            dt.danaKes = data.dt.filter(a => a.debit !== 0)
          })
        faaAK({ ...dt.filt })
          .then(({ data }) => {
            dt.dtKas = data
          })
      }
    }
    onMounted(() => {
    })
    const gantiCab = (x) => {
      dt.filt.cabID = x ? dt.cabAll.map(a => a.kodeCab) : [root.$store.state.auth.user.kodeCab]
      lihat()
    }
    const pitU = computed(() => {
      const data = dt.dtPitU
      return data.sawal ? {
        pusat: {
          total: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'D').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'K').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.nilai, 0)
        },
        outlet: {
          total: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'D').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'K').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.nilai, 0)
        }
      } : { pusat: {}, outlet: {} }
    })
    const hutU = computed(() => {
      const data = dt.dtHutU
      return data.sawal ? {
        pusat: {
          total: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'K').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang === 'MP01' && a.DK === 'D').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => a + b.nilai, 0)
        },
        outlet: {
          total: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.total, 0),
          u14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u14, 0),
          u30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u30, 0),
          u60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u60, 0),
          u61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.u61, 0),
          totala: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totala, 0),
          totalOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.totalOverdue, 0),
          blmOverdue: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.blmOverdue, 0),
          ua14: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua14, 0),
          ua30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua30, 0),
          ua60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua60, 0),
          ua61: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.ua61, 0),
          masuk: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'K').reduce((a, b) => a + b.nilai, 0),
          bayar: data.nHP.filter(a => a.kodeCabang !== 'MP01' && a.DK === 'D').reduce((a, b) => a - b.nilai, 0),
          naik: data.nHP.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => a + b.nilai, 0)
        }
      } : { pusat: {}, outlet: {} }
    })
    const Stok = computed(() => {
      const data = dt.dtStok
      return data.pusat ? {
        /* pusat: {
          total: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.total]), 0),
          u30: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u30]), 0),
          u60: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u60]), 0),
          u90: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u90]), 0),
          u91: data.sawal.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u91]), 0),
          totala: data.sawala.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.totala]), 0),
          ua30: data.sawala.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.sawala.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.sawala.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.sawala.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0),
          masuk: data.nStk.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.nStk.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.nStk.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0)
        },
        outlet: {
          total: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.total]), 0),
          u30: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u30]), 0),
          u60: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u60]), 0),
          u90: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u90]), 0),
          u91: data.sawal.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.u91]), 0),
          totala: data.sawala.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.totala]), 0),
          ua30: data.sawala.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.sawala.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.sawala.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.sawala.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0),
          masuk: data.nStk.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.nStk.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.nStk.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0)
        } */
        pusat: {
          totala: data.pusata
            .reduce((a, b) => root.$dwn.jumlah([a,b.totala]), 0),
          total: data.pusat
            .reduce((a, b) => root.$dwn.jumlah([a,b.total]), 0)/* ,
          ua30: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.pusat.reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0) */
        },
        outlet: {
          totala: data.totala.reduce((a, b) => root.$dwn.jumlah([a, b.totalla]), 0),
          total: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.totall]), 0)/* ,
          ua30: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua30]), 0),
          ua60: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua60]), 0),
          ua90: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua90]), 0),
          ua91: data.total.reduce((a, b) => root.$dwn.jumlah([a, b.ua91]), 0) */
        }
      } : { pusat: {}, outlet: {} }
    })
    const Kas = computed(() => {
      const data = dt.dtKas
      return data.length ? {
        pusat: {
          saldoAwal: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAwal]), 0),
          tunai: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.tunai]), 0),
          pitUsaha: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.pitUsaha]), 0),
          masukLain: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.tunai, -b.pitUsaha]), 0),
          saldoAkhir: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAkhir]), 0),
          beli: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.beli]), 0),
          hutUsaha: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.hutUsaha]), 0),
          keluarLain: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar, -b.beli, -b.hutUsaha, -b.bop]), 0),
          masuk: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0),
          bop: data.filter(a => a.kodeCabang === 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.bop]), 0)
        },
        outlet: {
          saldoAwal: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAwal]), 0),
          tunai: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.tunai]), 0),
          pitUsaha: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.pitUsaha]), 0),
          masukLain: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.tunai, -b.pitUsaha]), 0),
          saldoAkhir: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.saldoAkhir]), 0),
          beli: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.beli]), 0),
          hutUsaha: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.hutUsaha]), 0),
          keluarLain: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar, -b.beli, -b.hutUsaha, -b.bop]), 0),
          masuk: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk]), 0),
          keluar: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.keluar]), 0),
          naik: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.masuk, -b.keluar]), 0),
          bop: data.filter(a => a.kodeCabang !== 'MP01').reduce((a, b) => root.$dwn.jumlah([a, b.bop]), 0)
        }
      } : { pusat: {}, outlet: {} }
    })
    watch(() => root.$store.state.auth.setCabang, (val) => {
      dt.filt.cabID = [val]
      dt.filt.allCab = false
      lihat()
    })
    return {
      ...toRefs(dt),
      lihat,
      gantiCab,
      pitU,
      hutU,
      Stok,
      Kas
    }
  }
}
</script>
