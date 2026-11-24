<template>
    <v-app>
        <v-main>
            <router-view />
        </v-main>
        <AssetManager />
    </v-app>
</template>

<script lang="ts" setup>
    import AssetManager from '@/components/assets/AssetManager.vue';
</script>
