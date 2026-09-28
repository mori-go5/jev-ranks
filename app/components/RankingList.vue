<script setup lang="ts">
import type { RankingEntry } from '#shared/types/ranking'

const props = defineProps<{
  entries: RankingEntry[]
  expanded: boolean
}>()

const emit = defineEmits<{ 'update:expanded': [value: boolean] }>()
const visibleEntries = computed(() => props.expanded ? props.entries : props.entries.slice(0, 10))
</script>

<template>
  <section class="ranking-list-section" aria-labelledby="full-ranking-title">
    <div class="list-heading">
      <div>
        <p class="eyebrow">全ランキング</p>
        <h3 id="full-ranking-title">すべての順位<span class="list-total"> / {{ entries.length }}件</span></h3>
      </div>
      <button
        v-if="entries.length > 10"
        class="text-button"
        type="button"
        :aria-expanded="expanded"
        @click="emit('update:expanded', !expanded)"
      >
        {{ expanded ? '上位10件に戻す' : `全${entries.length}件を見る` }}
        <span aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
      </button>
    </div>

    <TransitionGroup tag="ol" name="rank-row" class="ranking-list" aria-label="Complete ranking">
      <li v-for="(entry, index) in visibleEntries" :key="entry.candidate.id" class="ranking-row" :style="{ '--row-index': index }">
        <span class="row-rank">{{ String(entry.rank).padStart(2, '0') }}</span>
        <span class="row-name">{{ entry.candidate.label }}</span>
        <span class="row-bar" aria-hidden="true"><span :style="{ width: `${entry.displayScore}%` }" /></span>
        <span class="row-score"><span>{{ entry.displayScore.toFixed(1) }}</span><small>点</small></span>
      </li>
    </TransitionGroup>

    <p class="score-note">Jev Scoreはテーマへの適合度を5段階で評価し、100点換算した値です。確率や正解率ではありません。</p>
  </section>
</template>
