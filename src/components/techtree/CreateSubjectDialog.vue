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
    const stateStore = useStateStore();
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            dialogError.value = null;
            stateStore.subjectsError = null;
        }
    } );

    const handleSubmit = async () => {
        const trimmed = name.value.replace( /[^\x20-\x7E]/g, '' ).trim();

        if ( trimmed.length < 3 ) {
            dialogError.value = 'Subject name must be at least 3 ASCII characters.';

            return;
        }

        dialogError.value = null;
        creating.value = true;

        try {
            const created = await stateStore.createSubject( trimmed );

            if ( created ) {
                isOpen.value = false;
                name.value = '';
            } else {
                dialogError.value = stateStore.subjectsError ?? 'Failed to create subject';
            }
        } finally {
            creating.value = false;
        }
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
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
                v-if="dialogError"
                class="mb-4"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="dialogError = null"
            >
                {{ dialogError }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
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

            <div class="d-flex justify-end ga-2 mt-4">
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
