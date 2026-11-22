<script setup lang="ts">
    import {
        type Ref,
        ref,
        watch
    } from 'vue';
    import {
        assetManagerMode,
        assetsList,
        getIconForMediaType,
        loadAssets,
        selectedAssetId
    } from '@/composables/asset-manager';
    import type {
        ModelAsset
    } from '@/ts/types/api';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    interface UploadTypeMeta {
        'mediaType': string;
        'ext': string;
    }

    const SUPPORTED_UPLOAD_TYPES: Record<string, UploadTypeMeta> = {
        'application/pdf': {
            'mediaType': 'application/pdf',
            'ext': 'pdf'
        },
        'application/json': {
            'mediaType': 'application/json',
            'ext': 'json'
        },
        'image/png': {
            'mediaType': 'image/png',
            'ext': 'png'
        },
        'image/jpeg': {
            'mediaType': 'image/jpeg',
            'ext': 'jpg'
        },
        'image/jpg': {
            'mediaType': 'image/jpg',
            'ext': 'jpg'
        }
    };
    const EXT_TO_MEDIA_TYPE: Record<string, string> = {
        'pdf': 'application/pdf',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpg',
        'jpeg': 'image/jpeg'
    };
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );
    const files: Ref<File[] | File | undefined> = ref( [] );

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            files.value = [];
            dialogError.value = null;
        }
    } );

    const resolveSelectedFile = (): File | null => {
        if ( Array.isArray( files.value ) ) {
            return files.value[0] ?? null;
        }

        return files.value ?? null;
    };

    const resolveUploadMeta = ( file: File ): UploadTypeMeta | null => {
        const mimeType = file.type.trim().toLowerCase();

        if ( SUPPORTED_UPLOAD_TYPES[mimeType] ) {
            return SUPPORTED_UPLOAD_TYPES[mimeType];
        }

        const ext = file.name.split( '.' ).pop()
            ?.toLowerCase() ?? '';
        const mappedType = EXT_TO_MEDIA_TYPE[ext];

        if ( mappedType && SUPPORTED_UPLOAD_TYPES[mappedType] ) {
            return SUPPORTED_UPLOAD_TYPES[mappedType];
        }

        return null;
    };

    const handleSubmit = async () => {
        const cleanName = name.value.replace( /[^\x20-\x7E]/g, '' ).trim();
        const file = resolveSelectedFile();

        if ( cleanName.length < 3 ) {
            dialogError.value = 'Asset name must be at least 3 ASCII characters.';

            return;
        } else if ( !file ) {
            dialogError.value = 'Cannot create an asset without a file.';

            return;
        }

        const uploadMeta = resolveUploadMeta( file );

        if ( !uploadMeta ) {
            dialogError.value = 'Unsupported file type. Supported: PDF, PNG, JPG, JSON.';

            return;
        }

        dialogError.value = null;
        creating.value = true;

        try {
            if ( isBackendless ) {
                const mockAsset: ModelAsset = {
                    'id': Date.now(),
                    'name': cleanName.slice( 0, 100 ),
                    'icon': getIconForMediaType( uploadMeta.mediaType ),
                    'mediaType': uploadMeta.mediaType,
                    'updatedAt': new Date().toISOString()
                };

                assetsList.value = [
                    ...assetsList.value,
                    mockAsset
                ];

                if ( assetManagerMode.value === 'select' ) {
                    selectedAssetId.value = mockAsset.id;
                }

                isOpen.value = false;
                name.value = '';
                files.value = [];

                return;
            }

            const res = await request.put( '/assets/create', JSON.stringify( {
                'name': cleanName.slice( 0, 100 ),
                'icon': getIconForMediaType( uploadMeta.mediaType ),
                'mediaType': uploadMeta.mediaType
            } ) );

            if ( res.ok ) {
                const id = ( await res.json() ).id as number;
                const fd = new FormData();

                fd.append( 'file', file, `${ id }.${ uploadMeta.ext }` );

                const uploadRes = await request.sendFormData( `/assets/upload/${ id }`, fd );

                if ( uploadRes.ok ) {
                    isOpen.value = false;
                    name.value = '';
                    files.value = [];
                    await loadAssets();

                    if ( assetManagerMode.value === 'select' ) {
                        selectedAssetId.value = id;
                    }
                } else {
                    dialogError.value = 'File failed to upload.';
                }
            } else {
                dialogError.value = 'Failed to create asset.';
            }
        } catch ( err ) {
            dialogError.value = err instanceof Error ? err.message : 'Failed to create asset.';
        } finally {
            creating.value = false;
        }
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        max-width="650"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <h3 class="text-h6 font-weight-bold mb-2">
                Create Asset
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
                Create an asset and upload a file (PDF, PNG, JPG or JSON).
            </p>

            <v-alert
                v-if="dialogError"
                class="mb-4"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="dialogError = null"
            >
                {{ dialogError }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
            </v-alert>

            <v-text-field
                v-model="name"
                autofocus
                counter="100"
                density="compact"
                label="Asset name"
                maxlength="100"
                placeholder="e.g. Linear Algebra Script"
                variant="outlined"
                @keyup.enter="handleSubmit"
            />

            <v-file-upload
                v-model="files"
                accept=".pdf,.png,.jpg,.jpeg,.json"
                density="comfortable"
                inset-file-list
                :multiple="false"
                show-size
                variant="comfortable"
            />

            <div class="d-flex justify-end ga-2 mt-4">
                <v-btn
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
</template>
