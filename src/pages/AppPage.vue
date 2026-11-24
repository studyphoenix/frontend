<script setup lang="ts">
    import LogoutProvider from '@/components/authz/LogoutProvider.vue';
    import SideBar from '@/components/SideBar.vue';
    import {
        openAssetManager
    } from '@/composables/asset-manager';
    import {
        useAuthStore
    } from '@/stores/authstore';

    const store = useAuthStore();
</script>

<template>
    <v-container class="fill-height d-flex flex-column justify-center">
        <SideBar />
        <h1>Welcome back, {{ store.username ? store.username : 'Unknown User' }}</h1>
        <LogoutProvider />
        <v-btn style="margin-top: 20px;" @click="() => openAssetManager( 'default' )">
            Open Asset Manager
        </v-btn>
    </v-container>
</template>
