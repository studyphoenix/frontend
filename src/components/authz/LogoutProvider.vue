<script setup lang="ts">
    import * as sdk from '@janishutz/oidc-login-sdk-browser';
    import {
        ref
    } from 'vue';
    import {
        useAuthStore
    } from '@/stores/authstore';

    const dialog = ref( false );

    const logout = () => {
        const store = useAuthStore();

        store.isAuth = false;

        sdk.auth.logout();
        dialog.value = false;
    };
</script>

<template>
    <v-btn @click="dialog = true">
        Log Out
    </v-btn>
    <v-dialog
        v-model="dialog"
        width="auto"
    >
        <v-card
            max-width="400"
            prepend-icon="mdi-logout"
            text="You are about to be logged out"
            title="Logout"
        >
            <template #actions>
                <v-btn
                    class=""
                    text="Cancel"
                    @click="dialog = false"
                />
                <v-btn
                    class="text-weight-bold"
                    text="Log Out"
                    @click="logout"
                />
            </template>
        </v-card>
    </v-dialog>
</template>
