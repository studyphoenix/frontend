<script setup lang="ts">
    import LogoutProvider from '@/components/authz/LogoutProvider.vue';
    import SideBar from '@/components/SideBar.vue';
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
    </v-container>
</template>
