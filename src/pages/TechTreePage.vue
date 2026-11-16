<script setup lang="ts">
    import '@vue-flow/core/dist/style.css';
    import SideBar from '@/components/SideBar.vue';
    import TechTreeNode from '@/components/techtree/TechTreeNode.vue';
    import {
        VueFlow
    } from '@vue-flow/core';
    import {
        buildTechTreeGraph
    } from '@/ts/util/techtree-layout';
    import {
        computed
    } from 'vue';
    import {
        useTechTreeStore
    } from '@/stores/techtree';

    const store = useTechTreeStore();
    const graph = computed( () => buildTechTreeGraph( store.subtopics ) );
</script>

<template>
    <v-container class="fill-height d-flex flex-column pa-6" fluid>
        <SideBar />

        <h1 class="mb-4 align-self-start">
            Tech Tree
        </h1>

        <div class="tree-canvas">
            <VueFlow
                v-if="graph.nodes.length > 0"
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
