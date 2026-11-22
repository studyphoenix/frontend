<script setup lang="ts">
    import {
        computed,
        ref,
        watch
    } from 'vue';
    import type {
        ModelChat
    } from '@/ts/types/api';
    import ProfessorAssetPanel from '@/components/chat/ProfessorAssetPanel.vue';
    import ProfessorChatPane from '@/components/chat/ProfessorChatPane.vue';
    import SplitView from '@/components/custom-ui-elements/SplitView.vue';
    import {
        useProfessorMode
    } from '@/composables/professor-mode';
    import {
        useRoute
    } from 'vue-router';
    import {
        useStateStore
    } from '@/stores/statestore';

    const props = defineProps<{
        'chat': ModelChat | null;
        'chatId': number | null;
        'chatName': string;
    }>();
    const route = useRoute();
    const stateStore = useStateStore();
    const {
        subtopic,
        assets,
        messages,
        openingMessage,
        checkpointActive,
        checkpointFeedback,
        loadingContext,
        sending,
        error,
        initSession,
        sendMessage
    } = useProfessorMode();
    const showMaterials = ref( true );
    const resolvedSubtopicId = computed( (): number | null => {
        const fromQuery = Number( route.query.subtopicId );

        if ( Number.isFinite( fromQuery ) && fromQuery > 0 ) {
            return fromQuery;
        }

        return Number.isFinite( stateStore.selectedSubtopic ) && stateStore.selectedSubtopic > 0
            ? stateStore.selectedSubtopic
            : null;
    } );
    const resolvedSubjectId = computed( (): number | null => {
        return Number.isFinite( stateStore.selectedSubject ) && stateStore.selectedSubject > 0
            ? stateStore.selectedSubject
            : null;
    } );
    const progress = computed( () => {
        const val = Number( subtopic.value?.progress ?? 0 );

        return Number.isFinite( val ) ? Math.max( 0, Math.min( 100, val ) ) : 0;
    } );
    const progressColor = computed( () => {
        if ( progress.value >= 100 ) {
            return 'success';
        }

        if ( progress.value > 0 ) {
            return 'primary';
        }

        return 'surface-variant';
    } );
    const headerTitle = computed( () => {
        return subtopic.value?.name ? `${ subtopic.value.name }: ${ props.chatName }` : props.chatName;
    } );

    watch( [
        () => props.chatId,
        () => props.chat,
        resolvedSubtopicId
    ], async ( [
        ,
        chatObj,
        stId
    ] ) => {
        if ( stId && stId > 0 ) {
            stateStore.selectedSubtopic = stId;

            try {
                localStorage.setItem( 'sp-selected-subtopic', String( stId ) );
            } catch { /* */ }
        }

        await initSession( chatObj, props.chatName, stId, resolvedSubjectId.value );
        showMaterials.value = assets.value.length > 0;
    }, {
        'immediate': true
    } );

    const handleSend = async ( text: string ) => {
        await sendMessage( text, props.chatId, props.chatName );
    };
</script>

<template>
    <div class="professor-shell">
        <div class="professor-header d-flex align-center justify-space-between ga-4 flex-wrap px-5 py-3 flex-shrink-0">
            <div class="d-flex align-center ga-3 min-width-0">
                <v-btn
                    aria-label="Back to Tech Tree"
                    class="header-action-btn header-icon-btn flex-shrink-0"
                    color="on-surface"
                    height="40"
                    icon="mdi-arrow-left"
                    title="Back to Tech Tree"
                    to="/techtree"
                    variant="outlined"
                    width="40"
                />

                <h1 class="text-h6 font-weight-bold text-truncate">
                    {{ headerTitle }}
                </h1>
            </div>

            <div class="d-flex align-center ga-4 flex-wrap">
                <div
                    v-if="subtopic"
                    class="progress-block d-flex flex-column justify-center"
                >
                    <div class="d-flex align-baseline justify-space-between ga-3 mb-1">
                        <span class="text-caption text-medium-emphasis">
                            Subtopic Progress
                        </span>
                        <span class="text-caption font-weight-medium text-medium-emphasis">
                            {{ Math.round( progress ) }}%
                        </span>
                    </div>

                    <v-progress-linear
                        :chunk-gap="0"
                        :color="progressColor"
                        height="4"
                        :model-value="progress"
                        rounded
                        :stop-indicator="false"
                    />
                </div>

                <v-btn
                    class="header-action-btn"
                    color="on-surface"
                    height="40"
                    :prepend-icon="showMaterials ? 'mdi-dock-left' : 'mdi-file-document-outline'"
                    variant="outlined"
                    @click="showMaterials = !showMaterials"
                >
                    {{ showMaterials ? 'Hide Materials' : 'Show Materials' }}
                    <span
                        v-if="!showMaterials && assets.length > 0"
                        class="text-caption text-medium-emphasis ml-1"
                    >
                        ({{ assets.length }})
                    </span>
                </v-btn>
            </div>
        </div>

        <div class="professor-body d-flex flex-column flex-grow-1">
            <v-alert
                v-if="error"
                class="ma-3 mb-0 flex-shrink-0"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="error = null"
            >
                {{ error }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
            </v-alert>

            <div
                v-if="loadingContext"
                class="d-flex align-center justify-center flex-grow-1"
            >
                <v-progress-circular indeterminate />
            </div>

            <div
                v-else
                class="workspace-content flex-grow-1 overflow-hidden"
            >
                <SplitView
                    v-if="showMaterials"
                    :max-split="75"
                    :min-split="25"
                >
                    <template #left>
                        <ProfessorAssetPanel :assets="assets" />
                    </template>

                    <template #right>
                        <ProfessorChatPane
                            :checkpoint-active="checkpointActive"
                            :checkpoint-feedback="checkpointFeedback"
                            :messages="messages"
                            :opening-message="openingMessage"
                            :sending="sending"
                            @clear-checkpoint-feedback="checkpointFeedback = null"
                            @send="handleSend"
                        />
                    </template>
                </SplitView>

                <div
                    v-else
                    class="h-100 mx-auto"
                    style="max-width: 900px;"
                >
                    <ProfessorChatPane
                        :checkpoint-active="checkpointActive"
                        :checkpoint-feedback="checkpointFeedback"
                        :messages="messages"
                        :opening-message="openingMessage"
                        :sending="sending"
                        @clear-checkpoint-feedback="checkpointFeedback = null"
                        @send="handleSend"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .professor-shell {
        width: 100%;
        flex: 1 1 0;
        min-height: 0;
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        background-color: rgb(var(--v-theme-surface));
        overflow: hidden;

        :deep(.split-view-element) {
            overflow: hidden;
            height: calc(100% - 10px);
        }
    }

    .professor-header {
        border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

        .header-action-btn {
            border-color: rgba(var(--v-border-color), 0.38);

            &:hover {
                border-color: rgba(var(--v-border-color), 0.87);
            }
        }

        .header-icon-btn {
            border-radius: 4px;
        }
    }

    .professor-body,
    .workspace-content {
        min-height: 0;
    }

    .progress-block {
        width: 176px;
    }
</style>
