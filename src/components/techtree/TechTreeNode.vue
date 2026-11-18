<script setup lang="ts">
    import {
        Handle,
        Position
    } from '@vue-flow/core';
    import type {
        ModelSubtopic
    } from '@/ts/types/api';
    import {
        computed
    } from 'vue';

    const props = defineProps<{
        'subtopic': ModelSubtopic;
    }>();
    const progress = computed( () => {
        const val = Number( props.subtopic.progress );

        return Number.isFinite( val ) ? Math.max( 0, Math.min( 100, val ) ) : 0;
    } );
    const isCompleted = computed( () => progress.value >= 100 );
    const isInProgress = computed( () => progress.value > 0 && progress.value < 100 );
    const statusClass = computed( () => {
        if ( isCompleted.value ) {
            return 'status-completed';
        }

        if ( isInProgress.value ) {
            return 'status-in-progress';
        }

        return 'status-not-started';
    } );
    const progressColor = computed( () => {
        if ( isCompleted.value ) {
            return 'success';
        }

        if ( isInProgress.value ) {
            return 'primary';
        }

        return 'surface-variant';
    } );
</script>

<template>
    <div
        class="tech-node d-flex flex-column justify-space-between px-3 py-2"
        :class="statusClass"
    >
        <Handle
            class="node-handle"
            :position="Position.Top"
            type="target"
        />

        <div class="d-flex align-center justify-space-between w-100 ga-2 flex-grow-1">
            <span
                class="node-title text-body-2 font-weight-medium text-truncate"
                :title="subtopic.name"
            >
                {{ subtopic.name }}
            </span>

            <v-icon
                v-if="isCompleted"
                class="flex-shrink-0"
                color="success"
                icon="mdi-check-circle"
                size="18"
            />
            <span
                v-else-if="isInProgress"
                class="text-caption font-weight-bold text-primary flex-shrink-0"
            >
                {{ Math.round( progress ) }}%
            </span>
        </div>

        <v-progress-linear
            class="mt-2"
            :chunk-gap="0"
            :color="progressColor"
            height="4"
            :model-value="progress"
            rounded
            :stop-indicator="false"
        />

        <Handle
            class="node-handle"
            :position="Position.Bottom"
            type="source"
        />
    </div>
</template>

<style scoped lang="scss">
    .tech-node {
        width: 220px;
        min-height: 64px;
        border-radius: 8px;
        border-width: 1px;
        border-style: solid;
        cursor: pointer;
        user-select: none;
        transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }

        &.status-completed {
            background-color: color-mix(in srgb, rgb(var(--v-theme-success)) 16%, rgb(var(--v-theme-surface)));
            border-color: color-mix(in srgb, rgb(var(--v-theme-success)) 45%, transparent);
        }

        &.status-in-progress {
            background-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, rgb(var(--v-theme-surface)));
            border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent);
        }

        &.status-not-started {
            background-color: rgb(var(--v-theme-surface));
            border-color: rgba(var(--v-border-color), var(--v-border-opacity));
        }

        .node-title {
            color: rgb(var(--v-theme-on-surface));
        }

        .node-handle {
            opacity: 0;
            pointer-events: none;
        }
    }
</style>
