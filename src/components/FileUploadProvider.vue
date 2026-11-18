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

    watch( files, () => {
        request.sendFormData( `/assets/upload/${ props.assetId }`, new FormData() );
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
