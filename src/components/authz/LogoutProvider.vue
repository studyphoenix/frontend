<script setup lang="ts">
    import * as sdk from '@janishutz/oidc-login-sdk-browser';
    import {
        useAuthStore
    } from '@/stores/authstore';

    const logout = () => {
        const store = useAuthStore();

        store.isAuth = false;

        sdk.auth.logout();
    };
</script>

<template>
    <v-btn @click="logout">
        Log Out
    </v-btn>
</template>
