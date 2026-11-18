<script setup lang="ts">
    import '@vue-flow/core/dist/style.css';
    import {
        computed,
        onMounted,
        ref,
        watch
    } from 'vue';
    import SideBar from '@/components/SideBar.vue';
    import TechTreeNode from '@/components/techtree/TechTreeNode.vue';
    import {
        VueFlow
    } from '@vue-flow/core';
    import type {
        VueFlowStore
    } from '@vue-flow/core';
    import {
        buildTechTreeGraph
    } from '@/ts/util/techtree-layout';
    import {
        useStateStore
    } from '@/stores/statestore';
    import {
        useTechTreeStore
    } from '@/stores/techtree';

    const store = useTechTreeStore();
    const stateStore = useStateStore();
    const graph = computed( () => buildTechTreeGraph( store.subtopics ) );
    const flowInstance = ref<VueFlowStore | null>( null );

    const handleFlowInit = ( instance: VueFlowStore ) => {
        flowInstance.value = instance;
    };

    const handleFitView = () => {
        flowInstance.value?.fitView( {
            'padding': 0.2
        } );
    };

    const loadSelectedSubject = async ( subjectId: number ) => {
        if ( !Number.isFinite( subjectId ) || subjectId <= 0 ) {
            return;
        }

        localStorage.setItem( 'sp-selected-subject', String( subjectId ) );
        await store.fetchTechTree( subjectId );
    };

    watch( () => stateStore.selectedSubject, subjectId => {
        loadSelectedSubject( subjectId );
    } );

    onMounted( async () => {
        await store.fetchSubjects();

        if ( !Number.isFinite( stateStore.selectedSubject ) || stateStore.selectedSubject <= 0 ) {
            if ( store.subjects.length > 0 ) {
                stateStore.selectedSubject = store.subjects[0].id;
            }
        } else {
            await loadSelectedSubject( stateStore.selectedSubject );
        }
    } );
</script>

<template>
    <v-container class="techtree-page fill-height d-flex flex-column align-stretch pa-6" fluid>
        <SideBar />

        <div class="d-flex align-center justify-space-between w-100 mb-4 ga-4">
            <h1>
                Tech Tree
            </h1>

            <v-select
                v-if="store.subjects.length > 0"
                v-model="stateStore.selectedSubject"
                density="compact"
                hide-details
                item-title="name"
                item-value="id"
                :items="store.subjects"
                label="Subject"
                max-width="280"
            />
        </div>

        <div class="tree-canvas">
            <div v-if="store.loading" class="d-flex align-center justify-center fill-height">
                <v-progress-circular indeterminate />
            </div>

            <v-alert
                v-else-if="store.error"
                type="error"
                variant="tonal"
            >
                {{ store.error }}
            </v-alert>

            <div v-else-if="store.subjects.length === 0" class="d-flex align-center justify-center fill-height text-medium-emphasis">
                No subjects found yet. Create a subject first.
            </div>

            <div v-else-if="graph.nodes.length === 0" class="d-flex align-center justify-center fill-height text-medium-emphasis">
                No subtopics found for this subject yet.
            </div>

            <VueFlow
                v-else
                :key="stateStore.selectedSubject"
                :edges="graph.edges"
                :elements-selectable="false"
                fit-view-on-init
                :max-zoom="1.5"
                :min-zoom="0.3"
                :nodes="graph.nodes"
                :nodes-connectable="false"
                :nodes-draggable="false"
                :zoom-on-double-click="false"
                @init="handleFlowInit"
            >
                <template #node-tech-node="nodeProps">
                    <TechTreeNode :subtopic="nodeProps.data.subtopic" />
                </template>
            </VueFlow>

            <div v-if="graph.nodes.length > 0" class="canvas-legend d-flex align-center ga-4 px-3 py-1 text-caption text-medium-emphasis">
                <div class="d-flex align-center ga-1">
                    <v-icon
                        color="success"
                        icon="mdi-check-circle"
                        size="14"
                    />
                    <span>Completed</span>
                </div>

                <div class="d-flex align-center ga-1">
                    <span class="legend-dot bg-primary"></span>
                    <span>In Progress</span>
                </div>

                <div class="d-flex align-center ga-1">
                    <span class="legend-dot bg-surface-variant"></span>
                    <span>Not Started</span>
                </div>
            </div>

            <div v-if="graph.nodes.length > 0" class="canvas-controls d-flex align-center pa-1">
                <v-btn
                    density="compact"
                    icon="mdi-crosshairs-gps"
                    size="small"
                    title="Recenter view"
                    variant="text"
                    @click="handleFitView"
                />
            </div>
        </div>
    </v-container>
</template>

<style scoped lang="scss">
    .techtree-page {
        height: 100dvh;
        flex-wrap: nowrap;
    }

    .tree-canvas {
        width: 100%;
        flex: 1 1 0;
        min-height: 400px;
        position: relative;
        border-radius: 8px;
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
        background-color: rgb(var(--v-theme-surface));
        background-image: radial-gradient(rgba(var(--v-theme-on-surface), 0.12) 1px, transparent 1px);
        background-size: 24px 24px;
        overflow: hidden;

        .canvas-legend {
            position: absolute;
            bottom: 12px;
            left: 12px;
            z-index: 10;
            background: rgba(var(--v-theme-surface), 0.88);
            backdrop-filter: blur(6px);
            border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
            border-radius: 6px;
        }

        .canvas-controls {
            position: absolute;
            bottom: 12px;
            right: 12px;
            z-index: 10;
            background: rgba(var(--v-theme-surface), 0.88);
            backdrop-filter: blur(6px);
            border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
            border-radius: 6px;
        }

        .legend-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
        }
    }
</style>
