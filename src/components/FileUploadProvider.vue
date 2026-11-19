<script setup lang="ts">
    import {
        type Ref, ref,
        watch
    } from 'vue';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const files: Ref<File[]> = ref( [] );
    const props = defineProps<{
        'assetId': number
    }>();

    watch( files, async () => {
        try {
            await request.sendFormData( `/assets/upload/${ props.assetId }`, new FormData() );
        } catch ( error ) {
            console.error( error );
            alert( 'File upload failed. Please try again' );
        }
    } );
</script>

<template>
    <v-file-upload
        v-model="files"
        density="comfortable"
        variant="comfortable"
        inset-file-list
        show-size
    />
</template>
