<script setup lang="ts">
    import {
        deleteSubject,
        updateSubject
    } from '@/ts/util/subjects';
    import {
        onMounted,
        onUnmounted,
        ref,
        watch
    } from 'vue';
    import type {
        ModelSubject
    } from '@/ts/types/api';

    const props = defineProps<{
        'position': {
            'x': number;
            'y': number;
        };
        'subject': ModelSubject;
    }>();
    const emit = defineEmits<{
        'close': [];
        'deleted': [subjectId: number];
        'renamed': [update: {
            'id': number;
            'name': string
        }];
    }>();
    const contextMenuOpen = ref( true );
    const isRenameDialogOpen = ref( false );
    const isDeleteDialogOpen = ref( false );
    const subjectName = ref( props.subject.name );
    const renameError = ref<string | null>( null );
    const deleteError = ref<string | null>( null );
    const isRenaming = ref( false );
    const isDeleting = ref( false );

    watch( isRenameDialogOpen, ( isOpen, wasOpen ) => {
        if ( wasOpen && !isOpen ) {
            emit( 'close' );
        }
    } );

    watch( isDeleteDialogOpen, ( isOpen, wasOpen ) => {
        if ( wasOpen && !isOpen ) {
            emit( 'close' );
        }
    } );

    const closeContextMenu = () => {
        if ( contextMenuOpen.value ) {
            contextMenuOpen.value = false;
            emit( 'close' );
        }
    };

    const handleDocumentPointerDown = () => {
        closeContextMenu();
    };

    const handleDocumentKeyDown = ( event: KeyboardEvent ) => {
        if ( event.key === 'Escape' ) {
            closeContextMenu();
        }
    };

    const openRenameDialog = () => {
        contextMenuOpen.value = false;
        subjectName.value = props.subject.name;
        renameError.value = null;
        isRenameDialogOpen.value = true;
    };

    const openDeleteDialog = () => {
        contextMenuOpen.value = false;
        deleteError.value = null;
        isDeleteDialogOpen.value = true;
    };

    const cancelRename = () => {
        isRenameDialogOpen.value = false;
    };

    const cancelDelete = () => {
        isDeleteDialogOpen.value = false;
    };

    const handleRename = async () => {
        const cleanName = subjectName.value.trim();

        if ( cleanName.length < 3 || cleanName.length > 100 ) {
            renameError.value = 'Subject name must be between 3 and 100 characters.';

            return;
        }

        if ( !( /^[a-zA-Z0-9 _+.,/()-]+$/ ).test( cleanName ) ) {
            renameError.value = 'Subject names may use letters, numbers, spaces, and _+.,/()- characters.';

            return;
        }

        isRenaming.value = true;
        renameError.value = null;

        try {
            await updateSubject( props.subject.id, {
                'name': cleanName
            } );
            isRenameDialogOpen.value = false;
            emit( 'renamed', {
                'id': props.subject.id,
                'name': cleanName
            } );
        } catch ( error ) {
            renameError.value = error instanceof Error ? error.message : 'Failed to rename subject.';
        } finally {
            isRenaming.value = false;
        }
    };

    const handleDelete = async () => {
        isDeleting.value = true;
        deleteError.value = null;

        try {
            await deleteSubject( props.subject.id );
            isDeleteDialogOpen.value = false;
            emit( 'deleted', props.subject.id );
        } catch ( error ) {
            deleteError.value = error instanceof Error ? error.message : 'Failed to delete subject.';
        } finally {
            isDeleting.value = false;
        }
    };

    onMounted( () => {
        document.addEventListener( 'pointerdown', handleDocumentPointerDown );
        document.addEventListener( 'keydown', handleDocumentKeyDown );
    } );

    onUnmounted( () => {
        document.removeEventListener( 'pointerdown', handleDocumentPointerDown );
        document.removeEventListener( 'keydown', handleDocumentKeyDown );
    } );
</script>

<template>
    <div
        v-if="contextMenuOpen"
        class="subject-context-menu"
        role="menu"
        :style="{
            'left': `${ props.position.x }px`,
            'top': `${ props.position.y }px`
        }"
        @pointerdown.stop
    >
        <button type="button" role="menuitem" @click="openRenameDialog">
            <i class="mdi mdi-pencil" aria-hidden="true"></i>
            Rename
        </button>
        <button type="button" role="menuitem" @click="openDeleteDialog">
            <i class="mdi mdi-delete-outline" aria-hidden="true"></i>
            Delete
        </button>
    </div>

    <v-dialog v-model="isRenameDialogOpen" max-width="420">
        <v-sheet class="subject-context-menu__dialog" rounded="lg">
            <h2 class="subject-context-menu__dialog-title">
                Rename subject
            </h2>
            <v-alert
                v-if="renameError"
                class="mb-4"
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
            >
                {{ renameError }}
            </v-alert>
            <v-text-field
                v-model="subjectName"
                autofocus
                counter="100"
                density="compact"
                label="Subject name"
                maxlength="100"
                variant="outlined"
                @keyup.enter="handleRename"
            />
            <div class="subject-context-menu__dialog-actions">
                <v-btn
                    color="medium-emphasis"
                    :disabled="isRenaming"
                    variant="text"
                    @click="cancelRename"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="on-surface"
                    :loading="isRenaming"
                    variant="tonal"
                    @click="handleRename"
                >
                    Save
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>

    <v-dialog v-model="isDeleteDialogOpen" max-width="400">
        <v-sheet class="subject-context-menu__dialog" rounded="lg">
            <h2 class="subject-context-menu__dialog-title">
                Delete subject?
            </h2>
            <p class="text-body-2 text-medium-emphasis">
                Delete "{{ props.subject.name }}"? This action cannot be undone.
            </p>
            <v-alert
                v-if="deleteError"
                class="mb-4"
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
            >
                {{ deleteError }}
            </v-alert>
            <div class="subject-context-menu__dialog-actions">
                <v-btn
                    color="medium-emphasis"
                    :disabled="isDeleting"
                    variant="text"
                    @click="cancelDelete"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="error"
                    :loading="isDeleting"
                    variant="tonal"
                    @click="handleDelete"
                >
                    Delete
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
</template>

<style lang="scss">
@use '@/styles/subject-context-menu.scss';
</style>
