<script setup lang="ts">
    import {
        assetManagerMode,
        assetsList,
        deleteAsset,
        selectedAssetId,
        showAddAsset,
        showAssetManager
    } from '@/composables/asset-manager';
    import CreateAssetDialog from './CreateAssetDialog.vue';
    import PopupElement from '../custom-ui-elements/PopupElement.vue';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const openCreateAssetDialog = () => {
        showAddAsset.value = true;
    };

    const handleClick = ( assetId: number ) => {
        if ( assetManagerMode.value === 'select' ) {
            selectedAssetId.value = assetId;
        } else {
            const url = request.getBackendURL();

            url.pathname = '/assets/download/' + assetId;
            window.open( url );
        }
    };

    const select = () => {
        document.dispatchEvent( new CustomEvent( 'studyphoenix:assets:select', {
            'detail': selectedAssetId.value
        } ) );
    };
</script>

<template>
    <CreateAssetDialog v-model="showAddAsset" />
    <PopupElement v-model="showAssetManager" :show-close="true" :max-width="1500">
        <h1>Assets</h1>
        <div class="assets-list cursor-pointer">
            <div
                v-for="(asset, index) in assetsList"
                :key="index"
                :class="['bg-surface-variant', selectedAssetId === index ? 'selected' : undefined]"
                @click="() => handleClick( asset.id )"
            >
                <v-icon :icon="asset.icon" />
                <h3>{{ asset.name }}</h3>
                <div>
                    <p>{{ new Date( asset.updatedAt ).toLocaleString() }}</p>
                    <v-icon icon="mdi-delete" @click="( ev: MouseEvent ) => deleteAsset( ev, asset.id )" />
                </div>
            </div>
            <div class="bg-surface-variant cursor-pointer" @click="openCreateAssetDialog">
                <v-icon icon="mdi-plus" style="font-size: 175px;" />
            </div>
        </div>
        <v-btn v-if="assetManagerMode === 'select'" @click="select">
            Select
        </v-btn>
    </PopupElement>
</template>

<style lang="scss" scoped>
    @use "@/styles/components/asset-manager/main.scss";
</style>
