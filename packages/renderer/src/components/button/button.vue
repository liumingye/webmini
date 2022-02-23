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
  <button :disabled="disabled" @click="handleClick">
    <slot />
  </button>
</template>

<style lang="less" scoped>
  button {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
    width: 16px;
    height: 16px;
    background: @color-bg-white;
    opacity: 0.5;
    color: @color-bg-pink;
    cursor: pointer;
    transition: opacity 0.2s ease;
    -webkit-app-region: no-drag;

    &[disabled] {
      opacity: 0.2;
    }

    &:not([disabled]):hover {
      opacity: 1;
    }
  }
</style>
