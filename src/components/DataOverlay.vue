<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'

const props = defineProps({
  bird: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const isVisible = ref(false)
const activeTab = ref('migration') // 迁徙路线放第一个
const loading = ref(true)
const error = ref(null)

// Data stores
const populationData = ref(null)
const migrationData = ref(null)
const statusData = ref(null)

// Province coordinate mapping (for wintering map)
const provinceCoords = {
  '江西省': [115.9, 28.7], '安徽省': [117.3, 31.9], '湖北省': [114.3, 30.6],
  '湖南省': [113.0, 28.2], '江苏省': [118.8, 32.0], '上海市': [121.5, 31.2],
  '福建省': [119.3, 26.1], '广东省': [113.3, 23.1], '广西': [108.3, 22.8],
  '广西壮族自治区': [108.3, 22.8], '云南省': [102.7, 25.0], '贵州省': [106.7, 26.6],
  '浙江省': [120.2, 30.3], '海南省': [110.3, 20.0], '台湾省': [121.0, 23.5],
  '台湾': [121.0, 23.5], '香港': [114.2, 22.3], '山东省': [117.0, 36.7],
  '河北省': [114.5, 38.0], '辽宁省': [123.4, 41.8], '吉林省': [125.3, 43.9],
  '黑龙江省': [126.6, 45.8], '内蒙古': [111.7, 40.8], '内蒙古自治区': [111.7, 40.8],
  '四川省': [104.1, 30.6], '重庆市': [106.5, 29.5], '河南省': [113.7, 34.8],
  '陕西省': [108.9, 34.3], '甘肃省': [103.8, 36.1], '青海省': [101.8, 36.6],
  '新疆': [87.6, 43.8], '新疆维吾尔自治区': [87.6, 43.8], '西藏': [91.1, 29.6],
  '西藏自治区': [91.1, 29.6], '宁夏': [106.3, 38.5], '宁夏回族自治区': [106.3, 38.5],
  '山西省': [112.5, 37.9], '北京市': [116.4, 39.9], '天津市': [117.2, 39.1],
  // International locations
  '日本': [138.0, 37.0], '韩国': [127.5, 36.0], '越南': [108.0, 14.0],
  // Prefixed variants (from list format)
  '中国广东': [113.3, 23.1], '中国福建': [119.3, 26.1], '中国海南': [110.3, 20.0],
  '中国香港': [114.2, 22.3], '中国浙江': [120.2, 30.3]
}

// Parse population number string (e.g. "约300-500只" → 400)
function parsePopulation(str) {
  if (!str) return 100
  const matches = str.match(/(\d+)/g)
  if (!matches) return 100
  const nums = matches.map(Number)
  if (nums.length >= 2) return Math.round((nums[0] + nums[nums.length - 1]) / 2)
  return nums[0]
}

// Map location name to its best-matching coordinate
function resolveCoord(locationName) {
  // Direct match first
  if (provinceCoords[locationName]) return provinceCoords[locationName]
  // Try stripping prefix like "中国"
  const stripped = locationName.replace(/^中国/, '')
  if (stripped !== locationName && provinceCoords[stripped]) return provinceCoords[stripped]
  // Try appending common suffixes
  for (const suffix of ['省', '市', '自治区', '壮族自治区']) {
    const candidate = locationName + suffix
    if (provinceCoords[candidate]) return provinceCoords[candidate]
  }
  return null
}

// Extract province distribution data from various 分布现状 formats
// Returns [{ name: string, value: [lng, lat], count: number }]
function extractProvinces(distStatus) {
  if (!distStatus) return []

  const provinceNames = Object.keys(provinceCoords).filter(k => k.length >= 2 && /^[\u4e00-\u9fa5]+$/.test(k))
  const result = []
  const seen = new Set()

  function addProvince(name) {
    if (!name || typeof name !== 'string') return
    const coord = resolveCoord(name)
    if (!coord) return
    // Deduplicate by stripped province name
    const key = name.replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区/g, '')
    if (seen.has(key)) return
    seen.add(key)
    result.push({ name: key, value: coord, count: 1 })
  }

  // 1. Check 重要分布区 dict { "福建省": {...}, ... }  — id=8, id=9
  const importantAreas = distStatus['重要分布区']
  if (importantAreas && typeof importantAreas === 'object' && !Array.isArray(importantAreas)) {
    for (const key of Object.keys(importantAreas)) {
      if (provinceCoords[key]) addProvince(key)
    }
    if (result.length > 0) return result
  }

  // 2. Check 中国分布 — could be a list [{ 省份: "..." }, ...] or dict { 省份: "..." }
  const chinaDist = distStatus['中国分布']
  if (chinaDist) {
    if (Array.isArray(chinaDist)) {
      // id=3 format: list of objects with 省份 field
      for (const item of chinaDist) {
        if (item['省份']) addProvince(item['省份'])
      }
      if (result.length > 0) return result
    } else if (typeof chinaDist === 'object') {
      // id=2 format: dict with 省份 key (and optionally province-name keys)
      if (chinaDist['省份']) {
        // Could be single province or comma-separated
        chinaDist['省份'].split(/[,，、]/).forEach(p => addProvince(p.trim()))
      }
      // Also check if keys themselves are province names
      for (const key of Object.keys(chinaDist)) {
        if (key !== '省份' && key !== '主要地点' && key !== '栖息地类型' && key !== '具体地点' && key !== '估计数量' && key !== '备注') {
          if (provinceCoords[key]) addProvince(key)
        }
      }
      if (result.length > 0) return result
    }
  }

  // 3. Check 分布点 (id=4 黄腹角雉)
  const sites = distStatus['分布点']
  if (sites && Array.isArray(sites)) {
    for (const item of sites) {
      if (item['省份']) addProvince(item['省份'])
    }
    if (result.length > 0) return result
  }

  // 4. Check 已确认分布地点 (id=6 海南鳽)
  const confirmed = distStatus['已确认分布地点']
  if (confirmed && Array.isArray(confirmed)) {
    for (const item of confirmed) {
      if (item['省份']) addProvince(item['省份'])
    }
    if (result.length > 0) return result
  }

  // 5. Check 繁殖地.中国 — list of location strings like "广西弄岗..." (id=7 弄岗穗鹛)
  const breedingChina = distStatus['繁殖地']?.['中国']
  if (breedingChina && Array.isArray(breedingChina)) {
    // Sort provinceNames by length desc so "广西壮族自治区" matches before "广西"
    const sortedNames = [...provinceNames].sort((a, b) => b.length - a.length)
    for (const loc of breedingChina) {
      for (const pName of sortedNames) {
        if (loc.startsWith(pName)) {
          addProvince(pName)
          break
        }
      }
    }
    if (result.length > 0) return result
  }

  // 6. Check 中国亚种分布 — dict of subspecies → { 分布: [...] } (id=8, id=9 fallback)
  const subspecies = distStatus['中国亚种分布']
  if (subspecies && typeof subspecies === 'object') {
    for (const ss of Object.values(subspecies)) {
      if (ss && ss['分布'] && Array.isArray(ss['分布'])) {
        for (const loc of ss['分布']) {
          // These may be strings like "云南东部", "福建西北部" etc.
          for (const pName of [...provinceNames].sort((a, b) => b.length - a.length)) {
            if (loc.startsWith(pName)) {
              addProvince(pName)
              break
            }
          }
        }
      }
    }
    if (result.length > 0) return result
  }

  return result
}

// ECharts state
const echartsReady = ref(false)
const echartsLoading = ref(false)
const echartsError = ref(false)
let migrationChart = null
let populationChart = null
let winteringChart = null
const migrationContainer = ref(null)
const populationContainer = ref(null)
const winteringContainer = ref(null)
let mapResizeObserver = null
let popResizeObserver = null
let winterResizeObserver = null
let windowResizeHandler = null

// SVG fallback chart dimensions
const chartContainer = ref(null)
const chartWidth = ref(600)
const chartHeight = ref(320)
let chartResizeObserver = null

// --- Dynamic ECharts loading ---
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`)
    if (existing) { resolve(); return }
    const script = document.createElement('script')
    script.src = url
    script.onload = resolve
    script.onerror = () => reject(new Error(`Failed to load: ${url}`))
    document.head.appendChild(script)
  })
}

async function loadECharts() {
  if (echartsReady.value) return
  if (echartsLoading.value) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (echartsReady.value || echartsError.value) {
          clearInterval(check)
          resolve()
        }
      }, 100)
    })
  }
  echartsLoading.value = true
  try {
    await loadScript('/lib/echarts.min.js')
    // Load lite world map GeoJSON (filtered to Asia-Pacific, <350KB vs 1MB full)
    const worldResp = await fetch('/lib/world-lite.json')
    if (!worldResp.ok) throw new Error('World map fetch failed')
    const worldGeo = await worldResp.json()
    window.echarts.registerMap('world', worldGeo)

    // Load china map GeoJSON for wintering distribution
    try {
      const chinaResp = await fetch('/lib/china.json')
      if (chinaResp.ok) {
        const chinaGeo = await chinaResp.json()
        window.echarts.registerMap('china', chinaGeo)
      }
    } catch (e) {
      console.warn('China map registration failed:', e)
    }

    if (window.echarts.getMap('world')) {
      echartsReady.value = true
    } else {
      throw new Error('Map registration failed')
    }
  } catch (err) {
    console.warn('ECharts 加载失败，将使用 SVG 备选方案', err)
    echartsError.value = true
  } finally {
    echartsLoading.value = false
  }
}

// --- Layout ---
function handleKeydown(e) {
  if (e.key === 'Escape') handleClose()
}

function handleClose() {
  isVisible.value = false
  setTimeout(() => emit('close'), 400)
}

function handleScroll(e) {
  if (e.target.closest('.data-content')) return
  if (Math.abs(e.deltaY) > 60) {
    handleClose()
  }
}

// --- Data loading ---
async function loadData(birdId) {
  loading.value = true
  error.value = null
  populationData.value = null
  migrationData.value = null
  statusData.value = null

  const basePath = `/data/${birdId}`

  try {
    const [popRes, migRes, statRes] = await Promise.all([
      fetch(`${basePath}/历年种群数量.json`),
      fetch(`${basePath}/迁徙路线数据.json`),
      fetch(`${basePath}/详细现状.json`)
    ])

    if (!popRes.ok || !migRes.ok || !statRes.ok) {
      throw new Error('部分数据加载失败')
    }

    populationData.value = await popRes.json()
    migrationData.value = await migRes.json()
    statusData.value = await statRes.json()
    loading.value = false

    await nextTick()
    updateChartSize()

    // For resident birds, ensure activeTab is not 'migration' (hidden tab)
    if (!isMigratory.value && activeTab.value === 'migration') {
      activeTab.value = 'population'
    }

    // If user is already on a chart tab, trigger lazy ECharts load
    if (activeTab.value === 'migration' || activeTab.value === 'population') {
      await loadECharts()
    }
    tryRenderCharts()
  } catch (err) {
    console.error('Data load error:', err)
    error.value = '数据加载失败，请稍后再试'
    loading.value = false
  }
}

// --- ECharts rendering ---
function makeMigrationOption() {
  if (!migrationData.value) return null

  const routes = migrationData.value['迁徙路线图数据']
  let springRoute, autumnRoute

  if (routes) {
    springRoute = routes['春季北迁路线'] || []
    autumnRoute = routes['秋季南迁路线'] || []
  } else {
    springRoute = migrationData.value['春季北迁路线'] || migrationData.value['春季迁徙路线'] || []
    autumnRoute = migrationData.value['秋季南迁路线'] || migrationData.value['秋季迁徙路线'] || []
  }

  if (!springRoute.length && !autumnRoute.length) return null

  // Build lines data for spring route (pairs of consecutive nodes)
  const springLines = []
  for (let i = 0; i < springRoute.length - 1; i++) {
    springLines.push({
      coords: [
        [springRoute[i]['经度'] || springRoute[i].lng, springRoute[i]['纬度'] || springRoute[i].lat],
        [springRoute[i + 1]['经度'] || springRoute[i + 1].lng, springRoute[i + 1]['纬度'] || springRoute[i + 1].lat]
      ]
    })
  }

  const autumnLines = []
  for (let i = 0; i < autumnRoute.length - 1; i++) {
    autumnLines.push({
      coords: [
        [autumnRoute[i]['经度'] || autumnRoute[i].lng, autumnRoute[i]['纬度'] || autumnRoute[i].lat],
        [autumnRoute[i + 1]['经度'] || autumnRoute[i + 1].lng, autumnRoute[i + 1]['纬度'] || autumnRoute[i + 1].lat]
      ]
    })
  }

  // Build nodes for scatter series (deduplicated by name)
  const nodeMap = {}
  const allRoutes = [...springRoute, ...autumnRoute]
  allRoutes.forEach(r => {
    const name = r['地点'] || r.name || ''
    const lng = r['经度'] || r.lng || 0
    const lat = r['纬度'] || r.lat || 0
    const month = r['月份'] || r.month || ''
    if (!nodeMap[name]) {
      nodeMap[name] = { name, value: [lng, lat, month] }
    }
  })
  const nodes = Object.values(nodeMap)

  return {
    backgroundColor: '#0a0a0c',
    geo: {
      map: 'world',
      roam: 'scale',
      aspectScale: 0.65,
      zoom: 5.5,
      center: [120, 40],
      layoutCenter: ['50%', '52%'],
      layoutSize: '160%',
      itemStyle: {
        areaColor: '#0d0d12',
        borderColor: 'rgba(255,255,255,0.22)',
        borderWidth: 0.55
      },
      emphasis: { disabled: true },
      regions: [
        {
          name: 'China',
          itemStyle: {
            areaColor: '#101018',
            borderColor: 'rgba(255,255,255,0.3)',
            borderWidth: 0.6
          }
        },
        {
          name: 'Russia',
          itemStyle: {
            areaColor: '#0e0e15',
            borderColor: 'rgba(255,255,255,0.25)',
            borderWidth: 0.6
          }
        },
        { name: 'Japan', itemStyle: { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 0.5 } },
        { name: 'North Korea', itemStyle: { borderColor: 'rgba(255,255,255,0.25)', borderWidth: 0.6 } },
        { name: 'South Korea', itemStyle: { borderColor: 'rgba(255,255,255,0.25)', borderWidth: 0.6 } },
        { name: 'Mongolia', itemStyle: { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 0.5 } }
      ]
    },
    series: [
      // Spring route dashed background line
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: false,
        data: springLines,
        lineStyle: {
          color: 'rgba(89,212,255,0.18)',
          width: 0.8,
          type: 'dashed',
          opacity: 0.5,
          curveness: 0.35
        },
        zlevel: 1
      },
      // Autumn route dashed background line
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: false,
        data: autumnLines,
        lineStyle: {
          color: 'rgba(255,128,171,0.15)',
          width: 0.8,
          type: 'dashed',
          opacity: 0.5,
          curveness: 0.35
        },
        zlevel: 1
      },
      // Spring route animated effect (triangle arrows)
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: false,
        data: springLines,
        lineStyle: {
          color: 'transparent',
          width: 0,
          opacity: 0,
          curveness: 0.35
        },
        effect: {
          show: true,
          period: 3.5,
          trailLength: 0.05,
          symbol: 'path://M0,-12 L-7,0 L0,-4 L7,0 Z',
          symbolSize: 14,
          color: '#80e8ff'
        },
        zlevel: 3
      },
      // Autumn route animated effect (triangle arrows)
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: false,
        data: autumnLines,
        lineStyle: {
          color: 'transparent',
          width: 0,
          opacity: 0,
          curveness: 0.35
        },
        effect: {
          show: true,
          period: 4,
          trailLength: 0.05,
          symbol: 'path://M0,-12 L-7,0 L0,-4 L7,0 Z',
          symbolSize: 14,
          color: '#ffb0cc'
        },
        zlevel: 3
      },
      // Location dots with labels
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: nodes,
        symbolSize: 9,
        itemStyle: {
          color: '#fff',
          borderColor: '#59d4ff',
          borderWidth: 2.5,
          shadowBlur: 6,
          shadowColor: '#59d4ff'
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          distance: 6,
          color: '#b0e0ff',
          fontSize: 10,
          fontFamily: 'Microsoft YaHei,Inter,sans-serif'
        },
        zlevel: 4
      }
    ]
  }
}

function makePopulationOption() {
  if (!populationData.value) return null

  const globalData = populationData.value['全球种群数量']?.['历年数据']
  const chinaKey = populationData.value['中国越冬种群数量'] || populationData.value['中国种群数量']
  const chinaData = chinaKey?.['历年数据']

  if (!globalData || globalData.length === 0) return null

  const years = globalData.map(d => d['年份'])
  const globalValues = globalData.map(d => d['估计数量'])

  const series = [
    {
      name: '全球种群',
      type: 'line',
      data: globalValues,
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#81c784', width: 2.5 },
      itemStyle: { color: '#81c784', borderColor: '#000', borderWidth: 1.5 },
      areaStyle: {
        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(129,199,132,0.22)' },
          { offset: 1, color: 'rgba(129,199,132,0.01)' }
        ])
      }
    }
  ]

  const legendData = ['全球种群']

  if (chinaData && chinaData.length > 0) {
    const chinaValues = chinaData.map(d => d['数量'])
    // Align china data to global years (china may have fewer data points)
    const chinaValueMap = {}
    chinaData.forEach(d => { chinaValueMap[d['年份']] = d['数量'] })
    const alignedChina = years.map(y => chinaValueMap[y] ?? null)

    series.push({
      name: chinaKey === populationData.value['中国越冬种群数量'] ? '中国越冬种群' : '中国种群',
      type: 'line',
      data: alignedChina,
      smooth: false,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#64b5f6', width: 2, type: 'dashed' },
      itemStyle: { color: '#64b5f6', borderColor: '#000', borderWidth: 1.5 },
      connectNulls: false
    })
    legendData.push(chinaKey === populationData.value['中国越冬种群数量'] ? '中国越冬种群' : '中国种群')
  }

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,10,14,0.92)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#ccc', fontSize: 12 },
      formatter: (params) => {
        const year = params[0].axisValue
        let html = `<div style="font-weight:500;margin-bottom:4px">${year}年</div>`
        params.forEach(p => {
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
            ${p.seriesName}: <strong>${p.value?.toLocaleString() ?? '-'}</strong> 只
          </div>`
        })
        return html
      }
    },
    legend: {
      data: legendData,
      bottom: 0,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
      itemWidth: 18,
      itemHeight: 3
    },
    grid: {
      left: 60,
      right: 30,
      top: 26,
      bottom: 50
    },
    xAxis: {
      type: 'category',
      data: years,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }
    },
    series
  }
}

