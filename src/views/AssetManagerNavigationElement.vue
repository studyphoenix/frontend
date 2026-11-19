<script setup lang="ts">
    import type {
        ModelSubject
    } from '@/ts/types/api';

    defineProps<{
        'subject': ModelSubject
    }>();

    const emit = defineEmits<{
        'select': [subject: ModelSubject]
    }>();
</script>

<template>
    <button
        class="subject-folder"
        type="button"
        @click="emit( 'select', subject )"
    >
        <i class="subject-folder__icon mdi mdi-folder" aria-hidden="true"></i>
        <span class="subject-folder__name">{{ subject.name }}</span>
    </button>
</template>

<!-- Style is managed in styles/subject-picker.scss -->
