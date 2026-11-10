<script setup lang="ts">
    import * as sdk from '@janishutz/oidc-login-sdk-browser';
    import {
        onMounted,
        ref
    } from 'vue';
    import type {
        ControllerUserProfileResponse
    } from '@/ts/types/api';
    import router from '@/router';
    import {
        useAuthStore
    } from '@/stores/authstore';

    const store = useAuthStore();
    const isLoggingIn = ref( true );

    const check = async ( force?: boolean ) => {
        isLoggingIn.value = true;

        try {
            store.isAuth = await sdk.auth.check( force ? 'force=true' : undefined );

            if ( store.isAuth )
                isAuthorizedHandler();
        } catch ( e ) {
            if ( e instanceof sdk.request.AuthError ) {
                throw e;
            } else if ( ( e as Error ).message === 'ERR_402' ) {
                console.log( 'Error' );
            }
        }

        isLoggingIn.value = false;
    };

    const isAuthorizedHandler = async () => {
        const profile: ControllerUserProfileResponse = await ( await sdk.request.get( '/user/profile' ) ).json();

        store.username = profile.username;
        store.email = profile.email;

        router.push( '/app' );
    };

    const login = () => {
        if ( isLoggingIn.value ) return;

        isLoggingIn.value = true;
        sdk.auth.login();
        isLoggingIn.value = false;
    };

    onMounted( check );
</script>

<template>
    <v-btn @click="login">
        Log In
    </v-btn>
</template>
