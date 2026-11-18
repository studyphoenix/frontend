<script setup lang="ts">
    import {
        onMounted,
        onUnmounted,
        ref
    } from 'vue';
    import {
        auth
    } from '@janishutz/oidc-login-sdk-browser';

    const showReauthPopup = ref( false );

    const reauth = () => {
        auth.loginInNewTab();
        showReauthPopup.value = false;
    };

    const reauthListenerHandler = () => {
        showReauthPopup.value = true;
    };

    const cancelReauth = () => {
        showReauthPopup.value = false;
        location.href = '/';
    };

    onMounted( () => {
        document.addEventListener( 'autherror', reauthListenerHandler );
    } );

    onUnmounted( () => {
        try {
            document.removeEventListener( 'autherror', reauthListenerHandler );
        } catch { /* empty */ }
    } );
</script>

<template>
    <v-dialog
        v-model="showReauthPopup"
        width="auto"
    >
        <v-card
            max-width="400"
            prepend-icon="mdi-logout"
            text="You have become unauthorized for some reason. Please click the button below to log in again"
            title="Logged out"
        >
            <template #actions>
                <v-btn
                    class=""
                    text="Cancel"
                    @click="cancelReauth"
                />
                <v-btn
                    class="text-weight-bold"
                    text="Login again"
                    @click="reauth"
                />
            </template>
        </v-card>
    </v-dialog>
</template>
