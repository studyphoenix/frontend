<script setup lang="ts">
    import {
        assetsList,
        deleteAsset,
        selectedIdx as selectedAssetId,
        showAddAsset,
        showAssetManager
    } from '@/composables/asset-manager';
    import CreateAssetDialog from './CreateAssetDialog.vue';
    import PopupElement from '../custom-ui-elements/PopupElement.vue';

    const openCreateAssetDialog = () => {
        showAddAsset.value = true;
    };

    const handleClick = ( assetId: number ) => {
        selectedAssetId.value = assetId;
    };
</script>

<template>
    <CreateAssetDialog v-model="showAddAsset" />
    <PopupElement v-model="showAssetManager" :show-close="true" :max-width="1500">
        <h1>Assets</h1>
        <div class="assets-list">
            <div
                v-for="(asset, index) in assetsList"
                :key="index"
                class="bg-surface-variant"
                @click="() => handleClick( asset.id )"
            >
                <v-icon :icon="asset.icon" />
                <h3>{{ asset.name }}</h3>
                <div>
                    <p>{{ new Date( asset.updatedAt ).toLocaleString() }}</p>
                    <v-icon icon="mdi-delete" @click="() => deleteAsset( asset.id )" />
                </div>
            </div>
            <div class="bg-surface-variant cursor-pointer" @click="openCreateAssetDialog">
                <v-icon icon="mdi-plus" />
            </div>
        </div>
    </PopupElement>
</template>

<style lang="scss" scoped>
    @use "@/styles/components/asset-manager/main.scss";
</style>