function renderMigrationChart() {
  try {
    if (!window.echarts || !migrationContainer.value) return
    const option = makeMigrationOption()
    if (!option) return

    if (!migrationChart) {
      migrationChart = window.echarts.init(migrationContainer.value)
      // Set up ResizeObserver for this container
      if (mapResizeObserver) mapResizeObserver.disconnect()
      mapResizeObserver = new ResizeObserver(() => {
        if (migrationChart) {
          try { migrationChart.resize() } catch (e) { /* ignore */ }
        }
      })
      mapResizeObserver.observe(migrationContainer.value)
    }
    migrationChart.setOption(option, true)
  } catch (e) {
    console.warn('renderMigrationChart error:', e)
  }
}

function renderPopulationChart() {
  try {
    if (!window.echarts || !populationContainer.value) return
    const option = makePopulationOption()
    if (!option) return

    if (!populationChart) {
      populationChart = window.echarts.init(populationContainer.value)
      // Set up ResizeObserver for this container
      if (popResizeObserver) popResizeObserver.disconnect()
      popResizeObserver = new ResizeObserver(() => {
        if (populationChart) {
          try { populationChart.resize() } catch (e) { /* ignore */ }
        }
      })
      popResizeObserver.observe(populationContainer.value)
    }
    populationChart.setOption(option, true)
  } catch (e) {
    console.warn('renderPopulationChart error:', e)
  }
}

