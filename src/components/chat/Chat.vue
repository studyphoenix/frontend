<script setup lang="ts">
    import {
        type Ref,
        ref
    } from 'vue';
    import type {
        ChatMessagePair
    } from '@/ts/types';
    import ChatRenderer from '@/components/chat/Renderer.vue';

    const msgs: Ref<ChatMessagePair> = ref(
        {
            'question': 'Give me a summary of this one topic por favor',
            'response': `Sure! here is a summary of ...
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
            'child': {
                'question': 'What does ... mean?',
                'response': '...'
            }
        }
    );

</script>

<template>
    <div
        class="chat-positioner"
        :class="{ 'sidepanel-open': activeSidePanel !== null }"
        :style="{ '--sidepanel-width': `${sidePanelWidth}px` }"
    >
        <ChatBranches v-model="showChatBranches" />
        <ChatAddBranch v-model="showAddBranch" />
        <div class="sidepanel-wrapper">
            <SidePanel v-model="activeSidePanel" @resize="resizeSidePanel" />
        </div>
        <div class="main-wrapper">
            <ChatRenderer :message="msgs" />
            <div class="chat-input-wrapper">
                <i class="fa-solid fa-plus" title="Attach files"></i>
                <input
                    type="text"
                    class="chat-input"
                    placeholder="Ask Anything"
                >
                <i class="fa-solid fa-arrow-up" title="Send message"></i>
                <i class="fa-solid fa-code-branch" title="Branches" @click="showBranches"></i>
            </div>
        </div>
    </div>
</template>
