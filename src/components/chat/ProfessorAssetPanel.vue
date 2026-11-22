<script setup lang="ts">
    import {
        computed,
        onBeforeUnmount,
        ref,
        watch
    } from 'vue';
    import type {
        ModelAsset
    } from '@/ts/types/api';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const props = defineProps<{
        'assets': ModelAsset[];
    }>();
    const selectedAssetId = ref<number | null>( null );
    const previewUrl = ref<string | null>( null );
    const loadingPreview = ref( false );
    const previewError = ref( false );

    watch( () => props.assets, list => {
        if ( list.length === 0 ) {
            selectedAssetId.value = null;
        } else if ( !list.some( a => a.id === selectedAssetId.value ) ) {
            selectedAssetId.value = list[0].id;
        }
    }, {
        'immediate': true
    } );

    const selectedAsset = computed( () => {
        return props.assets.find( a => a.id === selectedAssetId.value ) ?? null;
    } );

    const getAssetDownloadUrl = ( assetId: number ): string => {
        if ( isBackendless ) {
            return '#';
        }

        const url = request.getBackendURL();

        url.pathname = `/assets/download/${ assetId }`;

        return url.toString();
    };

    const isPdf = ( mediaType: string ): boolean => mediaType.toLowerCase() === 'application/pdf';
    const isImage = ( mediaType: string ): boolean => mediaType.toLowerCase().startsWith( 'image/' );

    const revokePreviewUrl = () => {
        if ( previewUrl.value ) {
            URL.revokeObjectURL( previewUrl.value );
            previewUrl.value = null;
        }
    };

    let loadSeq = 0;

    watch( selectedAsset, async asset => {
        const seq = ++loadSeq;

        revokePreviewUrl();
        previewError.value = false;

        if ( !asset || isBackendless || ( !isPdf( asset.mediaType ) && !isImage( asset.mediaType ) ) ) {
            loadingPreview.value = false;

            return;
        }

        loadingPreview.value = true;

        try {
            const res = await request.get( `/assets/download/${ asset.id }` );

            if ( seq !== loadSeq ) {
                return;
            }

            if ( !res.ok ) {
                previewError.value = true;

                return;
            }

            const blob = await res.blob();

            if ( seq !== loadSeq ) {
                return;
            }

            previewUrl.value = URL.createObjectURL( blob );
        } catch {
            if ( seq === loadSeq ) {
                previewError.value = true;
            }
        } finally {
            if ( seq === loadSeq ) {
                loadingPreview.value = false;
            }
        }
    }, {
        'immediate': true
    } );

    onBeforeUnmount( () => {
        loadSeq++;
        revokePreviewUrl();
    } );
</script>

<template>
    <div class="asset-panel d-flex flex-column h-100 pa-3">
        <div
            v-if="props.assets.length === 0"
            class="d-flex flex-column align-center justify-center flex-grow-1 text-center pa-6 text-medium-emphasis"
        >
            <v-icon
                class="mb-3"
                icon="mdi-file-document-outline"
                size="40"
            />
            <p class="text-body-2 mb-0">
                No study materials attached to this subtopic yet. You can attach files from the Tech Tree node popup.
            </p>
        </div>

        <template v-else>
            <div class="d-flex align-center justify-space-between ga-2 mb-3 flex-wrap">
                <div class="d-flex align-center ga-1 flex-wrap">
                    <v-chip
                        v-for="asset in props.assets"
                        :key="asset.id"
                        :color="asset.id === selectedAsset?.id ? 'primary' : undefined"
                        :prepend-icon="asset.icon || 'mdi-file-document-outline'"
                        size="small"
                        :variant="asset.id === selectedAsset?.id ? 'tonal' : 'outlined'"
                        @click="selectedAssetId = asset.id"
                    >
                        {{ asset.name }}
                    </v-chip>
                </div>

                <v-btn
                    v-if="selectedAsset && !isBackendless"
                    color="on-surface"
                    density="compact"
                    :href="getAssetDownloadUrl( selectedAsset.id )"
                    prepend-icon="mdi-open-in-new"
                    target="_blank"
                    variant="text"
                >
                    Open
                </v-btn>
            </div>

            <v-sheet
                v-if="selectedAsset"
                class="preview-frame flex-grow-1 d-flex flex-column overflow-hidden rounded-lg"
            >
                <div
                    v-if="isBackendless"
                    class="d-flex flex-column align-center justify-center flex-grow-1 text-center pa-6 text-medium-emphasis"
                >
                    <v-icon
                        class="mb-3"
                        :icon="selectedAsset.icon || 'mdi-file-document-outline'"
                        size="48"
                    />
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                        {{ selectedAsset.name }}
                    </div>
                    <p class="text-caption mb-0">
                        Preview available when connected to the backend server.
                    </p>
                </div>

                <div
                    v-else-if="loadingPreview"
                    class="d-flex align-center justify-center flex-grow-1"
                >
                    <v-progress-circular indeterminate />
                </div>

                <iframe
                    v-else-if="isPdf( selectedAsset.mediaType ) && previewUrl"
                    class="asset-iframe flex-grow-1"
                    :src="previewUrl"
                    :title="selectedAsset.name"
                ></iframe>

                <div
                    v-else-if="isImage( selectedAsset.mediaType ) && previewUrl"
                    class="d-flex align-center justify-center flex-grow-1 overflow-auto pa-3"
                >
                    <img
                        :alt="selectedAsset.name"
                        class="asset-image"
                        :src="previewUrl"
                    >
                </div>

                <div
                    v-else
                    class="d-flex flex-column align-center justify-center flex-grow-1 text-center pa-6 text-medium-emphasis"
                >
                    <v-icon
                        class="mb-3"
                        :icon="selectedAsset.icon || 'mdi-file-code'"
                        size="48"
                    />
                    <div class="text-subtitle-1 font-weight-medium mb-2">
                        {{ selectedAsset.name }}
                    </div>
                    <p
                        v-if="previewError"
                        class="text-caption mb-3"
                    >
                        Could not render inline preview. Use the button below to open or download it.
                    </p>
                    <v-btn
                        color="on-surface"
                        :href="getAssetDownloadUrl( selectedAsset.id )"
                        prepend-icon="mdi-download"
                        target="_blank"
                        variant="tonal"
                    >
                        Download file
                    </v-btn>
                </div>
            </v-sheet>
        </template>
    </div>
</template>

<style scoped lang="scss">
    .asset-panel {
        min-height: 0;
    }

    .preview-frame {
        min-height: 0;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    .asset-iframe {
        width: 100%;
        height: 100%;
        border: 0;
    }

    .asset-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
</style>
