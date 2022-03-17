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
    class="inline-flex justify-center items-center rounded-1 w-4 h-4 bg-$color-bg-3 cursor-pointer transition-opacity no-drag"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<style lang="less" scoped>
  button {
    color: var(--color-text-1);
    background: var(--color-neutral-3);

    &[disabled] {
      opacity: 0.4;
    }

    &:not([disabled]):hover {
      background: var(--color-neutral-4);
    }

    &:not([disabled]):active {
      background: var(--color-neutral-5);
    }
  }
</style>