// --- Auto-focus helper ---
function computeGeoFocus(points, defaultCenter, defaultZoom) {
  // points: array of [lng, lat] pairs
  if (!points || points.length === 0) {
    return { center: defaultCenter || [112, 33], zoom: defaultZoom || 5.5 }
  }
  const lngs = points.map(p => Array.isArray(p) ? p[0] : p.value[0])
  const lats = points.map(p => Array.isArray(p) ? p[1] : p.value[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const cx = (minLng + maxLng) / 2
  const cy = (minLat + maxLat) / 2
  // Compute zoom based on bounding box size
  const spanLng = maxLng - minLng || 1
  const spanLat = maxLat - minLat || 1
  const maxSpan = Math.max(spanLng, spanLat)
  // Map span to zoom: smaller span → higher zoom
  // span 3° → zoom ~15, span 15° → zoom ~7, span 30° → zoom ~4
  const zoom = Math.round(Math.min(14, Math.max(3.5, 45 / maxSpan)))
  return { center: [cx, cy], zoom }
}

function makeWinteringOption() {
  if (!winteringData.value) return null

  const sites = winteringData.value

  // Build effectScatter data with dynamic symbol sizes based on population
  const maxPop = Math.max(...sites.map(s => s.value[2]), 1)
  const effectData = sites.map(s => ({
    name: s.name,
    value: [s.value[0], s.value[1], Math.max(6, Math.min(40, 10 + (s.value[2] / maxPop) * 30))]
  }))

  // Determine which provinces have wintering data for highlighting
  const highlightedProvinces = new Set()
  sites.forEach(s => {
    const nameParts = s.name.split('\n')[0]
    highlightedProvinces.add(nameParts)
  })

  // Auto-focus on wintering sites
  const winterFocus = computeGeoFocus(sites.map(s => s.value), [112, 33], 5.5)

  return {
    backgroundColor: '#0a0a0c',
    title: {
      text: '主要越冬地分布',
      subtext: `越冬地点：${sites.length} 处`,
      left: 'center',
      top: 8,
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 300, letterSpacing: 2 },
      subtextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 11 }
    },
    geo: {
      map: 'china',
      roam: 'scale',
      zoom: winterFocus.zoom,
      center: winterFocus.center,
      aspectScale: 0.85,
      label: { show: false },
      itemStyle: {
        areaColor: '#0d0d12',
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 0.5
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 10
        },
        itemStyle: {
          areaColor: '#162216'
        }
      },
      regions: Array.from(highlightedProvinces).map(name => ({
        name: name,
        itemStyle: {
          areaColor: '#162216',
          borderColor: 'rgba(129,199,132,0.4)',
          borderWidth: 1
        },
        label: {
          show: true,
          color: 'rgba(129,199,132,0.35)',
          fontSize: 8
        }
      }))
    },
    series: [
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: effectData,
        symbolSize: val => val[2],
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 3,
          period: 6
        },
        itemStyle: {
          color: '#81c784',
          shadowBlur: 12,
          shadowColor: 'rgba(129,199,132,0.6)'
        },
        label: {
          show: true,
          formatter: (p) => {
            const lines = p.name.split('\n')
            const loc = lines[0]
            const pop = p.value[2]
            return `{loc|${loc}}{pop|  ${pop > 20 ? pop + '只' : ''}}`
          },
          rich: {
            loc: { color: '#e0e0e0', fontSize: 11, fontFamily: 'Microsoft YaHei,Inter,sans-serif', padding: [2, 0] },
            pop: { color: '#81c784', fontSize: 9, fontFamily: 'Microsoft YaHei,Inter,sans-serif' }
          },
          position: 'right',
          distance: 8
        },
        zlevel: 2
      }
    ]
  }
}

