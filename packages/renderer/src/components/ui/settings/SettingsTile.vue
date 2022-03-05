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
  <div
    class="flex justify-between h-11 leading-11 px-4 bg-$color-bg-1 active:bg-$color-fill-3"
    @click="handleClick"
  >
    <div>{{ props.title }}</div>
    <slot></slot>
  </div>
</template>

<style lang="less" scoped>
  :deep(.arco-select) {
    padding: 0;
    .arco-select-view-value {
      justify-content: flex-end;
    }
  }
</style>
