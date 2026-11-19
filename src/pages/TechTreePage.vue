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
    const newSubjectName = ref( '' );
    const creatingSubject = ref( false );
    const subjectDialogError = ref<string | null>( null );
    const createSubtopicDialogOpen = ref( false );
    const newSubtopicName = ref( '' );
    const creatingSubtopic = ref( false );
    const subtopicDialogError = ref<string | null>( null );

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
        newSubjectName.value = '';
        subjectDialogError.value = null;
        stateStore.subjectsError = null;
        createSubjectDialogOpen.value = true;
    };

    const handleCreateSubject = async () => {
        const trimmed = newSubjectName.value.replace( /[^\x20-\x7E]/g, '' ).trim();

        if ( trimmed.length < 3 ) {
            subjectDialogError.value = 'Subject name must be at least 3 ASCII characters.';

            return;
        }

        subjectDialogError.value = null;
        creatingSubject.value = true;

        try {
            const created = await stateStore.createSubject( trimmed );

            if ( created ) {
                createSubjectDialogOpen.value = false;
                newSubjectName.value = '';
            } else {
                subjectDialogError.value = stateStore.subjectsError ?? 'Failed to create subject';
            }
        } finally {
            creatingSubject.value = false;
        }
    };

    const openCreateSubtopicDialog = () => {
        newSubtopicName.value = '';
        subtopicDialogError.value = null;
        error.value = null;
        createSubtopicDialogOpen.value = true;
    };

    const handleCreateSubtopic = async () => {
        if ( stateStore.selectedSubject <= 0 ) {
            subtopicDialogError.value = 'Select a subject first.';

            return;
        }

        const trimmed = newSubtopicName.value.replace( /[^\x20-\x7E]/g, '' ).trim();

        if ( trimmed.length < 3 || trimmed.length > 22 ) {
            subtopicDialogError.value = 'Subtopic name must be between 3 and 22 ASCII characters.';

            return;
        }

        subtopicDialogError.value = null;
        creatingSubtopic.value = true;

        try {
            const created = await createSubtopic( stateStore.selectedSubject, trimmed );

            if ( created ) {
                createSubtopicDialogOpen.value = false;
                newSubtopicName.value = '';
            } else {
                subtopicDialogError.value = error.value ?? 'Failed to create subtopic';
            }
        } finally {
            creatingSubtopic.value = false;
        }
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

    void init();
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

        <v-dialog
            v-model="createSubjectDialogOpen"
            max-width="420"
        >
            <v-sheet
                class="pa-5"
                rounded="lg"
            >
                <h3 class="text-h6 font-weight-bold mb-2">
                    Create Subject
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-4">
                    Add a subject to start building its tech tree.
                </p>

                <v-alert
                    v-if="subjectDialogError"
                    class="mb-4"
                    closable
                    density="compact"
                    :icon="false"
                    type="error"
                    variant="tonal"
                    @click:close="subjectDialogError = null"
                >
                    {{ subjectDialogError }}

                    <template #close="{ props: closeProps }">
                        <v-btn
                            v-bind="closeProps"
                            color="error"
                        />
                    </template>
                </v-alert>

                <v-text-field
                    v-model="newSubjectName"
                    autofocus
                    counter="100"
                    density="compact"
                    label="Subject name"
                    maxlength="100"
                    placeholder="e.g. Linear Algebra"
                    variant="outlined"
                    @keyup.enter="handleCreateSubject"
                />

                <div class="d-flex justify-end ga-2 mt-4">
                    <v-btn
                        color="medium-emphasis"
                        variant="text"
                        @click="createSubjectDialogOpen = false"
                    >
                        Cancel
                    </v-btn>

                    <v-btn
                        color="on-surface"
                        :loading="creatingSubject"
                        variant="tonal"
                        @click="handleCreateSubject"
                    >
                        Create
                    </v-btn>
                </div>
            </v-sheet>
        </v-dialog>

        <v-dialog
            v-model="createSubtopicDialogOpen"
            max-width="420"
        >
            <v-sheet
                class="pa-5"
                rounded="lg"
            >
                <h3 class="text-h6 font-weight-bold mb-2">
                    Create Subtopic
                </h3>
                <p class="text-body-2 text-medium-emphasis mb-4">
                    Add a starting subtopic node for this subject.
                </p>

                <v-alert
                    v-if="subtopicDialogError"
                    class="mb-4"
                    closable
                    density="compact"
                    :icon="false"
                    type="error"
                    variant="tonal"
                    @click:close="subtopicDialogError = null"
                >
                    {{ subtopicDialogError }}

                    <template #close="{ props: closeProps }">
                        <v-btn
                            v-bind="closeProps"
                            color="error"
                        />
                    </template>
                </v-alert>

                <v-text-field
                    v-model="newSubtopicName"
                    autofocus
                    :counter="22"
                    density="compact"
                    label="Subtopic name"
                    maxlength="22"
                    placeholder="e.g. Probability Axioms"
                    variant="outlined"
                    @keyup.enter="handleCreateSubtopic"
                />

                <div class="d-flex justify-end ga-2 mt-4">
                    <v-btn
                        color="medium-emphasis"
                        variant="text"
                        @click="createSubtopicDialogOpen = false"
                    >
                        Cancel
                    </v-btn>

                    <v-btn
                        color="on-surface"
                        :loading="creatingSubtopic"
                        variant="tonal"
                        @click="handleCreateSubtopic"
                    >
                        Create
                    </v-btn>
                </div>
            </v-sheet>
        </v-dialog>
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
