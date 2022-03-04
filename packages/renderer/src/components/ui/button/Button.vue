<script setup lang="ts">
  interface Props {
    disabled?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false,
  })

  const emit = defineEmits<{
    (e: 'click', value: Event): void
  }>()

  const handleClick = (ev: Event) => {
    if (props.disabled) {
      return
    }
    emit('click', ev)
  }
</script>

<template>
  <button
    :disabled="disabled"
    class="inline-flex justify-center items-center rounded-1 w-4 h-4 bg-$color-bg-1 opacity-50 cursor-pointer transition-opacity no-drag"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<style lang="less" scoped>
  button {
    color: @color-app-bg;

    &[disabled] {
      opacity: 0.2;
    }

    &:not([disabled]):hover {
      opacity: 1;
    }
  }
</style>
