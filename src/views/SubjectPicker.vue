<script setup lang="ts">
    import {
        associateAssetsToSubject,
        createAsset,
        createSubject as createSubjectRequest,
        getSubjects,
        uploadAsset
    } from '@/ts/util/subjects';
    import {
        onMounted,
        ref
    } from 'vue';
    import AssetManagerNavigationElement from '@/views/AssetManagerNavigationElement.vue';
    import type {
        ModelSubject
    } from '@/ts/types/api';
    import {
        useRouter
    } from 'vue-router';
    import {
        useStateStore
    } from '@/stores/statestore';

    const router = useRouter();
    const stateStore = useStateStore();
    const subjects = ref<ModelSubject[]>( [] );
    const isLoading = ref( true );
    const errorMessage = ref( '' );
    const isCreateDialogOpen = ref( false );
    const isCreatingSubject = ref( false );
    const subjectName = ref( '' );
    const selectedFiles = ref<File[]>( [] );
    const createError = ref( '' );
    const pendingSubjectId = ref<number | null>( null );
    const pendingAssetIds = ref<Array<number | null>>( [] );
    const uploadedAssetIds = ref<number[]>( [] );
    const assetsAssociated = ref( false );

    const getDocumentRequest = ( file: File ) => {
        const extension = file.name.slice( file.name.lastIndexOf( '.' ) );
        const mediaTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.json': 'application/json',
            '.jpg': 'image/jpeg',
            '.png': 'image/png'
        };
        const mediaType = mediaTypes[ extension ];

        if ( !mediaType || extension !== extension.toLowerCase() ) {
            throw new Error( `"${ file.name }" is not supported. Choose a PDF, JSON, JPG, or PNG file with a lowercase extension.` );
        }

        if ( file.name.length < 3 || file.name.length > 100 ) {
            throw new Error( `"${ file.name }" must have a filename between 3 and 100 characters.` );
        }

        if ( !( /^[\x20-\x7E]+$/ ).test( file.name ) ) {
            throw new Error( `"${ file.name }" must use printable ASCII characters.` );
        }

        return {
            'icon': 'fa-file',
            'mediaType': mediaType,
            'name': file.name
        };
    };

    const toSubject = ( subject: ModelSubject ) => {
        stateStore.selectedSubject = subject.id;

        return router.push( {
            'name': 'subject-tree'
        } );
    };

    const handleFilesSelected = ( event: Event ) => {
        if ( !( event.target instanceof HTMLInputElement ) ) {
            return;
        }

        selectedFiles.value = Array.from( event.target.files ?? [] );
        createError.value = '';
    };

    const openCreateDialog = () => {
        createError.value = '';
        isCreateDialogOpen.value = true;
    };

    const resetCreateDialog = () => {
        subjectName.value = '';
        selectedFiles.value = [];
        pendingSubjectId.value = null;
        pendingAssetIds.value = [];
        uploadedAssetIds.value = [];
        assetsAssociated.value = false;
        createError.value = '';
    };

    const submitNewSubject = async () => {
        if ( isCreatingSubject.value ) {
            return;
        }

        const name = subjectName.value.trim();

        if ( pendingSubjectId.value === null ) {
            if ( name.length < 3 || name.length > 100 ) {
                createError.value = 'Subject names must be between 3 and 100 characters.';

                return;
            }

            if ( !( /^[\x20-\x7E]+$/ ).test( name ) ) {
                createError.value = 'Subject names must use printable ASCII characters.';

                return;
            }

            try {
                selectedFiles.value.forEach( file => getDocumentRequest( file ) );
            } catch ( error ) {
                createError.value = error instanceof Error ? error.message : 'One or more documents are not supported.';

                return;
            }
        }

        isCreatingSubject.value = true;
        createError.value = '';
        let currentStep = 'Creating subject';

        try {
            if ( pendingSubjectId.value === null ) {
                pendingSubjectId.value = await createSubjectRequest( {
                    'icon': 'fa-folder',
                    name
                } );
                pendingAssetIds.value = selectedFiles.value.map( () => null );
            }

            for ( const [
                index,
                file
            ] of selectedFiles.value.entries() ) {
                let assetId = pendingAssetIds.value[ index ];

                if ( assetId === null || assetId === undefined ) {
                    currentStep = `Creating asset for "${ file.name }"`;
                    assetId = await createAsset( getDocumentRequest( file ) );
                    pendingAssetIds.value[ index ] = assetId;
                }

                if ( !uploadedAssetIds.value.includes( assetId ) ) {
                    currentStep = `Uploading "${ file.name }"`;
                    await uploadAsset( assetId, file );
                    uploadedAssetIds.value.push( assetId );
                }
            }

            if ( uploadedAssetIds.value.length > 0 && !assetsAssociated.value ) {
                currentStep = 'Associating uploaded documents with the subject';
                await associateAssetsToSubject( pendingSubjectId.value, uploadedAssetIds.value );
                assetsAssociated.value = true;
            }

            currentStep = 'Refreshing the subject list';
            subjects.value = await getSubjects();
            errorMessage.value = '';
            isCreateDialogOpen.value = false;
            resetCreateDialog();
        } catch ( error ) {
            const errorDetail = error instanceof Error ? error.message : 'Unexpected error.';

            createError.value = `${ currentStep }: ${ errorDetail }`;

            if ( pendingSubjectId.value !== null ) {
                try {
                    subjects.value = await getSubjects();
                } catch ( refreshError ) {
                    const refreshMessage = refreshError instanceof Error ? refreshError.message : 'Unable to refresh subjects.';

                    createError.value = `${ createError.value } ${ refreshMessage }`;
                }
            }
        } finally {
            isCreatingSubject.value = false;
        }
    };

    onMounted( async () => {
        try {
            subjects.value = await getSubjects();
        } catch ( error ) {
            errorMessage.value = error instanceof Error ? error.message : 'Unable to load subjects.';
        } finally {
            isLoading.value = false;
        }
    } );
