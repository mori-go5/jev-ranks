<script setup lang="ts">
import { rankingDatasets } from '#shared/data/datasets'

defineProps<{ modelValue: string; customMode: boolean; customValue: string; customError: string | null; customCount: number }>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:customMode': [value: boolean]
  'update:customValue': [value: string]
}>()
</script>

<template>
  <fieldset class="dataset-picker">
    <legend class="eyebrow">01 / ランキングの題材</legend>
    <div class="dataset-mode theme-mode" role="group" aria-label="題材の入力方法">
      <button type="button" :class="{ 'is-active': !customMode }" :aria-pressed="!customMode" @click="emit('update:customMode', false)">候補から選ぶ</button>
      <button type="button" :class="{ 'is-active': customMode }" :aria-pressed="customMode" @click="emit('update:customMode', true)">自由に入力</button>
    </div>
    <div v-if="!customMode" class="dataset-grid">
      <button
        v-for="(dataset, index) in rankingDatasets"
        :key="dataset.id"
        class="dataset-choice"
        :class="{ 'is-selected': modelValue === dataset.id }"
        type="button"
        :aria-pressed="modelValue === dataset.id"
        @click="emit('update:modelValue', dataset.id)"
      >
        <span class="dataset-symbol">{{ dataset.symbol }}</span>
        <span class="dataset-title-row">
          <span class="dataset-title">{{ dataset.label }}</span>
          <span class="dataset-count">{{ String(dataset.candidates.length).padStart(2, '0') }}</span>
        </span>
        <span class="dataset-description">{{ dataset.description }}</span>
        <span class="dataset-index">{{ String(index + 1).padStart(2, '0') }}</span>
      </button>
    </div>
    <div v-else class="custom-dataset-input">
      <textarea
        :value="customValue"
        rows="7"
        maxlength="1230"
        placeholder="1行に1項目ずつ入力してください&#10;例：&#10;コーヒー&#10;紅茶&#10;緑茶"
        aria-label="ランキングする項目"
        :aria-invalid="Boolean(customError)"
        @input="emit('update:customValue', ($event.target as HTMLTextAreaElement).value)"
      />
      <div class="custom-dataset-meta">
        <span :class="{ 'is-error': customError }">{{ customError ?? `入力済み：${customCount}項目` }}</span>
        <span>3〜30項目・各40文字まで</span>
      </div>
    </div>
  </fieldset>
</template>
