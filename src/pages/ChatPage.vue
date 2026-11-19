<script setup lang="ts">
    import {
        computed,
        onMounted,
        ref,
        watch
    } from 'vue';
    import type {
        ModelChat
    } from '@/ts/types/api';
    import SideBar from '@/components/SideBar.vue';
    import {
        getChatModeMeta
    } from '@/ts/util/chat-modes';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';
    import {
        useRoute
    } from 'vue-router';

    const route = useRoute();
    const loading = ref( false );
    const chat = ref<ModelChat | null>( null );
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const chatId = computed( () => {
        const raw = Number( route.params.id );

        return Number.isFinite( raw ) && raw > 0 ? raw : null;
    } );
    const displayName = computed( () => {
        if ( chat.value?.name ) {
            return chat.value.name;
        }

        if ( typeof route.query.name === 'string' && route.query.name.trim() ) {
            return route.query.name;
        }

        return chatId.value ? `Chat #${ chatId.value }` : 'Study Chat';
    } );
    const modeMeta = computed( () => {
        const modeNum = chat.value?.mode ?? Number( route.query.mode ?? 1 );

        return getChatModeMeta( modeNum );
    } );

    const loadChat = async ( id: number | null ) => {
        if ( !id || isBackendless ) {
            chat.value = null;

            return;
        }

        loading.value = true;

        try {
            const res = await request.get( `/chats/get/${ id }` );

            if ( res.ok ) {
                chat.value = await res.json() as ModelChat;
            }
        } catch {
            chat.value = null;
        } finally {
            loading.value = false;
        }
    };

    watch( chatId, id => {
        loadChat( id );
    } );

    onMounted( () => {
        loadChat( chatId.value );
    } );
</script>

<template>
    <v-container class="fill-height d-flex flex-column align-center justify-center pa-6 text-center">
        <SideBar />

        <div
            v-if="loading"
            class="py-8"
        >
            <v-progress-circular indeterminate />
        </div>

        <v-sheet
            v-else
            class="wip-card pa-8"
            max-width="480"
            rounded="lg"
            width="100%"
        >
            <v-icon
                class="mb-4 text-medium-emphasis"
                :icon="modeMeta.icon"
                size="48"
            />

            <div class="text-caption text-uppercase text-medium-emphasis mb-1">
                {{ modeMeta.label }} Mode
            </div>

            <h1 class="text-h5 font-weight-bold mb-3">
                {{ displayName }}
            </h1>

            <p class="text-body-2 text-medium-emphasis mb-6">
                Work in progress. This chat interface is not implemented yet.
            </p>

            <v-btn
                color="on-surface"
                prepend-icon="mdi-arrow-left"
                to="/techtree"
                variant="outlined"
            >
                Back to Tech Tree
            </v-btn>
        </v-sheet>
    </v-container>
</template>

<style scoped lang="scss">
    .wip-card {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }
</style>
