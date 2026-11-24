<script setup lang="ts">
    import {
        onMounted,
        onUnmounted,
        ref,
        watch
    } from 'vue';
    import AssetManager from '@/components/assets/AssetManager.vue';
    import {
        assetsList,
        openAssetManager,
        showAssetManager
    } from '@/composables/asset-manager';
    import {
        useStateStore
    } from '@/stores/statestore';
    import {
        associateAssetsToSubject
    } from '@/ts/util/subjects';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );
    const selectedAssetIds = ref<number[]>( [] );
    const pendingSubjectId = ref<number | null>( null );
    const stateStore = useStateStore();

    const handleAssetSelected = ( event: Event ) => {
        if ( !( event instanceof CustomEvent ) || typeof event.detail !== 'number' ) {
            return;
        }

        const assetId = event.detail;

        if ( !isOpen.value || assetId < 0 ) {
            return;
        }

        if ( !selectedAssetIds.value.includes( assetId ) ) {
            selectedAssetIds.value.push( assetId );
        }

        showAssetManager.value = false;
    };

    const selectAssets = () => {
        openAssetManager( 'select' );
    };

    const getAssetName = ( assetId: number ) => {
        return assetsList.value.find( asset => asset.id === assetId )?.name ?? `Asset ${ assetId }`;
    };

    const removeAsset = ( assetId: number ) => {
        selectedAssetIds.value = selectedAssetIds.value.filter( id => id !== assetId );
    };

    onMounted( () => {
        document.addEventListener( 'studyphoenix:assets:select', handleAssetSelected );
    } );

    onUnmounted( () => {
        document.removeEventListener( 'studyphoenix:assets:select', handleAssetSelected );
    } );

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            dialogError.value = null;
            stateStore.subjectsError = null;
            selectedAssetIds.value = [];
            pendingSubjectId.value = null;
        }
    } );

    const handleSubmit = async () => {
        const cleanName = name.value.trim();

        if ( cleanName.length < 3 || cleanName.length > 100 ) {
            dialogError.value = 'Subject name must be between 3 and 100 characters.';

            return;
        }

        if ( !( /^[a-zA-Z0-9 _+.,/()-]+$/ ).test( cleanName ) ) {
            dialogError.value = 'Subject names may use letters, numbers, spaces, and _+.,/()- characters.';

            return;
        }

        creating.value = true;
        dialogError.value = null;

        try {
            let subjectId = pendingSubjectId.value;

            if ( subjectId === null ) {
                const created = await stateStore.createSubject( cleanName );

                if ( !created ) {
                    dialogError.value = stateStore.subjectsError ?? 'Failed to create subject.';

                    return;
                }

                subjectId = created.id;
                pendingSubjectId.value = subjectId;
            }

            if ( selectedAssetIds.value.length > 0 ) {
                await associateAssetsToSubject( subjectId, selectedAssetIds.value );
            }

            isOpen.value = false;
            name.value = '';
            selectedAssetIds.value = [];
            pendingSubjectId.value = null;
        } catch ( error ) {
            dialogError.value = error instanceof Error ? error.message : 'Failed to associate assets with subject.';
        } finally {
            creating.value = false;
        }
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        class="create-subject-dialog"
        max-width="420"
        :persistent="pendingSubjectId !== null"
    >
        <v-sheet
            class="create-subject-dialog__sheet"
            rounded="lg"
        >
            <h2 class="create-subject-dialog__title">
                Add new subject
            </h2>
            <p class="create-subject-dialog__help">
                Add a subject to start building its tech tree.
            </p>

            <v-alert
                v-if="dialogError"
                class="create-subject-dialog__alert"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="dialogError = null"
            >
                {{ dialogError }}
            </v-alert>

            <v-text-field
                v-model="name"
                autofocus
                counter="100"
                :disabled="pendingSubjectId !== null"
                density="compact"
                label="Subject name"
                maxlength="100"
                placeholder="e.g. Linear Algebra"
                variant="outlined"
                @keyup.enter="handleSubmit"
            />

            <v-btn
                class="mb-3"
                :disabled="pendingSubjectId !== null"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                @click="selectAssets"
            >
                Select existing assets
            </v-btn>
            <div v-if="selectedAssetIds.length" class="d-flex flex-wrap ga-2 mb-3">
                <v-chip
                    v-for="assetId in selectedAssetIds"
                    :key="assetId"
                    :closable="pendingSubjectId === null"
                    @click:close="removeAsset( assetId )"
                >
                    {{ getAssetName( assetId ) }}
                </v-chip>
            </div>
            <p v-if="pendingSubjectId !== null" class="text-body-2">
                The subject was created. Retry to finish associating its selected assets.
            </p>

            <div class="create-subject-dialog__actions">
                <v-btn
                    :disabled="pendingSubjectId !== null"
                    color="medium-emphasis"
                    variant="text"
                    @click="isOpen = false"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="on-surface"
                    :loading="creating"
                    variant="tonal"
                    @click="handleSubmit"
                >
                    Create
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
    <AssetManager />
</template>

<style lang="scss">
@use '@/styles/create-subject-dialog.scss';
</style>
