<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DatasetPicker from '../components/DatasetPicker.vue'
import HowItWorks from '../components/HowItWorks.vue'
import RankingList from '../components/RankingList.vue'
import RankingPodium from '../components/RankingPodium.vue'
import { commonThemes, findDataset, findTheme, rankingDatasets } from '#shared/data/datasets'
import { makeCustomCandidates, parseCustomItems, validateCustomItemLabels } from '#shared/utils/custom-dataset'
import type { RankingDataset, RankingResult, RankingTheme } from '#shared/types/ranking'

const selectedDatasetId = ref('japan-prefectures')
const isCustomDataset = ref(false)
const customDatasetText = ref('')
const selectedThemeId = ref('travel')
const customTheme = ref('')
const isCustomTheme = ref(false)
const result = ref<RankingResult | null>(null)
const clientId = ref('')
const isLoading = ref(false)
const isExpanded = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')

const customItemLabels = computed(() => parseCustomItems(customDatasetText.value))
const customDatasetError = computed(() => isCustomDataset.value ? validateCustomItemLabels(customItemLabels.value) : null)
const selectedDataset = computed<RankingDataset>(() => isCustomDataset.value
  ? {
      id: 'custom',
      label: '自由入力の項目',
      description: '',
      symbol: `CUSTOM / ${customItemLabels.value.length}`,
      candidates: makeCustomCandidates(customItemLabels.value),
      themes: commonThemes,
      defaultThemeId: 'favorite',
    }
  : findDataset(selectedDatasetId.value) ?? rankingDatasets[0]!)
const selectedTheme = computed<RankingTheme>(() => isCustomTheme.value
  ? { id: 'custom', label: customTheme.value.trim(), instructions: '' }
  : findTheme(selectedDataset.value, selectedThemeId.value) ?? selectedDataset.value.themes[0]!)
const isShowingResult = computed(() => result.value !== null)
const contenderCount = computed(() => selectedDataset.value.candidates.length)
const canRank = computed(() => Boolean(clientId.value)
  && !isLoading.value
  && !customDatasetError.value
  && (!isCustomTheme.value || customTheme.value.trim().length >= 2))

function chooseDataset(datasetId: string) {
  if (isLoading.value) return
  selectedDatasetId.value = datasetId
  const dataset = findDataset(datasetId)
  selectedThemeId.value = dataset?.defaultThemeId ?? ''
  isCustomTheme.value = false
  customTheme.value = ''
  result.value = null
  errorMessage.value = ''
}

function toggleCustomDataset(value: boolean) {
  if (isLoading.value) return
  isCustomDataset.value = value
  const dataset = value ? selectedDataset.value : findDataset(selectedDatasetId.value)
  selectedThemeId.value = dataset?.defaultThemeId ?? 'favorite'
  result.value = null
  errorMessage.value = ''
}

async function rankThem() {
  if (!canRank.value) return
  isLoading.value = true
  result.value = null
  errorMessage.value = ''
  statusMessage.value = `${contenderCount.value}件を評価しています。`

  try {
    result.value = await $fetch<RankingResult>('/api/rankings', {
      method: 'POST',
      body: {
        datasetId: selectedDataset.value.id,
        ...(isCustomDataset.value ? { customItems: customItemLabels.value } : {}),
        themeId: selectedTheme.value.id,
        ...(isCustomTheme.value ? { customTheme: customTheme.value.trim() } : {}),
        clientId: clientId.value,
      },
    })
    statusMessage.value = `ランキングが完成しました。${result.value.entries.length}件を表示します。`
    isExpanded.value = false
    await nextTick()
    document.querySelector('.results-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  catch (error) {
    const statusCode = Number((error as { statusCode?: number }).statusCode ?? (error as { response?: { status?: number } }).response?.status)
    errorMessage.value = statusCode === 429
      ? '利用が集中しています。少し待ってからもう一度お試しください。'
      : statusCode === 503
        ? '現在ランキングを作成できません。しばらくしてからお試しください。'
        : 'ランキングを作成できませんでした。選択内容を残したまま再試行できます。'
    statusMessage.value = 'ランキングの作成が中断されました。'
  }
  finally {
    isLoading.value = false
  }
}

function changeConditions() {
  result.value = null
  errorMessage.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  try {
    const storedId = localStorage.getItem('jev-ranks-client-id')
    clientId.value = storedId && /^[0-9a-f-]{36}$/i.test(storedId) ? storedId : crypto.randomUUID()
    localStorage.setItem('jev-ranks-client-id', clientId.value)
  }
  catch {
    clientId.value = crypto.randomUUID()
  }
})
</script>

