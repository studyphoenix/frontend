<script setup lang="ts">
    import { getCurrentInstance } from 'vue';
    import type {
        ModelChatMessage
    } from '@/ts/types/api';
    import {
    request
    } from '@janishutz/oidc-login-sdk-browser';

    const props = defineProps<{
        'messages': ModelChatMessage[];
    }>();
    const instance = getCurrentInstance();

    const deleteMessage = async ( id: number ) => {
        try {
            return ( await request.deleteRequest( `/chats/messages/delete/${ id }`) );
        } catch ( e ) {
            console.error( e );
            alert( 'Failed to delete message' ); // This needs to use some more elaborate component that probably exists already
        }
    }

    const del = async (index: number) => {
        let m: ModelChatMessage = props.messages[index];
        await deleteMessage(m.id);
        props.messages.splice(index, 1);
        instance?.proxy?.$forceUpdate();
    };
</script>

<template>
    <div class="d-flex flex-column">
        <div
            v-for="(x, index) in props.messages"
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
                <v-btn
                    class="ma-n4 position-absolute"
                    color="secondary"
                    icon="mdi-trash-can"
                    width="24"
                    height="24"
                    @click="del(index)"
                />
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
