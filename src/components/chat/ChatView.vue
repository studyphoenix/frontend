<script setup lang="ts">
    import {
        ref,
        type Ref
    } from 'vue';
    import ChatRenderer from '@/components/chat/ChatRenderer.vue';
    import type {
        ModelChatMessage
    } from '@/ts/types/api';
    import {
    request
    } from '@janishutz/oidc-login-sdk-browser';

    const props = defineProps<{
        'id': number;
    }>();

    let msgc = 2;

    const canSend = ref( true );
    const compKey = ref( 0 );
    const userMessage = ref( '' );

    const send = async () => {
        if ( canSend.value ) {
            let msg: ModelChatMessage
                = {
                    'chatId': 0, // need to actually pick the right value
                    'id': 0,
                    'userMessage': userMessage.value,
                    'modelMessage': 'insertmodelmessagehere',
                    'summary': '',
                    'updatedAt': ''
                };
            msg.id = await createMessage(props.id, msg.modelMessage, userMessage.value);
            msgs.value.push( msg );
            userMessage.value = '';
            compKey.value++;
        }
    };

    const msgs: Ref<ModelChatMessage[]>
        =ref( [
        /*
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
            */
        ] );
    const loadMsgs = async ( chatId: number ) => {
        try {
            msgs.value = (await ( await request.get( `/chats/get/${ chatId }` ) ).json()).chatMessages;
        } catch ( e ) {
            console.error( e );
            alert( 'Failed to load messages' ); // This needs to use some more elaborate component that probably exists already
        }
    }

    const createMessage = async ( chatId: number, modelMessage: string, userMessage: string ) => {
        const data: ModelAddChatMessageRequest = {
            "modelMessage": modelMessage,
            "summary": "insertsummaryhere",
            "userMessage": userMessage
        }
        try {
            return ( await ( await request.put( `/chats/messages/add/${ chatId }`, JSON.stringify( data ) ) ).json() ).id;
        } catch ( e ) {
            console.error( e );
            alert( 'Failed to create message' ); // This needs to use some more elaborate component that probably exists already
        }
    }

    /*
    const parseChatId = () => {
        const start = location.search.substring( location.search.indexOf( 'id' ) + 3 );
        return start.slice( 0, start.indexOf( '&' ) >= 0 ? start.indexOf( '&') : undefined );
    }
    */

    // http://localhost:8081/test-chat/?id=0
    loadMsgs(props.id);
</script>

<template>
    <v-container class="fill-height d-flex flex-column justify-center">
        <ChatRenderer :key="compKey" class="h-100 flex-column d-flex text-body-large" :messages="msgs" />
        <v-sheet class="d-flex ga-2 pa-2 border rounded-lg" style="position: sticky; bottom: 0;">
            <v-text-field
                v-model="userMessage"
                :disabled="!canSend"
                rows="1"
                autofocus
                label="Ask Anything"
                @keypress.enter="send"
            />
            <v-btn
                :disabled="!canSend"
                class="align-self-start"
                icon="mdi-send"
                width="56"
                height="56"
                @click="send"
            />
        </v-sheet>
    </v-container>
</template>
