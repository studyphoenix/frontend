<script setup lang="ts">
    import '@vue-flow/core/dist/style.css';
    import {
        computed,
        onMounted,
        watch
    } from 'vue';
    import SideBar from '@/components/SideBar.vue';
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
        useTechTreeStore
    } from '@/stores/techtree';

    const store = useTechTreeStore();
    const stateStore = useStateStore();
    const graph = computed( () => buildTechTreeGraph( store.subtopics ) );

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
    <v-container class="fill-height d-flex flex-column pa-6" fluid>
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
            >
                <template #node-tech-node="nodeProps">
                    <TechTreeNode :subtopic="nodeProps.data.subtopic" />
                </template>
            </VueFlow>
        </div>
    </v-container>
</template>

<style scoped lang="scss">
    .tree-canvas {
        width: 100%;
        height: 640px;
    }
</style>
