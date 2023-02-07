<template>
  <div>
    <span
      class="text-h6">{{ judul }}</span>
    <q-btn-toggle
      v-model="pivotLap"
      no-caps
      rounded
      unelevated
      class="absolute-top-right"
      color="teal-12"
      toggle-color="primary"
      text-color="primary"
      @click="exportF('pvtTable', pivotLap)"
      :options="[
        {label: 'Print', value: 'print'},
        {label: 'Excel', value: 'excel'}
      ]"
    />
    <VuePivottableUi
      id="pvtTable"
      :data="dataTable"
      :aggregatorName='hitung'
      rendererName='Table'
      :rows="dta.rows"
      :cols="dta.cols"
      :vals="dta.vals"
    />
  </div>
</template>
<script>
import { reactive, toRefs } from '@vue/composition-api'
import { VuePivottableUi } from 'vue-pivottable'
import 'vue-pivottable/dist/vue-pivottable.css'
export default {
  components: {
    VuePivottableUi
  },
  props: {
    dataTable: {
      type: Array,
      default: () => {
        return []
      }
    },
    dtPivot: {
      type: Object,
      default: () => {
        return {
          rows: [],
          cols: [],
          vals: []
        }
      }
    },
    hitung: {
      type: String,
      default: 'Sum'
    },
    judul: {
      type: String,
      default: 'Laporan Penjualan'
    }
  },
  setup (props) {
    const dt = reactive({
      dta: props.dtPivot,
      pivotLap: 'print'
    })
    const exportF = (x, y) => {
      let downloadLink
      let dataType = 'application/vnd.ms-excel'
      let tableSelect = document.getElementsByClassName('pvtTable')
      let tableHTML = `<html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><xml>
        <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
          <x:Name>${props.judul}</x:Name>
          <x:WorksheetOptions>
              <x:Panes></x:Panes></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
        </xml></head><body>` + tableSelect[0].outerHTML + `
        <style>
          table thead,
          table tbody tr th {
            background: linear-gradient(145deg, #1976d2 11%, #0f477e 75%);
            color: #fff;
          }
          table tbody tr td {
            text-align: right;
            border-collapse: collapse;
            border: 1px solid grey collapse;
          }
        </style>` + '</body></html>'
      let filename = 'excel_data.xlsx'
      downloadLink = document.createElement('a')
      document.body.appendChild(downloadLink)
      if (y === 'print') {
        let wd = window.open('', 'Pivot Table', 'resize = 1')
        wd.document.open()
        wd.document.write(tableHTML)
        wd.document.close()
      } else {
        if (navigator.msSaveOrOpenBlob) {
          let blob = new Blob(['\ufeff', tableHTML], {
            type: dataType
          })
          navigator.msSaveOrOpenBlob(blob, filename)
        } else {
          downloadLink.href = 'data:' + dataType + ', ' + encodeURIComponent(tableHTML)
          downloadLink.download = filename
          downloadLink.click()
        }
      }
    }
    return {
      exportF,
      ...toRefs(dt)
    }
  }
}
</script>
