<script setup lang="ts">
    import type {
        ModelAsset,
        ModelSubject
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
    import ConfirmDeleteDialog from '@/components/custom-ui-elements/ConfirmDeleteDialog.vue';
    import PopupElement from '@/components/custom-ui-elements/PopupElement.vue';
    import {
        useSubjectAssets
    } from '@/composables/subject-assets';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'subject': ModelSubject | null;
    }>();
    const {
        subjectAssets,
        loading,
        error,
        fetchSubjectAssets,
        associateAssetToSubject,
        deassociateAssetFromSubject,
        removeSubjectAssetLocally
    } = useSubjectAssets();
    const attachingAsset = ref( false );
    const waitingForAssetSelection = ref( false );
    const pendingRemoval = ref<ModelAsset | null>( null );
    const removingAsset = ref( false );
    const confirmDialogOpen = computed( {
        'get': () => pendingRemoval.value !== null,
        'set': ( val: boolean ) => {
            if ( !val ) {
                pendingRemoval.value = null;
            }
        }
    } );
    const confirmMessage = computed( () => {
        return `Remove "${ pendingRemoval.value?.name ?? '' }" from "${ props.subject?.name ?? 'this subject' }"? The file will stay in your Asset Manager.`;
    } );

    watch( [
        isOpen,
        () => props.subject?.id
    ], async ( [
        open,
        subjectId
    ] ) => {
        if ( open && subjectId ) {
            pendingRemoval.value = null;
            waitingForAssetSelection.value = false;
            await fetchSubjectAssets( subjectId );
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
        const target = props.subject;

        if ( !target ) {
            return;
        }

        attachingAsset.value = true;

        try {
            await associateAssetToSubject( target.id, event.detail );
        } finally {
            attachingAsset.value = false;
        }
    };

    const handleAssetDeleted = ( event: CustomEvent<number> ) => {
        removeSubjectAssetLocally( event.detail, props.subject?.id );
    };

    onMounted( () => {
        document.addEventListener( 'studyphoenix:assets:select', handleAssetSelected );
        document.addEventListener( 'studyphoenix:assets:deleted', handleAssetDeleted );
    } );

    onBeforeUnmount( () => {
        document.removeEventListener( 'studyphoenix:assets:select', handleAssetSelected );
        document.removeEventListener( 'studyphoenix:assets:deleted', handleAssetDeleted );
    } );

    const openAssetPicker = () => {
        error.value = null;
        waitingForAssetSelection.value = true;
        const attachedIds = subjectAssets.value.map( asset => asset.id );

        openAssetManager( 'select', {
            'disabledIds': attachedIds
        } );
    };

    const askRemoveAsset = ( asset: ModelAsset ) => {
        error.value = null;
        pendingRemoval.value = asset;
    };

    const confirmRemove = async () => {
        const target = props.subject;
        const asset = pendingRemoval.value;

        if ( !target || !asset ) {
            return;
        }

        removingAsset.value = true;

        try {
            const removed = await deassociateAssetFromSubject( target.id, asset.id );

            if ( removed ) {
                pendingRemoval.value = null;
            }
        } finally {
            removingAsset.value = false;
        }
    };
</script>

<template>
    <PopupElement
        v-model="isOpen"
        max-width="580"
    >
        <div v-if="props.subject">
            <div class="pr-8">
                <h2 class="text-h5 font-weight-bold mb-1">
                    Subject Assets
                </h2>
                <p class="text-body-2 text-medium-emphasis mb-0">
                    Manage files associated with {{ props.subject.name }}.
                </p>
            </div>

            <v-divider class="my-4" />

            <v-alert
                v-if="error"
                class="mb-4"
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
                v-if="loading"
                class="d-flex align-center justify-center py-8"
            >
                <v-progress-circular indeterminate />
            </div>

            <v-list
                v-else-if="subjectAssets.length > 0"
                class="py-0 bg-transparent"
                density="comfortable"
            >
                <v-list-item
                    v-for="asset in subjectAssets"
                    :key="asset.id"
                    class="px-2 rounded"
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
                                aria-label="Remove asset from subject"
                                color="medium-emphasis"
                                density="comfortable"
                                icon
                                size="small"
                                title="Remove from subject"
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

            <div
                v-else
                class="text-body-2 text-medium-emphasis py-4"
            >
                No assets attached to this subject yet. Add one from the Asset Manager below.
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
    </PopupElement>

    <ConfirmDeleteDialog
        v-model="confirmDialogOpen"
        confirm-label="Remove"
        :error="error"
        :loading="removingAsset"
        :message="confirmMessage"
        title="Remove asset from subject?"
        @clear-error="error = null"
        @confirm="confirmRemove"
    />
</template>
