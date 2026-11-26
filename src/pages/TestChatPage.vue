<script setup lang="ts">
    import ChatView from '@/components/chat/ChatView.vue';
    import SideBar from '@/components/SideBar.vue';
</script>

<template>
    <v-container class="fill-height d-flex flex-column justify-center">
        <SideBar />
        <ChatView :id="1" />
    </v-container>
</template>
