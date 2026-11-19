<script setup lang="ts">
    import SideBar from '@/components/SideBar.vue';
    import ChatView from '@/components/chat/ChatView.vue';
</script>

<template>
    <v-container class="fill-height d-flex flex-column justify-center">
        <SideBar/>
        <ChatView/>
    </v-container>
</template>
