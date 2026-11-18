<script setup lang="ts">
    import type {
        ChatMessagePair
    } from '@/ts/types';

    const props = defineProps<{
        'message': ChatMessagePair
    }>();
</script>

<template>
    <div class="d-flex flex-column">
        <v-sheet class="h-auto w-75 ps-2 rounded-lg mb-4 align-self-end">
            {{ props.message.question }}
        </v-sheet>
        <v-sheet class="h-auto w-75 ps-2 rounded-lg mb-4 align-self-start">
            {{ props.message.response }}
        </v-sheet>
        <ChatRenderer v-if="props.message.child" :message="props.message.child!" />
    </div>
</template>
