<script setup lang="ts">
    import {
        ref,
        watch
    } from 'vue';
    import {
        useStateStore
    } from '@/stores/statestore';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );
    const stateStore = useStateStore();

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            dialogError.value = null;
        }
    } );

    const handleSubmit = async () => {
        const cleanName = name.value.trim();

        if ( cleanName.length < 3 || cleanName.length > 100 ) {
            dialogError.value = 'Subject name must be between 3 and 100 characters.';

            return;
        }

        if ( !( /^[a-zA-Z0-9 _+.,/()-]+$/ ).test( cleanName ) ) {
            dialogError.value = 'Subject names may use letters, numbers, spaces, and _+.,/()- characters.';

            return;
        }

        creating.value = true;
        dialogError.value = null;

        try {
            const created = await stateStore.createSubject( cleanName );

            if ( created ) {
                isOpen.value = false;
                name.value = '';
            } else {
                dialogError.value = stateStore.subjectsError ?? 'Failed to create subject.';
            }
        } finally {
            creating.value = false;
        }
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        class="create-subject-dialog"
        max-width="420"
    >
        <v-sheet
            class="create-subject-dialog__sheet"
            rounded="lg"
        >
            <h2 class="create-subject-dialog__title">
                Add new subject
            </h2>
            <p class="create-subject-dialog__help">
                Add a subject to start building its tech tree.
            </p>

            <v-alert
                v-if="dialogError"
                class="create-subject-dialog__alert"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="dialogError = null"
            >
                {{ dialogError }}
            </v-alert>

            <v-text-field
                v-model="name"
                autofocus
                counter="100"
                density="compact"
                label="Subject name"
                maxlength="100"
                placeholder="e.g. Linear Algebra"
                variant="outlined"
                @keyup.enter="handleSubmit"
            />

            <div class="create-subject-dialog__actions">
                <v-btn
                    color="medium-emphasis"
                    variant="text"
                    @click="isOpen = false"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="on-surface"
                    :loading="creating"
                    variant="tonal"
                    @click="handleSubmit"
                >
                    Create
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
</template>

<style lang="scss">
@use '@/styles/create-subject-dialog.scss';
</style>
