<script setup lang="ts">
    import {
        ref,
        reactive
    } from 'vue';
    import ChatRenderer from '@/components/chat/ChatRenderer.vue';
    import type {
        ModelChatMessage
    } from '@/ts/types/api';

    let msgc = 2;
    const canSend = reactive(ref(true));

    const compKey = ref( 0 );
    const userMessage = ref( '' );

    const send = () => {
        if ( canSend.value ) {
            let msg: ModelChatMessage
                = {
                    'chatId': 0, // need to actually pick the right value
                    'id': msgc++,
                    'userMessage': userMessage.value,
                    'modelMessage': '',
                    'summary': '',
                    'updatedAt': ''
                };

            msgs.push( msg );
            userMessage.value = '';
            compKey.value++;
        }
    };

    let msgs: ModelChatMessage[]
        = [
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
        <ChatRenderer :key="compKey" class="h-100 flex-column d-flex text-body-large" :messages="msgs" />
        <v-sheet class="d-flex ga-2 position-sticky pa-2 bottom-0 border rounded-lg">
            <v-text-field
                v-model="userMessage"
                rows="1"
                autofocus
                label="Ask Anything"
                @keypress.enter="send"
                v-if="canSend"
            />
            <v-text-field
                v-model="userMessage"
                rows="1"
                autofocus
                label="Ask Anything"
                @keypress.enter="send"
                v-else
                disabled
            />
            <v-btn
                class="align-self-start"
                icon="mdi-send"
                width="56"
                height="56"
                @click="send"
                v-if="canSend"
            />
            <v-btn
                class="align-self-start"
                icon="mdi-send"
                width="56"
                height="56"
                @click="send"
                v-else
                disabled
            />
        </v-sheet>
    </v-container>
</template>
