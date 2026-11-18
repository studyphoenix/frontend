<script setup lang="ts">
    import {
        CHAT_MODES,
        getChatModeMeta
    } from '@/ts/util/chat-modes';
    import type {
        ModelAsset,
        ModelChat,
        ModelSubtopic
    } from '@/ts/types/api';
    import {
        computed,
        ref,
        watch
    } from 'vue';
    import PopupElement from '@/components/custom-ui-elements/PopupElement.vue';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';
    import {
        useRouter
    } from 'vue-router';
    import {
        useTechTreeStore
    } from '@/stores/techtree';

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
    }>();
    const router = useRouter();
    const store = useTechTreeStore();
    const uploadingAsset = ref( false );
    const isDragging = ref( false );
    const fileInput = ref<HTMLInputElement | null>( null );
    const newChatDialogOpen = ref( false );
    const selectedNewMode = ref<1 | 2 | 3>( 1 );
    const newChatTitle = ref( '' );
    const creatingChat = ref( false );
    const pendingRemoval = ref<PendingRemoval | null>( null );
    const removingItem = ref( false );
    const detail = computed( () => {
        if ( store.activeSubtopic && props.subtopic && store.activeSubtopic.id === props.subtopic.id ) {
            return store.activeSubtopic;
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

    const formatMediaBadge = ( mediaType: string ): string => {
        const sub = mediaType.split( '/' ).pop() ?? 'file';

        return sub.toUpperCase();
    };

    const getAssetDownloadUrl = ( assetId: number ): string => {
        if ( import.meta.env.VITE_BACKENDLESS === 'true' ) {
            return '#';
        }

        return new URL( `/assets/download/${ assetId }`, request.getBackendURL() ).toString();
    };

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
            await store.fetchSubtopicDetails( subtopicId );
        }
    } );

    const openNewChatDialog = () => {
        store.subtopicError = null;
        selectedNewMode.value = 1;
        newChatTitle.value = '';
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

    const handleCreateChat = async () => {
        const target = detail.value;

        if ( !target ) {
            return;
        }

        const cfg = getChatModeMeta( selectedNewMode.value );
        const title = newChatTitle.value.trim() || `${ target.name } - ${ cfg.label }`;

        creatingChat.value = true;
        const created = await store.createAndAttachChat( target.id, title, cfg.mode );

        creatingChat.value = false;

        if ( created ) {
            newChatTitle.value = '';
            navigateToChat( created );
        }
    };

    const handleOpenChat = ( chat: ModelChat ) => {
        navigateToChat( chat );
    };

    const askRemoveChat = ( chat: ModelChat ) => {
        store.subtopicError = null;
        pendingRemoval.value = {
            'kind': 'chat',
            'id': chat.id,
            'name': chat.name
        };
    };

    const askRemoveAsset = ( asset: ModelAsset ) => {
        store.subtopicError = null;
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

        if ( item.kind === 'chat' ) {
            await store.detachChat( target.id, item.id );
        } else {
            await store.detachAsset( target.id, item.id );
        }

        removingItem.value = false;

        if ( !store.subtopicError ) {
            pendingRemoval.value = null;
        }
    };

    const uploadFile = async ( file: File ) => {
        const target = detail.value;

        if ( !target ) {
            return;
        }

        uploadingAsset.value = true;
        await store.uploadAndAttachAsset( target.id, file );
        uploadingAsset.value = false;
    };

    const triggerFilePicker = () => {
        fileInput.value?.click();
    };

    const handleFileSelected = async ( event: Event ) => {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];

        if ( file ) {
            await uploadFile( file );
        }

        if ( input ) {
            input.value = '';
        }
    };

    const handleDrop = async ( event: DragEvent ) => {
        isDragging.value = false;
        const file = event.dataTransfer?.files?.[0];

        if ( file ) {
            await uploadFile( file );
        }
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
                v-if="store.subtopicError"
                class="mb-4"
                closable
                density="compact"
                type="error"
                variant="tonal"
                @click:close="store.subtopicError = null"
            >
                {{ store.subtopicError }}
            </v-alert>

            <div
                v-if="store.subtopicLoading"
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

                <div
                    class="popup-col d-flex flex-column assets-dropzone"
                    :class="{ 'is-dragging': isDragging }"
                    @dragleave.prevent="isDragging = false"
                    @dragover.prevent="isDragging = true"
                    @drop.prevent="handleDrop"
                >
                    <h3 class="text-subtitle-1 font-weight-medium mb-3">
                        Assets
                    </h3>

                    <v-list
                        v-if="( detail.assets ?? [] ).length > 0"
                        class="py-0 bg-transparent flex-grow-1"
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
                                        aria-label="Delete asset"
                                        color="medium-emphasis"
                                        density="comfortable"
                                        icon
                                        size="small"
                                        variant="text"
                                        @click="askRemoveAsset( asset )"
                                    >
                                        <v-icon
                                            icon="mdi-delete-outline"
                                            size="20"
                                        />
                                    </v-btn>
                                </div>
                            </template>
                        </v-list-item>
                    </v-list>

                    <div
                        v-else
                        class="text-body-2 text-medium-emphasis py-4 flex-grow-1"
                    >
                        No assets attached yet. Drop a file here or add one below.
                    </div>

                    <div class="mt-4">
                        <v-btn
                            block
                            color="on-surface"
                            :loading="uploadingAsset"
                            prepend-icon="mdi-plus"
                            variant="outlined"
                            @click="triggerFilePicker"
                        >
                            Add file
                        </v-btn>
                    </div>

                    <input
                        ref="fileInput"
                        accept=".pdf,.png,.jpg,.jpeg,.json"
                        class="d-none"
                        type="file"
                        @change="handleFileSelected"
                    >
                </div>
            </div>
        </div>
    </PopupElement>

    <v-dialog
        v-model="newChatDialogOpen"
        max-width="440"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <h3 class="text-h6 font-weight-bold mb-1">
                New Chat
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
                Choose a learning mode for {{ detail?.name ?? 'this subtopic' }}.
            </p>

            <v-list
                class="bg-transparent py-0 mb-4"
                density="comfortable"
                lines="two"
            >
                <v-list-item
                    v-for="cfg in CHAT_MODES"
                    :key="cfg.mode"
                    :active="selectedNewMode === cfg.mode"
                    class="mode-option rounded mb-2"
                    color="on-surface"
                    :prepend-icon="cfg.icon"
                    :subtitle="cfg.description"
                    :title="`${ cfg.label } Mode`"
                    @click="selectedNewMode = cfg.mode"
                />
            </v-list>

            <v-alert
                v-if="store.subtopicError"
                class="mb-4"
                closable
                density="compact"
                type="error"
                variant="tonal"
                @click:close="store.subtopicError = null"
            >
                {{ store.subtopicError }}
            </v-alert>

            <v-text-field
                v-model="newChatTitle"
                density="compact"
                hide-details
                label="Chat title (optional)"
                variant="outlined"
                @keyup.enter="handleCreateChat"
            />

            <div class="d-flex justify-end ga-2 mt-5">
                <v-btn
                    color="medium-emphasis"
                    variant="text"
                    @click="newChatDialogOpen = false"
                >
                    Cancel
                </v-btn>

                <v-btn
                    color="on-surface"
                    :loading="creatingChat"
                    variant="tonal"
                    @click="handleCreateChat"
                >
                    Start Chat
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>

    <v-dialog
        v-model="confirmDialogOpen"
        max-width="400"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <h3 class="text-h6 font-weight-bold mb-2">
                Remove {{ pendingRemoval?.kind === 'chat' ? 'chat' : 'asset' }}?
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-5">
                Are you sure you want to remove "{{ pendingRemoval?.name }}" from this subtopic?
            </p>

            <v-alert
                v-if="store.subtopicError"
                class="mb-4"
                closable
                density="compact"
                type="error"
                variant="tonal"
                @click:close="store.subtopicError = null"
            >
                {{ store.subtopicError }}
            </v-alert>

            <div class="d-flex justify-end ga-2">
                <v-btn
                    color="medium-emphasis"
                    variant="text"
                    @click="pendingRemoval = null"
                >
                    Cancel
                </v-btn>

                <v-btn
                    color="error"
                    :loading="removingItem"
                    variant="tonal"
                    @click="confirmRemove"
                >
                    Remove
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
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

    .assets-dropzone {
        border-radius: 6px;
        transition: background-color 0.15s ease;

        &.is-dragging {
            background-color: rgba(var(--v-theme-primary), 0.08);
            outline: 1px dashed rgba(var(--v-theme-primary), 0.6);
            outline-offset: 6px;
        }
    }

    .mode-option {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }
</style>