function renderWinteringChart() {
  try {
    if (!window.echarts || !winteringContainer.value) return
    const option = makeWinteringOption()
    if (!option) return

    if (!winteringChart) {
      winteringChart = window.echarts.init(winteringContainer.value)
      if (winterResizeObserver) winterResizeObserver.disconnect()
      winterResizeObserver = new ResizeObserver(() => {
        if (winteringChart) {
          try { winteringChart.resize() } catch (e) { /* ignore */ }
        }
      })
      winterResizeObserver.observe(winteringContainer.value)
    }
    winteringChart.setOption(option, true)
  } catch (e) {
    console.warn('renderWinteringChart error:', e)
  }
}

function makeDistributionOption() {
  if (!distributionData.value || distributionData.value.length === 0) return null

  const provinces = distributionData.value
  const highlightedSet = new Set(provinces.map(p => p.name))

  // Build regions: highlighted provinces get deep green, rest get dark bg
  const regions = []
  // Collect all registered map names from echarts
  const mapData = window.echarts?.getMap('china')
  const features = mapData?.geoJSON?.features || mapData?.features
  if (features && features.length > 0) {
    for (const feature of features) {
      const props = feature.properties
      const name = props?.name || props?.NAME || props?.ename || ''
      // Check if this province is in our distribution set
      // Try multiple match approaches (full name, short name, etc.)
      let matched = highlightedSet.has(name)
      if (!matched) {
        const shortName = name.replace(/省|市|自治区|壮族自治区|回族自治区|维吾尔自治区|特别行政区/g, '')
        matched = highlightedSet.has(shortName)
      }
      if (matched) {
        regions.push({
          name: name,
          itemStyle: {
            areaColor: '#1a2a1a',
            borderColor: 'rgba(129,199,132,0.35)',
            borderWidth: 1
          },
          label: {
            show: true,
            color: 'rgba(129,199,132,0.4)',
            fontSize: 9
          }
        })
      }
    }
  }

  // Scatter data at province centers
  const scatterData = provinces.map(p => ({
    name: p.name,
    value: [p.value[0], p.value[1], 1]
  }))

  // Auto-focus on distribution provinces
  const distFocus = computeGeoFocus(provinces.map(p => p.value), [112, 33], 5.5)

  return {
    backgroundColor: '#0a0a0c',
    title: {
      text: '地区分布',
      subtext: `分布省份：${provinces.length} 个`,
      left: 'center',
      top: 8,
      textStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 300, letterSpacing: 2 },
      subtextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 11 }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,10,14,0.92)',
      borderColor: 'rgba(129,199,132,0.3)',
      textStyle: { color: '#ccc', fontSize: 12 },
      formatter: (p) => {
        return `<div style="font-weight:500;font-size:13px">📍 ${p.name}</div>`
      }
    },
    geo: {
      map: 'china',
      roam: 'scale',
      zoom: distFocus.zoom,
      center: distFocus.center,
      aspectScale: 0.85,
      label: { show: false },
      itemStyle: {
        areaColor: '#0d0d0d',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 0.5
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 11
        },
        itemStyle: {
          areaColor: '#1f2e1f'
        }
      },
      regions: regions.length > 0 ? regions : undefined
    },
    series: [
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: 12,
        itemStyle: {
          color: '#81c784',
          borderColor: '#1a2a1a',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(129,199,132,0.5)'
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          distance: 6,
          color: '#e0e0e0',
          fontSize: 11,
          fontFamily: 'Microsoft YaHei,Inter,sans-serif'
        },
        emphasis: {
          scale: 1.6,
          itemStyle: {
            color: '#a5d6a7',
            shadowBlur: 20,
            shadowColor: 'rgba(129,199,132,0.8)'
          }
        },
        zlevel: 2
      }
    ]
  }
}

