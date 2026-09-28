<script setup lang="ts">
import type { RankingEntry } from '#shared/types/ranking'

defineProps<{ entries: RankingEntry[] }>()

const places = [
  { rank: 1, label: '第1位', className: 'podium-first' },
  { rank: 2, label: '第2位', className: 'podium-second' },
  { rank: 3, label: '第3位', className: 'podium-third' },
]
</script>

<template>
  <ol class="podium" aria-label="Top 3">
    <li
      v-for="place in places"
      v-show="entries[place.rank - 1]"
      :key="place.rank"
      class="podium-place"
      :class="place.className"
      :style="{ '--place': place.rank }"
    >
      <span class="podium-label">{{ place.label }}</span>
      <span class="podium-rank">{{ String(place.rank).padStart(2, '0') }}</span>
      <span class="podium-name">{{ entries[place.rank - 1]?.candidate.label }}</span>
      <span class="podium-score">{{ entries[place.rank - 1]?.displayScore.toFixed(1) }} <small>JEVスコア</small></span>
    </li>
  </ol>
</template>