</script>

<template>
    <main class="subject-picker">
        <h1>Subjects</h1>

        <p v-if="isLoading" role="status">
            Loading subjects...
        </p>
        <p v-if="errorMessage" role="alert">
            {{ errorMessage }}
        </p>
        <p v-else-if="!isLoading && subjects.length === 0">
            No subjects found. Add one to get started.
        </p>

        <div v-if="!isLoading" class="subject-picker__grid">
            <AssetManagerNavigationElement
                v-for="subject in subjects"
                :key="subject.id"
                :subject="subject"
                @select="toSubject"
            />
            <button
                aria-label="Add new subject"
                class="subject-folder subject-folder--add"
                type="button"
                @click="openCreateDialog"
            >
                <i class="subject-folder__icon mdi mdi-plus" aria-hidden="true"></i>
                <!-- <span class="subject-folder__name">Add subject</span> -->
            </button>
        </div>

        <v-dialog
            v-model="isCreateDialogOpen"
            max-width="560"
            :persistent="isCreatingSubject"
        >
            <v-card>
                <v-card-title>Add new subject</v-card-title>
                <v-card-text>
                    <form @submit.prevent="submitNewSubject">
                        <v-text-field
                            v-model="subjectName"
                            :disabled="isCreatingSubject || pendingSubjectId !== null"
                            label="Subject name"
                            maxlength="100"
                            minlength="3"
                            required
                        />

                        <label class="subject-picker__upload-label" for="subject-documents">Upload documents</label>
                        <input
                            id="subject-documents"
                            accept=".pdf,.json,.jpg,.png"
                            :disabled="isCreatingSubject || pendingSubjectId !== null"
                            multiple
                            type="file"
                            @change="handleFilesSelected"
                        >
                        <ul v-if="selectedFiles.length > 0" class="subject-picker__file-list">
                            <li v-for="file in selectedFiles" :key="`${ file.name }-${ file.size }`">
                                {{ file.name }}
                            </li>
                        </ul>

                        <p v-if="pendingSubjectId !== null" class="subject-picker__hint">
                            The subject has been created. Retry to finish the remaining step without creating a duplicate.
                        </p>
                        <p v-if="createError" class="subject-picker__error" role="alert">
                            {{ createError }}
                        </p>

                        <div class="subject-picker__dialog-actions">
                            <v-btn
                                :disabled="isCreatingSubject"
                                :text="pendingSubjectId === null ? 'Cancel' : 'Close'"
                                variant="text"
                                @click="isCreateDialogOpen = false"
                            />
                            <v-btn
                                color="primary"
                                :loading="isCreatingSubject"
                                type="submit"
                            >
                                {{ pendingSubjectId === null ? 'Create subject' : 'Retry' }}
                            </v-btn>
                        </div>
                    </form>
                </v-card-text>
            </v-card>
        </v-dialog>
    </main>
</template>

<style lang="scss">
@use '@/styles/subject-picker.scss';
</style>