function renderDistributionChart() {
  try {
    if (!window.echarts || !winteringContainer.value) return
    const option = makeDistributionOption()
    if (!option) return

    if (!winteringChart) {
      winteringChart = window.echarts.init(winteringContainer.value)
      if (winterResizeObserver) winterResizeObserver.disconnect()
      winterResizeObserver = new ResizeObserver(() => {
        if (winteringChart) {
          try { winteringChart.resize() } catch (e) { /* ignore */ }
        }
      })
      winterResizeObserver.observe(winteringContainer.value)
    }
    winteringChart.setOption(option, true)
  } catch (e) {
    console.warn('renderDistributionChart error:', e)
  }
}

async function tryRenderCharts() {
  try {
    await nextTick()
    if (!echartsReady.value) return

    if (activeTab.value === 'migration' && migrationData.value) {
      renderMigrationChart()
    }
    if (activeTab.value === 'population' && populationData.value) {
      renderPopulationChart()
    }
    if (activeTab.value === 'wintering') {
      if (isMigratory.value && winteringData.value) {
        renderWinteringChart()
      } else if (!isMigratory.value && distributionData.value?.length > 0) {
        renderDistributionChart()
      }
    }
  } catch (e) {
    console.warn('tryRenderCharts error:', e)
  }
}

function resizeAllCharts() {
  try {
    if (migrationChart) {
      try { migrationChart.resize() } catch (e) { /* ignore */ }
    }
    if (populationChart) {
      try { populationChart.resize() } catch (e) { /* ignore */ }
    }
    if (winteringChart) {
      try { winteringChart.resize() } catch (e) { /* ignore */ }
    }
  } catch (e) {
    /* outer guard */
  }
}

// --- SVG fallback for population (kept from original) ---
function updateChartSize() {
  if (chartContainer.value) {
    const rect = chartContainer.value.getBoundingClientRect()
    chartWidth.value = Math.max(rect.width - 48, 300)
    chartHeight.value = Math.max(320, Math.min(500, rect.width * 0.55))
  }
}

const chartData = computed(() => {
  if (!populationData.value) return null

  const global = populationData.value['全球种群数量']?.历年数据
  const chinaKey = populationData.value['中国越冬种群数量'] || populationData.value['中国种群数量']
  const china = chinaKey?.历年数据

  if (!global || global.length === 0) return null

  const allYears = global.map(d => d['年份'])
  const allValues = global.map(d => d['估计数量'])
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  const minVal = 0
  const maxVal = Math.max(...allValues) * 1.15
  const padding = { top: 30, right: 30, bottom: 50, left: 60 }
  const plotW = chartWidth.value - padding.left - padding.right
  const plotH = chartHeight.value - padding.top - padding.bottom

  const scaleX = (year) => padding.left + ((year - minYear) / (maxYear - minYear)) * plotW
  const scaleY = (val) => padding.top + plotH - (val / maxVal) * plotH

  const globalPoints = global.map(d =>
    `${scaleX(d['年份'])},${scaleY(d['估计数量'])}`
  ).join(' ')

  const areaFillPoints = (
    `${scaleX(allYears[0])},${scaleY(0)} ` +
    global.map(d => `${scaleX(d['年份'])},${scaleY(d['估计数量'])}`).join(' ') +
    ` ${scaleX(allYears[allYears.length - 1])},${scaleY(0)}`
  )

  const globalDots = global.map(d => ({
    x: scaleX(d['年份']),
    y: scaleY(d['估计数量']),
    year: d['年份'],
    value: d['估计数量']
  }))

  let chinaPoints = ''
  if (china && china.length > 0) {
    chinaPoints = china.map(d =>
      `${scaleX(d['年份'])},${scaleY(d['数量'])}`
    ).join(' ')
  }

  const yTicks = 5
  const yTickValues = []
  for (let i = 0; i <= yTicks; i++) {
    const val = Math.round((maxVal / yTicks) * i)
    yTickValues.push({ value: val, y: scaleY(val) })
  }

  const yearSpan = maxYear - minYear
  const yearStep = yearSpan <= 15 ? 2 : yearSpan <= 30 ? 5 : 10
  const xTicks = []
  for (let y = Math.ceil(minYear / yearStep) * yearStep; y <= maxYear; y += yearStep) {
    xTicks.push({ year: y, x: scaleX(y) })
  }

  return {
    globalPoints,
    chinaPoints,
    hasChina: chinaPoints.length > 0,
    yTickValues,
    xTicks,
    padding,
    plotW,
    plotH,
    maxVal,
    minYear,
    maxYear,
    areaFillPoints,
    globalDots,
    chinaLabel: chinaKey ? (populationData.value['中国越冬种群数量'] ? '中国越冬种群' : '中国种群') : null
  }
})

// Check if bird has migration route data
const hasMigrationRoutes = computed(() => {
  if (!migrationData.value) return false
  const routes = migrationData.value['迁徙路线图数据']
  if (routes) {
    const spring = routes['春季北迁路线'] || []
    const autumn = routes['秋季南迁路线'] || []
    return spring.length > 0 || autumn.length > 0
  }
  const spring = migrationData.value['春季北迁路线'] || migrationData.value['春季迁徙路线'] || []
  const autumn = migrationData.value['秋季南迁路线'] || migrationData.value['秋季迁徙路线'] || []
  return spring.length > 0 || autumn.length > 0
})

// Is this a migratory bird? (has migration routes with spring/autumn data)
const isMigratory = computed(() => hasMigrationRoutes.value)

// Distribution province data for resident birds (extracted from 分布现状)
const distributionData = computed(() => {
  if (!isMigratory.value && statusData.value) {
    return extractProvinces(statusData.value['分布现状'])
  }
  return null
})

// Whether the distribution/wintering tab has visible content
const hasDistributionContent = computed(() => {
  if (isMigratory.value) return hasWinteringData.value
  return distributionData.value && distributionData.value.length > 0
})

