<script setup lang="ts">
    import {
        onMounted,
        ref
    } from 'vue';
    import type {
        ModelSubject
    } from '@/ts/types/api';
    import router from '@/router';
    import CreateSubjectDialog from '@/components/subjects/CreateSubjectDialog.vue';
    import SideBar from '@/components/SideBar.vue';
    import {
        useStateStore
    } from '@/stores/statestore';

    const stateStore = useStateStore();
    const isLoading = ref( true );
    const isCreateDialogOpen = ref( false );

    const toSubject = ( subject: ModelSubject ) => {
        stateStore.selectedSubject = subject.id;

        try {
            localStorage.setItem( 'sp-selected-subject', String( subject.id ) );
        } catch { /* */ }

        void router.push( {
            'name': 'techtree'
        } );
    };

    const openCreateDialog = () => {
        isCreateDialogOpen.value = true;
    };

    onMounted( async () => {
        await stateStore.fetchSubjects();
        isLoading.value = false;
    } );
</script>

<template>
    <SideBar />
    <main class="subject-picker">
        <h1>Subjects</h1>

        <p v-if="isLoading" role="status">
            Loading subjects...
        </p>
        <p v-if="stateStore.subjectsError" role="alert">
            {{ stateStore.subjectsError }}
        </p>
        <p v-else-if="!isLoading && stateStore.subjects.length === 0">
            No subjects found. Add one to get started.
        </p>

        <div v-if="!isLoading" class="subject-picker__grid">
            <button
                v-for="subject in stateStore.subjects"
                :key="subject.id"
                class="subject-folder"
                type="button"
                @click="toSubject( subject )"
            >
                <i class="subject-folder__icon mdi mdi-folder" aria-hidden="true"></i>
                <span class="subject-folder__name">{{ subject.name }}</span>
            </button>
            <button
                aria-label="Add new subject"
                class="subject-folder subject-folder--add"
                type="button"
                @click="openCreateDialog"
            >
                <i class="subject-folder__icon mdi mdi-plus" aria-hidden="true"></i>
            </button>
        </div>

        <CreateSubjectDialog v-model="isCreateDialogOpen" />
    </main>
</template>

<style lang="scss">
@use '@/styles/subject-picker.scss';
</style>
