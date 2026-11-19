<script setup lang="ts">
    /*import {
        type Ref,
        ref
    } from 'vue';*/
    import type {
        ModelChatMessage
    } from '@/ts/types/api';
    import ChatRenderer from '@/components/chat/ChatRenderer.vue';

    let canSend = true;
    const send = () => {
        if (canSend) {

        }
    };

    let msgs: ModelChatMessage[] =
        [
            {
                'chatId': 0,
                'id': 0,
                'userMessage': 'Give me a summary of this one topic por favor',
                'modelMessage': `Sure! here is a summary of ...
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
                'summary': '',
                'updatedAt': ''
            },
            {
                'chatId': 0,
                'id': 1,
                'userMessage': 'What does ... mean?',
                'modelMessage': '...',
                'summary': '',
                'updatedAt': ''
            }
        ];

</script>

<template>
    <v-container class="fill-height d-flex flex-column justify-center">
        <ChatRenderer class="h-100 flex-column d-flex text-body-large" :message="msgs" />
        <v-sheet class="d-flex ga-2 position-sticky pa-2 bottom-0 border rounded-lg">
            <v-text-field label="Ask Anything" />
            <v-btn
                    icon="mdi-send"
                    @click="send"
                />
        </v-sheet>
    </v-container>
</template>