// --- Wintering data ---
const winteringData = computed(() => {
  if (!statusData.value) return null
  const wintering = statusData.value['分布现状']?.['越冬地']
  if (!wintering) return null

  const sites = []

  // Dict format: { "江西省": { "主要地点": [...], "越冬数量": "..." }, ... }
  if (typeof wintering === 'object' && !Array.isArray(wintering)) {
    for (const [province, info] of Object.entries(wintering)) {
      const coord = resolveCoord(province)
      if (!coord) continue
      sites.push({
        name: `${province}\n${(info['主要地点'] || []).slice(0, 3).join('、')}`,
        value: [coord[0], coord[1], parsePopulation(info['越冬数量'] || info['数量'])]
      })
    }
  }

  // List format: [{ "地点": "台湾", "具体": [...], "数量": "..." }, ...]
  if (Array.isArray(wintering)) {
    for (const item of wintering) {
      const coord = resolveCoord(item['地点'])
      if (!coord) continue
      sites.push({
        name: `${item['地点']}\n${(item['具体'] || []).slice(0, 3).join('、')}`,
        value: [coord[0], coord[1], parsePopulation(item['数量'])]
      })
    }
  }

  return sites.length > 0 ? sites : null
})

const hasWinteringData = computed(() => {
  return winteringData.value && winteringData.value.length > 0
})

// --- Threat & protection data ---
const threatData = computed(() => {
  if (!statusData.value) return null
  const threats = statusData.value['威胁因素']?.['主要威胁'] || []
  const measures = statusData.value['保护措施']?.['已实施措施'] || []
  const protectStatus = statusData.value['保护现状'] || null
  return { threats, measures, protectStatus }
})

