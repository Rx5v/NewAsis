<template>
  <card-base>
    <apexchart :type="type" height="350px" :options="chartOptions" :series="series" />
  </card-base>
</template>

<script>
import { onMounted, reactive, toRefs } from '@vue/composition-api'
import CardBase from './cardBase'
export default {
  name: 'ApexRadar',
  components: {
    CardBase
  },
  props: {
    chartId: {
      type: Object,
      default: function () {
        return {
          id: 'radar',
          judul: 'Radar Chart'
        }
      }
    },
    type: {
      type: String,
      default: 'radar'
    },
    labels: {
      type: Array,
      default: function () {
        return []
      }
    },
    datasets: {
      type: Array,
      default: function () {
        return []
      }
    },
    title: {
      type: Object,
      default: function () {
        return {
          text: 'Report',
          align: 'left'
        }
      }
    }
  },
  setup (props, { root }) {
    const dt = reactive({
      series: props.datasets,
      chartOptions: {
        labels: props.labels,
        title: props.title,
        yaxis: {
          show: false
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (value, { seriesIndex, dataPointIndex, w }) {
            return value.toLocaleString()
          }
        },
        tooltip: {
          y: {
            formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
              return value.toLocaleString()
            }
          }
        }
      }
    })
    const createChart = () => {
      dt.series = props.datasets
      dt.chartOptions = {
        labels: props.labels,
        title: props.title,
        yaxis: {
          show: false
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (value, { seriesIndex, dataPointIndex, w }) {
            return value.toLocaleString()
          }
        },
        tooltip: {
          y: {
            formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
              return value.toLocaleString()
            }
          }
        },
        stroke: {
          width: [4, 4]
        },
        markers: {
          size: 1
        }
      }
      if (!process.env.SERVER) {
        window.dispatchEvent(new Event('resize'))
      }
    }
    onMounted(() => {
      createChart()
    })
    return { ...toRefs(dt), createChart }
  },
  watch: {
    datasets: function () {
      this.createChart()
    }
  }
}
</script>
