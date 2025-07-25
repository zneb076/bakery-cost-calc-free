<script setup>
import BaseModal from './BaseModal.vue';

defineProps({
  videoUrl: { type: String, required: true },
});
const emit = defineEmits(['close']);
</script>

<template>
  <BaseModal @close="emit('close')" maxWidth="max-w-sm">
    <div class="aspect-[9/16] bg-black">
      <iframe
        :src="videoUrl"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="h-full w-full"
      ></iframe>
    </div>
  </BaseModal>
</template>