function severityColor(level) {
  if (!level) return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#aaa' }
  if (level.includes('高') && !level.includes('中高')) return { bg: 'rgba(255,60,60,0.12)', border: 'rgba(255,60,60,0.3)', text: '#ff5555' }
  if (level.includes('中高')) return { bg: 'rgba(255,140,40,0.12)', border: 'rgba(255,140,40,0.3)', text: '#ff9944' }
  if (level.includes('中')) return { bg: 'rgba(255,200,50,0.12)', border: 'rgba(255,200,50,0.3)', text: '#ffcc44' }
  return { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#aaa' }
}

// --- Watchers ---
watch(() => props.bird?.id, (newId) => {
  if (newId && isVisible.value) {
    // Dispose existing charts
    if (migrationChart) { migrationChart.dispose(); migrationChart = null }
    if (populationChart) { populationChart.dispose(); populationChart = null }
    if (winteringChart) { winteringChart.dispose(); winteringChart = null }
    loadData(newId)
  }
})

watch(activeTab, async (tab) => {
  // Lazy-load ECharts only when user switches to a chart tab
  if (tab === 'migration' || tab === 'population' || tab === 'wintering') {
    await loadECharts()
  }
  await nextTick()
  resizeAllCharts()
  tryRenderCharts()
})

// When isMigratory changes (bird switched), ensure activeTab isn't stuck on hidden migration tab
watch(isMigratory, (val) => {
  if (!val && activeTab.value === 'migration') {
    activeTab.value = 'population'
  }
})

// --- Lifecycle ---
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  requestAnimationFrame(() => { isVisible.value = true })

  // ECharts is lazy-loaded on-demand when user switches to migration/population tab.
  // Do NOT load ECharts here — it freezes the page with 1MB+ of scripts & map data.

  if (props.bird?.hasDetailData) {
    loadData(props.bird.id)
  } else {
    loading.value = false
  }

  // Window resize → resize all ECharts instances
  windowResizeHandler = () => {
    resizeAllCharts()
  }
  window.addEventListener('resize', windowResizeHandler)

  nextTick(() => {
    // ResizeObserver for SVG fallback chart
    if (chartContainer.value) {
      chartResizeObserver = new ResizeObserver(updateChartSize)
      chartResizeObserver.observe(chartContainer.value)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (windowResizeHandler) {
    window.removeEventListener('resize', windowResizeHandler)
  }
  if (chartResizeObserver) chartResizeObserver.disconnect()
  if (mapResizeObserver) mapResizeObserver.disconnect()
  if (popResizeObserver) popResizeObserver.disconnect()
  if (winterResizeObserver) winterResizeObserver.disconnect()
  if (migrationChart) { migrationChart.dispose(); migrationChart = null }
  if (populationChart) { populationChart.dispose(); populationChart = null }
  if (winteringChart) { winteringChart.dispose(); winteringChart = null }
})
</script>

<template>
  <Teleport to="body">
    <div
      class="data-overlay"
      :class="{ visible: isVisible }"
      @click.self="handleClose"
      @wheel="handleScroll"
    >
      <div class="data-content">
        <!-- Close button -->
        <button class="data-close" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- Header -->
        <div class="data-header">
          <p class="data-label">详细数据</p>
          <h2 class="data-bird-name">{{ bird.nameCN }}</h2>
          <p class="data-bird-sub">{{ bird.name }}</p>
        </div>

        <!-- No data state -->
        <div v-if="!bird.hasDetailData" class="no-data">
          <div class="no-data-icon">📋</div>
          <p class="no-data-text">暂无详细数据</p>
          <p class="no-data-sub">该物种的详细调查数据正在收集中</p>
        </div>

        <!-- Loading state -->
        <div v-else-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载数据中...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="retry-btn" @click="loadData(bird.id)">重试</button>
        </div>

        <!-- Data tabs -->
        <template v-else>
          <div class="tab-bar">
            <button
              v-if="isMigratory"
              class="tab-btn"
              :class="{ active: activeTab === 'migration' }"
              @click="activeTab = 'migration'"
            >
              <span class="tab-emoji">🛫</span>
              <span class="tab-label">迁徙路线</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'population' }"
              @click="activeTab = 'population'"
            >
              <span class="tab-emoji">📈</span>
              <span class="tab-label">种群趋势</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'threat' }"
              @click="activeTab = 'threat'"
            >
              <span class="tab-emoji">⚠️</span>
              <span class="tab-label">威胁保护</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'wintering' }"
              @click="activeTab = 'wintering'"
            >
              <span class="tab-emoji">🗺️</span>
              <span class="tab-label">{{ isMigratory ? '越冬分布' : '地区分布' }}</span>
            </button>
          </div>

          <!-- Migration Tab (ECharts world map) -->
          <div v-show="activeTab === 'migration'" class="data-tab-body">
            <!-- ECharts loading -->
            <div v-if="echartsLoading" class="loading-state" style="padding: 60px 20px">
              <div class="spinner"></div>
              <p>加载地图组件中...</p>
            </div>
            <!-- ECharts failed -->
            <div v-else-if="echartsError" class="error-state" style="padding: 60px 20px">
              <p>地图组件加载失败，请检查网络连接</p>
            </div>
            <!-- No migration data -->
            <div v-else-if="!hasMigrationRoutes" class="no-chart-data">
              <p>该物种为非迁徙鸟类或暂无迁徙路线数据</p>
            </div>
            <!-- ECharts migration map -->
            <div v-else class="chart-wrapper">
              <div ref="migrationContainer" class="echarts-container migration-chart"></div>
              <!-- Legend -->
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-line spring"></span>
                  春季北迁 (2-5月)
                </div>
                <div class="legend-item">
                  <span class="legend-line autumn"></span>
                  秋季南迁 (10-12月)
                </div>
              </div>
              <!-- Migration overview -->
              <div v-if="migrationData?.['迁徙概述']" class="trend-summary">
                <p><strong>迁徙类型：</strong>{{ migrationData['迁徙概述']['迁徙类型'] }}</p>
                <p><strong>迁徙距离：</strong>{{ migrationData['迁徙概述']['迁徙距离'] }}</p>
                <p><strong>飞行速度：</strong>{{ migrationData['迁徙概述']['飞行速度'] }}</p>
              </div>
            </div>
          </div>

          <!-- Population Tab (ECharts line chart or SVG fallback) -->
          <div v-show="activeTab === 'population'" class="data-tab-body">
            <!-- ECharts version -->
            <div v-if="echartsReady" class="chart-wrapper">
              <div ref="populationContainer" class="echarts-container population-chart"></div>
              <!-- Trend summary -->
              <div v-if="populationData?.['种群趋势分析']" class="trend-summary">
                <p><strong>总体趋势：</strong>{{ populationData['种群趋势分析']['总体趋势'] }}</p>
                <p><strong>当前状况：</strong>{{ populationData['种群趋势分析']['当前状况'] }}</p>
              </div>
            </div>
            <!-- SVG fallback -->
            <div v-else-if="chartData" ref="chartContainer" class="chart-container">
              <svg
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                :width="chartWidth"
                :height="chartHeight"
                class="line-chart"
              >
                <line
                  v-for="tick in chartData.yTickValues"
                  :key="'grid-' + tick.value"
                  :x1="chartData.padding.left"
                  :y1="tick.y"
                  :x2="chartData.padding.left + chartData.plotW"
                  :y2="tick.y"
                  stroke="rgba(255,255,255,0.06)"
                  stroke-width="1"
                  stroke-dasharray="3,4"
                />
                <text
                  v-for="tick in chartData.yTickValues"
                  :key="'ylabel-' + tick.value"
                  :x="chartData.padding.left - 10"
                  :y="tick.y + 4"
                  text-anchor="end"
                  class="axis-label"
                >{{ tick.value.toLocaleString() }}</text>
                <text
                  v-for="tick in chartData.xTicks"
                  :key="'xlabel-' + tick.year"
                  :x="tick.x"
                  :y="chartData.padding.top + chartData.plotH + 24"
                  text-anchor="middle"
                  class="axis-label"
                >{{ tick.year }}</text>
                <line
                  :x1="chartData.padding.left"
                  :y1="chartData.padding.top + chartData.plotH"
                  :x2="chartData.padding.left + chartData.plotW"
                  :y2="chartData.padding.top + chartData.plotH"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="1"
                />
                <line
                  :x1="chartData.padding.left"
                  :y1="chartData.padding.top"
                  :x2="chartData.padding.left"
                  :y2="chartData.padding.top + chartData.plotH"
                  stroke="rgba(255,255,255,0.15)"
                  stroke-width="1"
                />
                <polygon
                  :points="chartData.areaFillPoints"
                  fill="url(#areaGrad)"
                  opacity="0.5"
                />
                <polyline
                  :points="chartData.globalPoints"
                  fill="none"
                  stroke="#4ade80"
                  stroke-width="2.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <circle
                  v-for="(dot, i) in chartData.globalDots"
                  :key="'gdot-' + i"
                  :cx="dot.x"
                  :cy="dot.y"
                  r="3"
                  fill="#4ade80"
                  stroke="rgba(0,0,0,0.4)"
                  stroke-width="1"
                >
                  <title>{{ dot.year }}: {{ dot.value.toLocaleString() }}</title>
                </circle>
                <polyline
                  v-if="chartData.hasChina"
                  :points="chartData.chinaPoints"
                  fill="none"
                  stroke="#60a5fa"
                  stroke-width="2"
                  stroke-dasharray="8,4"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#4ade80" stop-opacity="0.18" />
                    <stop offset="100%" stop-color="#4ade80" stop-opacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-line global"></span>
                  全球种群
                </div>
                <div v-if="chartData.hasChina" class="legend-item">
                  <span class="legend-line china"></span>
                  {{ chartData.chinaLabel }}
                </div>
              </div>
              <div v-if="populationData?.['种群趋势分析']" class="trend-summary">
                <p><strong>总体趋势：</strong>{{ populationData['种群趋势分析']['总体趋势'] }}</p>
                <p><strong>当前状况：</strong>{{ populationData['种群趋势分析']['当前状况'] }}</p>
              </div>
            </div>
            <div v-else class="no-chart-data">
              <p>暂无种群趋势数据</p>
            </div>
          </div>

          <!-- Wintering / Distribution Tab (China map) -->
          <div v-show="activeTab === 'wintering'" class="data-tab-body">
            <!-- ECharts loading -->
            <div v-if="echartsLoading" class="loading-state" style="padding: 60px 20px">
              <div class="spinner"></div>
              <p>加载地图组件中...</p>
            </div>
            <!-- ECharts failed -->
            <div v-else-if="echartsError" class="error-state" style="padding: 60px 20px">
              <p>地图组件加载失败，请检查网络连接</p>
            </div>
            <!-- No data for migratory bird -->
            <div v-else-if="isMigratory && !hasWinteringData" class="no-chart-data">
              <p>暂无越冬分布数据</p>
            </div>
            <!-- No data for resident bird -->
            <div v-else-if="!isMigratory && (!distributionData || distributionData.length === 0)" class="no-chart-data">
              <p>暂无分布数据</p>
            </div>
            <!-- Wintering map (migratory) -->
            <div v-else-if="isMigratory" class="chart-wrapper">
              <div ref="winteringContainer" class="echarts-container wintering-chart"></div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot wintering"></span>
                  越冬地点
                </div>
                <div class="legend-item">
                  <span class="legend-dot highlight"></span>
                  越冬省份
                </div>
              </div>
            </div>
            <!-- Distribution map (resident) -->
            <div v-else class="chart-wrapper">
              <div ref="winteringContainer" class="echarts-container wintering-chart"></div>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-dot wintering"></span>
                  分布省份
                </div>
                <div class="legend-item">
                  <span class="legend-dot highlight"></span>
                  分布区域
                </div>
              </div>
            </div>
          </div>

          <!-- Threat Tab (kept as-is) -->
          <div v-show="activeTab === 'threat'" class="data-tab-body">
            <div v-if="threatData" class="threat-content">
              <div v-if="threatData.protectStatus" class="protect-status-card">
                <h4 class="section-header">保护等级</h4>
                <div class="protect-levels">
                  <span v-if="threatData.protectStatus['保护等级']?.['中国']" class="protect-badge">
                    中国：{{ threatData.protectStatus['保护等级']['中国'] }}
                  </span>
                  <span v-if="threatData.protectStatus['保护等级']?.['IUCN红色名录']" class="protect-badge">
                    IUCN：{{ threatData.protectStatus['保护等级']['IUCN红色名录'] }}
                  </span>
                  <span v-if="threatData.protectStatus['保护等级']?.['CITES']" class="protect-badge">
                    CITES：{{ threatData.protectStatus['保护等级']['CITES'] }}
                  </span>
                </div>
                <p v-if="threatData.protectStatus['全球种群数量']" class="protect-pop">
                  {{ threatData.protectStatus['全球种群数量'] }}
                </p>
              </div>

              <div v-if="threatData.threats.length > 0" class="threat-section">
                <h4 class="section-header">主要威胁</h4>
                <div
                  v-for="(t, i) in threatData.threats"
                  :key="'threat-' + i"
                  class="threat-item"
                  :style="{
                    background: severityColor(t['严重程度']).bg,
                    borderColor: severityColor(t['严重程度']).border
                  }"
                >
                  <div class="threat-header">
                    <span class="threat-type">{{ t['类型'] }}</span>
                    <span
                      class="severity-badge"
                      :style="{
                        background: severityColor(t['严重程度']).border,
                        color: severityColor(t['严重程度']).text
                      }"
                    >{{ t['严重程度'] }}</span>
                  </div>
                  <p class="threat-desc">{{ t['详细说明'] }}</p>
                  <p v-if="t['影响区域']" class="threat-area">影响区域：{{ t['影响区域'] }}</p>
                </div>
              </div>

              <div v-if="threatData.measures.length > 0" class="measures-section">
                <h4 class="section-header">保护措施</h4>
                <ul class="measures-list">
                  <li v-for="(m, i) in threatData.measures" :key="'measure-' + i" class="measure-item">
                    {{ m }}
                  </li>
                </ul>
              </div>
            </div>
            <div v-else class="no-chart-data">
              <p>暂无威胁保护数据</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.data-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.94);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.data-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

