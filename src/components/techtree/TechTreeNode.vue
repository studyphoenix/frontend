<script setup lang="ts">
    import {
        Handle,
        Position
    } from '@vue-flow/core';
    import type {
        ModelSubtopic
    } from '@/ts/types/api';

    defineProps<{
        'subtopic': ModelSubtopic;
    }>();
</script>

<template>
    <v-card class="tech-node d-flex align-center justify-center px-3 py-2 text-center">
        <Handle
            class="node-handle"
            :position="Position.Top"
            type="target"
        />

        <span class="text-body-2 font-weight-medium">
            {{ subtopic.name }}
        </span>

        <Handle
            class="node-handle"
            :position="Position.Bottom"
            type="source"
        />
    </v-card>
</template>

<style scoped lang="scss">
    .tech-node {
        width: 190px;
        min-height: 56px;

        .node-handle {
            opacity: 0;
            pointer-events: none;
        }
    }
</style>
