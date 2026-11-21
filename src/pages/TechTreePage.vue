<script setup lang="ts">
    import '@vue-flow/core/dist/style.css';
    import type {
        NodeMouseEvent,
        VueFlowStore
    } from '@vue-flow/core';
    import {
        computed,
        ref,
        watch
    } from 'vue';
    import CreateSubjectDialog from '@/components/techtree/CreateSubjectDialog.vue';
    import CreateSubtopicDialog from '@/components/techtree/CreateSubtopicDialog.vue';
    import type {
        ModelSubtopic
    } from '@/ts/types/api';
    import SideBar from '@/components/SideBar.vue';
    import SubtopicDetailPopup from '@/components/techtree/SubtopicDetailPopup.vue';
    import TechTreeNode from '@/components/techtree/TechTreeNode.vue';
    import {
        VueFlow
    } from '@vue-flow/core';
    import {
        buildTechTreeGraph
    } from '@/ts/util/techtree-layout';
    import {
        useStateStore
    } from '@/stores/statestore';
    import {
        useTechTree
    } from '@/composables/techtree';

    const stateStore = useStateStore();
    const {
        subtopics,
        loading,
        error,
        fetchTechTree,
        createSubtopic
    } = useTechTree();
    const graph = computed( () => buildTechTreeGraph( subtopics.value ) );
    const flowInstance = ref<VueFlowStore | null>( null );
    const selectedSubtopic = ref<ModelSubtopic | null>( null );
    const popupOpen = ref( false );
    const createSubjectDialogOpen = ref( false );
    const createSubtopicDialogOpen = ref( false );

    const handleFlowInit = ( instance: VueFlowStore ) => {
        flowInstance.value = instance;
    };

    const handleNodeClick = ( {
        node
    }: NodeMouseEvent ) => {
        const subtopic = node.data?.subtopic as ModelSubtopic | undefined;

        if ( !subtopic ) {
            return;
        }

        selectedSubtopic.value = subtopic;
        stateStore.selectedSubtopic = subtopic.id;
        popupOpen.value = true;
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
        await fetchTechTree( subjectId );
    };

    const openCreateSubjectDialog = () => {
        createSubjectDialogOpen.value = true;
    };

    const openCreateSubtopicDialog = () => {
        error.value = null;
        createSubtopicDialogOpen.value = true;
    };

    watch( () => stateStore.selectedSubject, subjectId => {
        loadSelectedSubject( subjectId );
    } );

    const init = async () => {
        await stateStore.fetchSubjects();

        const hasValidSelection = stateStore.subjects.some( s => s.id === stateStore.selectedSubject );

        if ( !hasValidSelection && stateStore.subjects.length > 0 ) {
            stateStore.selectedSubject = stateStore.subjects[0].id;
        } else if ( hasValidSelection && Number.isFinite( stateStore.selectedSubject ) && stateStore.selectedSubject > 0 ) {
            await loadSelectedSubject( stateStore.selectedSubject );
        }
    };

    init();
</script>

<template>
    <v-container class="techtree-page fill-height d-flex flex-column align-stretch pa-6" fluid>
        <SideBar />

        <div class="d-flex align-center justify-space-between w-100 mb-4 ga-4">
            <h1>
                Tech Tree
            </h1>

            <div v-if="stateStore.subjects.length > 0" class="d-flex align-center ga-2">
                <v-select
                    v-model="stateStore.selectedSubject"
                    density="compact"
                    hide-details
                    item-title="name"
                    item-value="id"
                    :items="stateStore.subjects"
                    label="Subject"
                    max-width="280"
                    min-width="220"
                />
                <v-btn
                    aria-label="Create Subject"
                    color="on-surface"
                    density="comfortable"
                    icon="mdi-plus"
                    title="Create Subject"
                    variant="outlined"
                    @click="openCreateSubjectDialog"
                />
            </div>
        </div>

        <div class="tree-canvas">
            <div v-if="loading" class="d-flex align-center justify-center fill-height">
                <v-progress-circular indeterminate />
            </div>

            <v-alert
                v-else-if="error || stateStore.subjectsError"
                :icon="false"
                type="error"
                variant="tonal"
            >
                {{ error || stateStore.subjectsError }}
            </v-alert>

            <div
                v-else-if="stateStore.subjects.length === 0"
                class="d-flex flex-column align-center justify-center fill-height ga-3 text-medium-emphasis"
            >
                <span>No subjects found yet. Create a subject first.</span>
                <v-btn
                    color="on-surface"
                    prepend-icon="mdi-plus"
                    variant="outlined"
                    @click="openCreateSubjectDialog"
                >
                    Create Subject
                </v-btn>
            </div>

            <div
                v-else-if="graph.nodes.length === 0"
                class="d-flex flex-column align-center justify-center fill-height ga-3 text-medium-emphasis"
            >
                <span>No subtopics found for this subject yet.</span>
                <v-btn
                    color="on-surface"
                    prepend-icon="mdi-plus"
                    variant="outlined"
                    @click="openCreateSubtopicDialog"
                >
                    Create Subtopic
                </v-btn>
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
                @node-click="handleNodeClick"
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

        <SubtopicDetailPopup
            v-model="popupOpen"
            :subtopic="selectedSubtopic"
        />

        <CreateSubjectDialog v-model="createSubjectDialogOpen" />

        <CreateSubtopicDialog
            v-model="createSubtopicDialogOpen"
            :create-subtopic="createSubtopic"
            :external-error="error"
            :subject-id="stateStore.selectedSubject"
        />
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