.data-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  padding: 24px 28px;
  position: relative;
  transform: scale(0.95) translateY(10px);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
}
.data-overlay.visible .data-content {
  transform: scale(1) translateY(0);
}

.data-content::-webkit-scrollbar { width: 4px; }
.data-content::-webkit-scrollbar-track { background: transparent; }
.data-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

.data-close {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.5);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}
.data-close:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}

.data-header {
  text-align: center;
  margin-bottom: 24px;
}
.data-label {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 6px;
}
.data-bird-name {
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 3px;
  margin: 0;
}
.data-bird-sub {
  font-size: 13px;
  font-weight: 300;
  color: rgba(255,255,255,0.4);
  letter-spacing: 2px;
  margin: 4px 0 0;
}

.no-data, .loading-state, .error-state, .no-chart-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.5);
  text-align: center;
}
.no-data-icon { font-size: 48px; margin-bottom: 16px; }
.no-data-text { font-size: 18px; font-weight: 300; letter-spacing: 2px; margin: 0 0 8px; }
.no-data-sub { font-size: 13px; color: rgba(255,255,255,0.3); margin: 0; }

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: rgba(255,255,255,0.6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.retry-btn {
  margin-top: 12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.7);
  padding: 8px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: all 0.3s;
}
.retry-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  margin-bottom: 20px;
}
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 1px;
  transition: all 0.3s;
}
.tab-btn:hover { color: rgba(255,255,255,0.7); }
.tab-btn.active { color: #fff; border-bottom-color: rgba(255,255,255,0.5); }
.tab-emoji { font-size: 16px; }

.data-tab-body { min-height: 300px; }

/* ECharts container */
.chart-wrapper {
  width: 100%;
}
.echarts-container {
  width: 100%;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  background: #0a0a0c;
}
.migration-chart {
  height: 480px;
}
.population-chart {
  height: 400px;
}
.wintering-chart {
  height: 520px;
}

/* SVG chart container */
.chart-container { width: 100%; }
.line-chart { display: block; width: 100%; }
.axis-label {
  font-size: 11px;
  fill: rgba(255,255,255,0.4);
  font-family: inherit;
}

/* Legend */
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-top: 12px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}
.legend-line {
  display: inline-block;
  width: 28px;
  height: 3px;
  border-radius: 2px;
}
.legend-line.global { background: #4ade80; }
.legend-line.china {
  background: repeating-linear-gradient(90deg, #60a5fa 0px, #60a5fa 6px, transparent 6px, transparent 10px);
  height: 2px;
}
.legend-line.spring {
  background: transparent;
  border-top: 2px dashed #59d4ff;
  height: 0;
  width: 32px;
}
.legend-line.autumn {
  background: transparent;
  border-top: 2px dashed #ffb0cc;
  height: 0;
  width: 32px;
}
.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.legend-dot.wintering {
  background: #81c784;
  box-shadow: 0 0 6px rgba(129,199,132,0.6);
}
.legend-dot.highlight {
  background: #162216;
  border: 1px solid rgba(129,199,132,0.4);
}

.trend-summary {
  margin-top: 16px;
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
}
.trend-summary p {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255,255,255,0.6);
  margin: 0 0 4px;
}
.trend-summary p:last-child { margin-bottom: 0; }
.trend-summary strong { color: rgba(255,255,255,0.8); font-weight: 400; }

/* Threat & Protection */
.threat-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.section-header {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.6);
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.protect-status-card {
  padding: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
}
.protect-status-card .section-header { margin-bottom: 10px; padding-bottom: 6px; }
.protect-levels { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.protect-badge {
  padding: 5px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}
.protect-pop { font-size: 13px; color: rgba(255,255,255,0.5); margin: 0; }

.threat-item {
  padding: 14px;
  border: 1px solid;
  border-radius: 8px;
  margin-bottom: 10px;
}
.threat-item:last-child { margin-bottom: 0; }
.threat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.threat-type { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.85); }
.severity-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  letter-spacing: 1px;
}
.threat-desc { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.55); margin: 0 0 4px; }
.threat-area { font-size: 11px; color: rgba(255,255,255,0.3); margin: 0; }

.measures-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.measure-item {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.6);
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 6px;
  position: relative;
  padding-left: 22px;
}
.measure-item::before {
  content: '•';
  position: absolute;
  left: 10px;
  color: rgba(255,255,255,0.3);
}

@media (max-width: 768px) {
  .data-content { padding: 20px 16px; max-height: 85vh; }
  .data-bird-name { font-size: 18px; }
  .tab-btn { font-size: 12px; padding: 10px 8px; gap: 4px; }
  .tab-emoji { font-size: 14px; }
  .chart-legend { gap: 16px; }
  .migration-chart { height: 360px; }
  .population-chart { height: 320px; }
}
</style>
