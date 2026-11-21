<script setup lang="ts">
    import {
        VuePDF,
        usePDF
    } from '@tato30/vue-pdf';
    import {
        ref,
        watch
    } from 'vue';
    import type {
        ModelAsset
    } from '@/ts/types/api';
    import {
        request
    } from '@janishutz/oidc-login-sdk-browser';

    const pdfSrc = ref( new ArrayBuffer() );
    const {
        pdf
    } = usePDF( pdfSrc );
    const props = defineProps<{
        'asset': ModelAsset
    }>();

    const loadPDF = async () => {
        if ( props.asset.mediaType === 'application/pdf' ) {
            pdfSrc.value = await ( await request.get( `/assets/download/${ props.asset.id }` ) ).arrayBuffer();
        } else {
            alert( 'tried loading a non-pdf file with the PDF viewer' );
        }
    };

    watch( props, loadPDF );
</script>

<template>
    <div>
        <!-- The used PDF viewer is this: https://tato30.github.io/vue-pdf/ -->
        <VuePDF fit-parent :pdf="pdf" />
    </div>
</template>
