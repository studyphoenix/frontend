<script setup lang="ts">
    import type {
        ModelAsset,
        ModelChat,
        ModelSubtopic
    } from '@/ts/types/api';
    import {
        computed,
        onBeforeUnmount,
        onMounted,
        ref,
        watch
    } from 'vue';
    import {
        formatMediaBadge,
        getAssetDownloadUrl,
        openAssetManager,
        showAssetManager
    } from '@/composables/asset-manager';
    import {
        CHAT_MODES
    } from '@/ts/util/chat-modes';
    import ConfirmDeleteDialog from '@/components/custom-ui-elements/ConfirmDeleteDialog.vue';
    import NewChatDialog from '@/components/techtree/NewChatDialog.vue';
    import PopupElement from '@/components/custom-ui-elements/PopupElement.vue';
    import {
        useRouter
    } from 'vue-router';
    import {
        useSubjectAssets
    } from '@/composables/subject-assets';
    import {
        useTechTree
    } from '@/composables/techtree';

    interface PendingRemoval {
        'kind': 'chat' | 'asset';
        'id': number;
        'name': string;
    }

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'subtopic': ModelSubtopic | null;
        'subjectId'?: number;
    }>();
    const router = useRouter();
    const {
        subjectAssets,
        fetchSubjectAssets,
        removeSubjectAssetLocally
    } = useSubjectAssets();
    const {
        activeSubtopic,
        subtopicLoading,
        subtopicError,
        fetchSubtopicDetails,
        createAndAttachChat,
        deleteChat,
        associateAssetToSubtopic,
        deassociateAssetFromSubtopic,
        removeAssetLocally
    } = useTechTree();
    const attachingAsset = ref( false );
    const waitingForAssetSelection = ref( false );
    const newChatDialogOpen = ref( false );
    const creatingChat = ref( false );
    const pendingRemoval = ref<PendingRemoval | null>( null );
    const removingItem = ref( false );
    const detail = computed( () => {
        if ( activeSubtopic.value && props.subtopic && activeSubtopic.value.id === props.subtopic.id ) {
            return activeSubtopic.value;
        }

        return props.subtopic;
    } );
    const progress = computed( () => {
        const val = Number( detail.value?.progress ?? 0 );

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
    const statusText = computed( () => {
        if ( progress.value >= 100 ) {
            return 'Completed';
        }

        if ( progress.value > 0 ) {
            return `${ Math.round( progress.value ) }%`;
        }

        return 'Not started';
    } );

    const chatsByMode = ( mode: 1 | 2 | 3 ): ModelChat[] => {
        return ( detail.value?.chats ?? [] ).filter( c => c.mode === mode );
    };

    const groupedChatModes = computed( () => {
        return CHAT_MODES.map( cfg => ( {
            ...cfg,
            'chats': chatsByMode( cfg.mode )
        } ) ).filter( group => group.chats.length > 0 );
    } );
    const confirmDialogOpen = computed( {
        'get': () => pendingRemoval.value !== null,
        'set': ( val: boolean ) => {
            if ( !val ) {
                pendingRemoval.value = null;
            }
        }
    } );
    const confirmTitle = computed( () => {
        return pendingRemoval.value?.kind === 'chat'
            ? 'Delete chat?'
            : 'Remove asset from subtopic?';
    } );
    const confirmMessage = computed( () => {
        if ( pendingRemoval.value?.kind === 'chat' ) {
            return `Are you sure you want to delete "${ pendingRemoval.value.name }"?`;
        }

        return `Remove "${ pendingRemoval.value?.name ?? '' }" from this subtopic? The file will stay in your Asset Manager.`;
    } );
    const confirmLabel = computed( () => {
        return pendingRemoval.value?.kind === 'chat' ? 'Delete' : 'Remove';
    } );
    const inheritedSubjectAssets = computed( () => {
        const subtopicIds = new Set( ( detail.value?.assets ?? [] ).map( a => a.id ) );

        return subjectAssets.value.filter( sa => !subtopicIds.has( sa.id ) );
    } );
    const hasAnyAssets = computed( () => {
        return ( detail.value?.assets ?? [] ).length > 0 || inheritedSubjectAssets.value.length > 0;
    } );

    watch( [
        isOpen,
        () => props.subtopic?.id
    ], async ( [
        open,
        subtopicId
    ] ) => {
        if ( open && subtopicId ) {
            newChatDialogOpen.value = false;
            pendingRemoval.value = null;
            waitingForAssetSelection.value = false;
            await fetchSubtopicDetails( subtopicId, props.subtopic );

            if ( props.subjectId && props.subjectId > 0 ) {
                await fetchSubjectAssets( props.subjectId );
            }
        } else if ( !open ) {
            waitingForAssetSelection.value = false;
        }
    } );

    watch( showAssetManager, open => {
        if ( !open ) {
            waitingForAssetSelection.value = false;
        }
    } );

    const handleAssetSelected = async ( event: CustomEvent<number> ) => {
        if ( !waitingForAssetSelection.value || !isOpen.value ) {
            return;
        }

        waitingForAssetSelection.value = false;
        const target = detail.value;

        if ( !target ) {
            return;
        }

        attachingAsset.value = true;

        try {
            await associateAssetToSubtopic( target.id, event.detail );
        } finally {
            attachingAsset.value = false;
        }
    };

    const handleAssetDeleted = ( event: CustomEvent<number> ) => {
        removeAssetLocally( event.detail );
        removeSubjectAssetLocally( event.detail, props.subjectId );
    };

    onMounted( () => {
        document.addEventListener( 'studyphoenix:assets:select', handleAssetSelected );
        document.addEventListener( 'studyphoenix:assets:deleted', handleAssetDeleted );
    } );

    onBeforeUnmount( () => {
        document.removeEventListener( 'studyphoenix:assets:select', handleAssetSelected );
        document.removeEventListener( 'studyphoenix:assets:deleted', handleAssetDeleted );
    } );

    const openNewChatDialog = () => {
        subtopicError.value = null;
        newChatDialogOpen.value = true;
    };

    const navigateToChat = ( chat: ModelChat ) => {
        newChatDialogOpen.value = false;
        isOpen.value = false;
        router.push( {
            'name': 'chat',
            'params': {
                'id': String( chat.id )
            },
            'query': {
                'name': chat.name,
                'mode': String( chat.mode )
            }
        } );
    };

    const handleCreateChat = async ( payload: {
        'title': string;
        'mode': 1 | 2 | 3;
    } ) => {
        const target = detail.value;

        if ( !target ) {
            return;
        }

        creatingChat.value = true;
        const created = await createAndAttachChat( target.id, payload.title, payload.mode );

        creatingChat.value = false;

        if ( created ) {
            navigateToChat( created );
        }
    };

    const handleOpenChat = ( chat: ModelChat ) => {
        navigateToChat( chat );
    };

    const askRemoveChat = ( chat: ModelChat ) => {
        subtopicError.value = null;
        pendingRemoval.value = {
            'kind': 'chat',
            'id': chat.id,
            'name': chat.name
        };
    };

    const askRemoveAsset = ( asset: ModelAsset ) => {
        subtopicError.value = null;
        pendingRemoval.value = {
            'kind': 'asset',
            'id': asset.id,
            'name': asset.name
        };
    };

    const confirmRemove = async () => {
        const target = detail.value;
        const item = pendingRemoval.value;

        if ( !target || !item ) {
            return;
        }

        removingItem.value = true;

        try {
            if ( item.kind === 'chat' ) {
                await deleteChat( target.id, item.id );
            } else {
                await deassociateAssetFromSubtopic( target.id, item.id );
            }

            if ( !subtopicError.value ) {
                pendingRemoval.value = null;
            }
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Action failed';
        } finally {
            removingItem.value = false;
        }
    };

    const openAssetPicker = () => {
        subtopicError.value = null;
        waitingForAssetSelection.value = true;
        const attachedIds = [
            ...( detail.value?.assets ?? [] ).map( asset => asset.id ),
            ...subjectAssets.value.map( asset => asset.id )
        ];

        openAssetManager( 'select', {
            'disabledIds': attachedIds
        } );
    };
</script>

<template>
    <PopupElement
        v-model="isOpen"
        max-width="820"
    >
        <div v-if="detail" class="subtopic-popup">
            <div class="pr-8">
                <div class="d-flex align-baseline justify-space-between ga-3 mb-2">
                    <h2 class="text-h5 font-weight-bold">
                        {{ detail.name }}
                    </h2>

                    <span class="text-body-2 font-weight-medium text-medium-emphasis">
                        {{ statusText }}
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

            <v-divider class="my-4" />

            <v-alert
                v-if="subtopicError"
                class="mb-4"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="subtopicError = null"
            >
                {{ subtopicError }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
            </v-alert>

            <div
                v-if="subtopicLoading"
                class="d-flex align-center justify-center py-8"
            >
                <v-progress-circular indeterminate />
            </div>

            <div v-else class="popup-columns">
                <div class="popup-col d-flex flex-column">
                    <h3 class="text-subtitle-1 font-weight-medium mb-3">
                        Chats
                    </h3>

                    <div
                        v-if="groupedChatModes.length > 0"
                        class="d-flex flex-column ga-3 flex-grow-1"
                    >
                        <div
                            v-for="group in groupedChatModes"
                            :key="group.mode"
                        >
                            <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-1 px-1">
                                <v-icon
                                    :icon="group.icon"
                                    size="16"
                                />
                                <span>{{ group.label }} Mode</span>
                            </div>

                            <v-list
                                class="py-0 bg-transparent"
                                density="comfortable"
                            >
                                <v-list-item
                                    v-for="chat in group.chats"
                                    :key="chat.id"
                                    class="item-row px-2 rounded"
                                    :title="chat.name"
                                    @click="handleOpenChat( chat )"
                                >
                                    <template #append>
                                        <v-btn
                                            aria-label="Delete chat"
                                            class="row-action"
                                            color="medium-emphasis"
                                            density="comfortable"
                                            icon
                                            size="small"
                                            variant="text"
                                            @click.stop="askRemoveChat( chat )"
                                        >
                                            <v-icon
                                                icon="mdi-delete-outline"
                                                size="20"
                                            />
                                        </v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>
                    </div>

                    <div
                        v-else
                        class="text-body-2 text-medium-emphasis py-4 flex-grow-1"
                    >
                        No chats started yet.
                    </div>

                    <div class="mt-4">
                        <v-btn
                            block
                            color="on-surface"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            @click="openNewChatDialog"
                        >
                            New chat
                        </v-btn>
                    </div>
                </div>

                <v-divider class="d-none d-md-block" vertical />
                <v-divider class="d-md-none my-4" />

                <div class="popup-col d-flex flex-column">
                    <h3 class="text-subtitle-1 font-weight-medium mb-3">
                        Assets
                    </h3>

                    <div
                        v-if="hasAnyAssets"
                        class="d-flex flex-column ga-3 flex-grow-1"
                    >
                        <v-list
                            v-if="( detail.assets ?? [] ).length > 0"
                            class="py-0 bg-transparent"
                            density="comfortable"
                        >
                            <v-list-item
                                v-for="asset in detail.assets"
                                :key="asset.id"
                                class="item-row px-2 rounded"
                                :subtitle="formatMediaBadge( asset.mediaType )"
                                :title="asset.name"
                            >
                                <template #prepend>
                                    <v-icon
                                        :icon="asset.icon || 'mdi-file-document-outline'"
                                        size="20"
                                    />
                                </template>

                                <template #append>
                                    <div class="d-flex align-center ga-1">
                                        <v-btn
                                            aria-label="Download asset"
                                            color="medium-emphasis"
                                            density="comfortable"
                                            :href="getAssetDownloadUrl( asset.id )"
                                            icon
                                            size="small"
                                            target="_blank"
                                            variant="text"
                                        >
                                            <v-icon
                                                icon="mdi-download"
                                                size="20"
                                            />
                                        </v-btn>

                                        <v-btn
                                            aria-label="Remove asset from subtopic"
                                            color="medium-emphasis"
                                            density="comfortable"
                                            icon
                                            size="small"
                                            title="Remove from subtopic"
                                            variant="text"
                                            @click="askRemoveAsset( asset )"
                                        >
                                            <v-icon
                                                icon="mdi-link-variant-off"
                                                size="20"
                                            />
                                        </v-btn>
                                    </div>
                                </template>
                            </v-list-item>
                        </v-list>

                        <div v-if="inheritedSubjectAssets.length > 0">
                            <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-1 px-1">
                                <v-icon
                                    icon="mdi-folder-outline"
                                    size="16"
                                />
                                <span>From subject</span>
                            </div>

                            <v-list
                                class="py-0 bg-transparent"
                                density="comfortable"
                            >
                                <v-list-item
                                    v-for="asset in inheritedSubjectAssets"
                                    :key="asset.id"
                                    class="item-row px-2 rounded"
                                    :subtitle="formatMediaBadge( asset.mediaType )"
                                    :title="asset.name"
                                >
                                    <template #prepend>
                                        <v-icon
                                            :icon="asset.icon || 'mdi-file-document-outline'"
                                            size="20"
                                        />
                                    </template>

                                    <template #append>
                                        <v-btn
                                            aria-label="Download asset"
                                            color="medium-emphasis"
                                            density="comfortable"
                                            :href="getAssetDownloadUrl( asset.id )"
                                            icon
                                            size="small"
                                            target="_blank"
                                            variant="text"
                                        >
                                            <v-icon
                                                icon="mdi-download"
                                                size="20"
                                            />
                                        </v-btn>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>
                    </div>

                    <div
                        v-else
                        class="text-body-2 text-medium-emphasis py-4 flex-grow-1"
                    >
                        No assets attached yet. Add one from the Asset Manager below.
                    </div>

                    <div class="mt-4">
                        <v-btn
                            block
                            color="on-surface"
                            :loading="attachingAsset"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            @click="openAssetPicker"
                        >
                            Add asset
                        </v-btn>
                    </div>
                </div>
            </div>
        </div>
    </PopupElement>

    <NewChatDialog
        v-model="newChatDialogOpen"
        :error="subtopicError"
        :existing-chats="detail?.chats ?? []"
        :loading="creatingChat"
        :subtopic-name="detail?.name ?? 'this subtopic'"
        @clear-error="subtopicError = null"
        @create="handleCreateChat"
    />

    <ConfirmDeleteDialog
        v-model="confirmDialogOpen"
        :confirm-label="confirmLabel"
        :error="subtopicError"
        :loading="removingItem"
        :message="confirmMessage"
        :title="confirmTitle"
        @clear-error="subtopicError = null"
        @confirm="confirmRemove"
    />
</template>

<style scoped lang="scss">
    .popup-columns {
        display: flex;
        flex-direction: column;
        gap: 0;

        @media (min-width: 960px) {
            flex-direction: row;
            gap: 24px;
        }
    }

    .popup-col {
        flex: 1 1 0;
        min-width: 0;
    }
</style>
