<script setup lang="ts">
  import { IconRight } from '@arco-design/web-vue/es/icon'
  import { Ref } from 'vue'

  interface Props {
    title: string
    type?: 'select' | 'switch' | 'router' | undefined
    modelValue?: selectType | switchType | undefined
  }

  type selectType = string | number | (string | number)[]

  type switchType = string | number | boolean

  let value: Ref<any>

  const props = withDefaults(defineProps<Props>(), {
    type: undefined,
    modelValue: undefined,
  })

  const { title, type, modelValue } = toRefs(props)

  if (['select', 'switch'].includes(type.value)) {
    value = ref(modelValue.value)
  }

  const change = (val: Props['modelValue']) => {
    emit('update:modelValue', val)
  }

  const emit = defineEmits<{
    (e: 'click', value: Event): void
    (e: 'update:modelValue', value: Props['modelValue']): void
  }>()

  const handleClick = (ev: Event) => {
    emit('click', ev)
  }
</script>

<template>
  <div class="tile leading-11 bg-$color-bg-2 active:bg-$color-fill-3" @click="handleClick">
    <div class="tile-border flex items-center justify-between ml-4 pr-4">
      <div>{{ title }}</div>
      <template v-if="type === 'select'">
        <a-select
          v-model="value"
          :style="{ width: '120px' }"
          :bordered="false"
          :trigger-props="{ autoFitPopupMinWidth: true }"
          @change="change"
        >
          <slot></slot>
        </a-select>
      </template>
      <template v-else-if="type === 'switch'">
        <a-switch v-model="value" @change="change" />
      </template>
      <template v-else-if="type === 'router'">
        <IconRight />
      </template>
      <template v-else>
        <slot></slot>
      </template>
    </div>
  </div>
</template>

<style lang="less" scoped>
  .tile:not(:last-child) .tile-border {
    border-bottom: solid 1px var(--color-neutral-3);
  }
  :deep(.arco-select) {
    padding: 0;
    .arco-select-view-value {
      justify-content: flex-end;
    }
  }
</style>
