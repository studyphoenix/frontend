<script setup lang="ts">
    import type {
        ModelChatMessage
    } from '@/ts/types/api';

    // a useless comment (which I had to commit so that the eslint checker would work)
    // a useless comment (which I had to commit so that the eslint checker would work)
    const props = defineProps<{
        'messages': ModelChatMessage[];
    }>();
</script>

<template>
    <div class="d-flex flex-column">
        <div
            v-for="x in props.messages"
            :key="x.id"
            class="d-flex flex-column"
            :value="[x.userMessage, x.modelMessage, x.updatedAt, x.summary]"
        >
            <v-sheet
                class="px-2 rounded-lg mb-4 align-self-end"
                style="word-wrap: break-word;"
                max-width="80ch"
                color="primary"
            >
                <p>{{ x.userMessage }}</p>
            </v-sheet>
            <v-sheet
                class="px-2 rounded-lg mb-4 align-self-start"
                style="word-wrap: break-word;"
                max-width="80ch"
                color="secondary"
            >
                <p>{{ x.modelMessage }}</p>
            </v-sheet>
        </div>
    </div>
</template>
