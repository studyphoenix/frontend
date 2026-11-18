<script setup lang="ts">
    import type {
        ChatMessagePair
    } from '@/ts/types';

    const props = defineProps<{
        'message': ChatMessagePair
    }>();

    const openAddBranchPopup = () => {
        document.dispatchEvent( new CustomEvent( 'branch:add:start' ) );
    };

    const openBranchesOverview = () => {
        document.dispatchEvent( new CustomEvent( 'branch:overview:open' ) );
    };
</script>

<template>
    <div class="chat-messages-wrapper">
        <div class="chat-messages-pair">
            <p class="chat-messages-human">
                {{ props.message.question }}
            </p>
            <div class="chat-messages-bot">
                <p>{{ props.message.response }}</p>
                <i class="fa-solid fa-code-branch" title="Create new branch here" @click="openAddBranchPopup"></i>
            </div>
        </div>
        <div v-if="props.message.branches && props.message.branches.length > 0" class="chat-branching-indicator">
            <hr>
            <p @click="openBranchesOverview">
                <i class="fa-solid fa-code-branch"></i>
                {{ props.message.branches!.length }} {{ props.message.branches.length > 1 ? 'Branches' : 'Branch' }}
            </p>
        </div>
        <ChatRenderer v-if="props.message.child" :message="props.message.child!" />
    </div>
</template>