<template>
  <main class="site-shell">
    <header class="site-header">
      <span class="wordmark"><span>JEV</span><i>RANKS</i></span>
    </header>

    <div class="content-wrap">
      <section v-if="!isShowingResult" class="setup-view" aria-labelledby="page-title">
        <div class="intro-line">
          <p class="eyebrow"><span class="live-dot" /> AIランキングメーカー</p>
        </div>

        <div class="intro-block">
          <div>
            <h1 id="page-title">身近なものを、<br><span>Jevならどう並べる？</span></h1>
            <p class="intro-copy">題材とテーマを選ぶだけ。Jevが全部まとめて順位をつける。</p>
          </div>
        </div>

        <div class="selection-board">
          <div class="selection-controls">
            <DatasetPicker
              :model-value="selectedDatasetId"
              :custom-mode="isCustomDataset"
              :custom-value="customDatasetText"
              :custom-error="customDatasetError"
              :custom-count="customItemLabels.length"
              @update:model-value="chooseDataset"
              @update:custom-mode="toggleCustomDataset"
              @update:custom-value="customDatasetText = $event"
            />

            <div class="theme-picker">
              <span class="eyebrow">02 / 比べるテーマ</span>
              <div class="theme-control">
                <div class="theme-mode" role="group" aria-label="テーマの入力方法">
                  <button type="button" :class="{ 'is-active': !isCustomTheme }" :aria-pressed="!isCustomTheme" @click="isCustomTheme = false">候補から選ぶ</button>
                  <button type="button" :class="{ 'is-active': isCustomTheme }" :aria-pressed="isCustomTheme" @click="isCustomTheme = true">自由に入力</button>
                </div>
                <div v-if="!isCustomTheme" class="select-wrap">
                  <select id="ranking-theme" v-model="selectedThemeId" :disabled="isLoading" aria-label="比べるテーマ">
                    <option v-for="theme in selectedDataset.themes" :key="theme.id" :value="theme.id">{{ theme.label }}</option>
                  </select>
                  <span class="select-mark" aria-hidden="true">⌄</span>
                </div>
                <div v-else class="custom-theme-wrap">
                  <input v-model="customTheme" type="text" maxlength="60" placeholder="例：雨の日に楽しめそうなのは" aria-label="自由なランキングテーマ" @keydown.enter="rankThem">
                  <span>{{ customTheme.length }}/60</span>
                </div>
              </div>
            </div>

            <div class="run-row">
              <button class="rank-button" type="button" :disabled="!canRank" @click="rankThem">
                <span>{{ isLoading ? '考えています…' : 'ランキングを作る' }}</span>
                <span class="button-arrow" aria-hidden="true">↗</span>
              </button>
              <div class="request-count"><strong>{{ contenderCount }}</strong>件をまとめて評価</div>
            </div>

            <div v-if="isLoading" class="loading-state" role="status">
              <span class="loading-marker" aria-hidden="true" />
              {{ contenderCount }}件を評価しています…
            </div>
            <div v-else-if="errorMessage" class="error-state" role="alert">
              <strong>作成できませんでした</strong>
              <p>{{ errorMessage }}</p>
              <button class="text-button" type="button" @click="rankThem">もう一度試す <span aria-hidden="true">↗</span></button>
            </div>
          </div>

          <aside class="board-aside" aria-label="ランキングの仕組み">
            <span class="aside-kicker">JEVの評価</span>
            <span class="aside-number">{{ String(contenderCount).padStart(2, '0') }}</span>
            <span class="aside-title">候補を<br>一度に評価</span>
            <span class="aside-rule" />
            <span class="aside-copy">すべてを同じ基準で評価し、その点数から順位を作ります。</span>
          </aside>
        </div>

        <HowItWorks />
      </section>

      <section v-else-if="result" class="results-view" aria-labelledby="result-title">
        <div class="results-topline">
          <p class="eyebrow"><span class="live-dot" /> ランキング完成</p>
          <button class="text-button" type="button" @click="changeConditions">← 条件を変える</button>
        </div>
        <div class="result-heading">
          <div>
            <p class="eyebrow">{{ result.dataset.label }} <span class="heading-divider">/</span> {{ result.stats.decisions }}件</p>
            <h1 id="result-title">{{ result.theme.label }}<span class="result-question">？</span></h1>
          </div>
          <p class="result-signature">JEVによる評価</p>
        </div>

        <div class="winner-band">
          <div class="winner-band-label"><span>トップ3</span><span>01—03</span></div>
          <RankingPodium :entries="result.entries.slice(0, 3)" />
        </div>

        <RankingList v-model:expanded="isExpanded" :entries="result.entries" />

        <div v-if="errorMessage" class="error-state result-error" role="alert">
          <strong>作成できませんでした</strong>
          <p>{{ errorMessage }}</p>
          <button class="text-button" type="button" @click="rankThem">もう一度試す <span aria-hidden="true">↗</span></button>
        </div>

        <HowItWorks />
      </section>

      <p class="sr-only" aria-live="polite">{{ statusMessage }}</p>
    </div>

    <footer class="site-footer">
      <span>JEV RANKS</span>
      <a href="https://github.com/mori-go5" target="_blank" rel="noopener noreferrer">
        作成者：mori-go5 <span aria-hidden="true">↗</span>
      </a>
    </footer>
  </main>
</template>
