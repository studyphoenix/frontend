<script setup lang="ts">
    import {
        type Ref,
        ref,
        watch
    } from 'vue';
    import {
        getIconForMediaType,
        loadAssets
    } from '@/composables/asset-manager';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );
    const files: Ref<File[]> = ref( [] );

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            files.value = [];
            dialogError.value = null;
        }
    } );

    const handleSubmit = async () => {
        if ( name.value.length < 3 ) {
            dialogError.value = 'Subject name must be at least 3 ASCII characters.';

            return;
        } else if ( files.value.length < 1 ) {
            dialogError.value = 'Cannot create an asset without a file.';

            return;
        }

        dialogError.value = null;
        creating.value = true;

        try {
            const res = await request.put( '/assets/create', JSON.stringify( {
                'name': name.value,
                'icon': getIconForMediaType( files.value[0].type ),
                'mediaType': files.value[0].type
            } ) );

            if ( res.ok ) {
                const id = ( await res.json() ).id;
                const fd = new FormData();

                fd.append( 'file', files.value[0] );

                const uploadRes = await request.sendFormData( `/assets/upload/${ id }`, fd );

                if ( uploadRes.ok ) {
                    isOpen.value = false;
                    name.value = '';
                    files.value = [];
                    loadAssets();
                } else {
                    dialogError.value = 'File failed to upload.';
                }
            } else {
                dialogError.value = 'Failed to create subject.';
            }
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
                Create an asset to upload a file to it.
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
                density="comfortable"
                variant="comfortable"
                inset-file-list
                show-size
                :multiple="false"
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
