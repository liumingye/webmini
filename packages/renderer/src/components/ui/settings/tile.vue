<script setup lang="ts">
  interface Props {
    title: string
    separate?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    separate: true,
  })

  const emit = defineEmits<{
    (e: 'click', value: Event): void
  }>()

  const handleClick = (ev: Event) => {
    emit('click', ev)
  }
</script>

<template>
  <div
    class="flex self-center justify-between h-11 leading-11 bg-$color-bg-1 px-4 mx-4 rounded-lg active:bg-$color-fill-3"
    :class="{
      'my-4': props.separate,
    }"
    @click="handleClick"
  >
    <div class="self-center">{{ props.title }}</div>
    <slot></slot>
  </div>
</template>
