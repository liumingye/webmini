<script setup lang="ts">
  interface Props {
    title: string
  }

  const props = withDefaults(defineProps<Props>(), {})

  const emit = defineEmits<{
    (e: 'click', value: Event): void
  }>()

  const handleClick = (ev: Event) => {
    emit('click', ev)
  }
</script>

<template>
  <div class="tile leading-11 bg-$color-bg-2 active:bg-$color-fill-3" @click="handleClick">
    <div class="tile-border flex justify-between ml-4 pr-4">
      <div>{{ props.title }}</div>
      <slot></slot>
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
