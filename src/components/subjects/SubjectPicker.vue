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
    import SubjectContextMenu from '@/components/subjects/SubjectContextMenu.vue';
    import SideBar from '@/components/SideBar.vue';
    import {
        useStateStore
    } from '@/stores/statestore';

    const stateStore = useStateStore();
    const isLoading = ref( true );
    const isCreateDialogOpen = ref( false );
    const contextMenuSubject = ref<ModelSubject | null>( null );
    const contextMenuPosition = ref( {
        'x': 0,
        'y': 0
    } );

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

    const openContextMenu = ( event: MouseEvent, subject: ModelSubject ) => {
        event.preventDefault();
        contextMenuSubject.value = subject;
        contextMenuPosition.value = {
            'x': Math.max( 8, Math.min( event.clientX, window.innerWidth - 188 ) ),
            'y': Math.max( 8, Math.min( event.clientY, window.innerHeight - 104 ) )
        };
    };

    const handleSubjectRenamed = ( update: { 'id': number; 'name': string } ) => {
        stateStore.subjects = stateStore.subjects.map( subject => subject.id === update.id
            ? {
                ...subject,
                'name': update.name
            }
            : subject );
        contextMenuSubject.value = null;
    };

    const handleSubjectDeleted = ( subjectId: number ) => {
        stateStore.subjects = stateStore.subjects.filter( subject => subject.id !== subjectId );

        if ( stateStore.selectedSubject === subjectId ) {
            stateStore.selectedSubject = -1;
            stateStore.selectedSubtopic = -1;
            stateStore.selectedChat = -1;

            try {
                localStorage.removeItem( 'sp-selected-subject' );
                localStorage.removeItem( 'sp-selected-subtopic' );
                localStorage.removeItem( 'sp-selected-chat' );
            } catch { /* */ }
        }

        contextMenuSubject.value = null;
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
            <v-btn
                v-for="subject in stateStore.subjects"
                :key="subject.id"
                :aria-expanded="contextMenuSubject?.id === subject.id"
                aria-haspopup="menu"
                class="subject-folder"
                block
                type="button"
                variant="outlined"
                @click="toSubject( subject )"
                @contextmenu.prevent.stop="openContextMenu( $event, subject )"
            >
                <i class="subject-folder__icon mdi mdi-folder" aria-hidden="true"></i>
                <span class="subject-folder__name">{{ subject.name }}</span>
            </v-btn>
            <v-btn
                aria-label="Add new subject"
                class="subject-folder subject-folder--add"
                block
                type="button"
                variant="outlined"
                @click="openCreateDialog"
            >
                <i class="subject-folder__icon mdi mdi-plus" aria-hidden="true"></i>
            </v-btn>
        </div>

        <SubjectContextMenu
            v-if="contextMenuSubject"
            :position="contextMenuPosition"
            :subject="contextMenuSubject"
            @close="contextMenuSubject = null"
            @deleted="handleSubjectDeleted"
            @renamed="handleSubjectRenamed"
        />

        <CreateSubjectDialog v-model="isCreateDialogOpen" />
    </main>
</template>

<style lang="scss">
@use '@/styles/subject-picker.scss';
</style>
