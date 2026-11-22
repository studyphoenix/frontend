<script setup lang="ts">
    import {
        assetDeleteError,
        assetManagerMode,
        assetsList,
        assetsLoadError,
        deleteAsset,
        disabledAssetIds,
        doDeleteAsset,
        getAssetDownloadUrl,
        isDeletingAsset,
        selectedAssetId,
        showAddAsset,
        showAssetManager,
        showDeleteAssetConfirmation
    } from '@/composables/asset-manager';
    import ConfirmDeleteDialog from '../custom-ui-elements/ConfirmDeleteDialog.vue';
    import CreateAssetDialog from './CreateAssetDialog.vue';
    import PopupElement from '../custom-ui-elements/PopupElement.vue';

    const openCreateAssetDialog = () => {
        showAddAsset.value = true;
    };

    const isAssetDisabled = ( assetId: number ): boolean => {
        return assetManagerMode.value === 'select' && disabledAssetIds.value.includes( assetId );
    };

    const handleClick = ( assetId: number ) => {
        if ( assetManagerMode.value === 'select' ) {
            if ( !isAssetDisabled( assetId ) ) {
                selectedAssetId.value = assetId;
            }
        } else if ( import.meta.env.VITE_BACKENDLESS !== 'true' ) {
            window.open( getAssetDownloadUrl( assetId ) );
        }
    };

    const select = () => {
        if ( selectedAssetId.value < 0 || isAssetDisabled( selectedAssetId.value ) ) {
            return;
        }

        showAssetManager.value = false;
        document.dispatchEvent( new CustomEvent( 'studyphoenix:assets:select', {
            'detail': selectedAssetId.value
        } ) );
        selectedAssetId.value = -1;
    };

    const handleDoubleClick = ( assetId: number ) => {
        if ( assetManagerMode.value === 'select' && !isAssetDisabled( assetId ) ) {
            selectedAssetId.value = assetId;
            select();
        }
    };
</script>

<template>
    <CreateAssetDialog v-model="showAddAsset" />
    <ConfirmDeleteDialog
        v-model="showDeleteAssetConfirmation"
        title="Delete asset permanently"
        message="Do you really want to permanently delete this asset? It will be removed from all subjects and subtopics."
        :error="assetDeleteError || null"
        :loading="isDeletingAsset"
        @clear-error="assetDeleteError = ''"
        @confirm="doDeleteAsset"
    />
    <PopupElement
        v-model="showAssetManager"
        :max-width="1500"
        :show-close="true"
    >
        <h1 class="mb-4">
            {{ assetManagerMode === 'select' ? 'Select Asset' : 'Assets' }}
        </h1>

        <v-alert
            v-if="assetsLoadError"
            class="mb-4"
            closable
            density="compact"
            :icon="false"
            type="error"
            variant="tonal"
            @click:close="assetsLoadError = null"
        >
            {{ assetsLoadError }}

            <template #close="{ props: closeProps }">
                <v-btn
                    v-bind="closeProps"
                    color="error"
                />
            </template>
        </v-alert>

        <div class="assets-list">
            <div
                v-for="asset in assetsList"
                :key="asset.id"
                class="bg-surface-variant asset-card"
                :class="{
                    'selected': selectedAssetId === asset.id,
                    'disabled': isAssetDisabled( asset.id )
                }"
                @click="() => handleClick( asset.id )"
                @dblclick="() => handleDoubleClick( asset.id )"
            >
                <v-icon :icon="asset.icon" />
                <h3 :title="asset.name">
                    {{ asset.name }}
                </h3>
                <div>
                    <p>{{ isAssetDisabled( asset.id ) ? 'Already attached' : new Date( asset.updatedAt ).toLocaleString() }}</p>
                    <v-icon
                        icon="mdi-delete"
                        title="Delete asset permanently"
                        @click="( ev: MouseEvent ) => deleteAsset( ev, asset.id )"
                    />
                </div>
            </div>
            <div
                class="bg-surface-variant asset-card"
                title="Upload new asset"
                @click="openCreateAssetDialog"
            >
                <v-icon icon="mdi-plus" style="font-size: 175px;" />
            </div>
        </div>

        <div
            v-if="assetManagerMode === 'select'"
            class="d-flex justify-end ga-2 mt-4"
        >
            <v-btn
                color="medium-emphasis"
                variant="text"
                @click="showAssetManager = false"
            >
                Cancel
            </v-btn>
            <v-btn
                color="on-surface"
                :disabled="selectedAssetId < 0"
                variant="tonal"
                @click="select"
            >
                Select
            </v-btn>
        </div>
    </PopupElement>
</template>

<style lang="scss" scoped>
    @use "@/styles/components/asset-manager/main.scss";
</style>
