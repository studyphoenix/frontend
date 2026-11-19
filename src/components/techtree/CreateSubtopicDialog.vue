<script setup lang="ts">
    import {
        ref,
        watch
    } from 'vue';
    import type {
        ModelSubtopic
    } from '@/ts/types/api';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'subjectId': number;
        'createSubtopic': ( subjectId: number, name: string ) => Promise<ModelSubtopic | null>;
        'externalError'?: string | null;
    }>();
    const name = ref( '' );
    const creating = ref( false );
    const dialogError = ref<string | null>( null );

    watch( isOpen, open => {
        if ( open ) {
            name.value = '';
            dialogError.value = null;
        }
    } );

    const handleSubmit = async () => {
        if ( props.subjectId <= 0 ) {
            dialogError.value = 'Select a subject first.';

            return;
        }

        const trimmed = name.value.replace( /[^\x20-\x7E]/g, '' ).trim();

        if ( trimmed.length < 3 || trimmed.length > 22 ) {
            dialogError.value = 'Subtopic name must be between 3 and 22 ASCII characters.';

            return;
        }

        dialogError.value = null;
        creating.value = true;

        try {
            const created = await props.createSubtopic( props.subjectId, trimmed );

            if ( created ) {
                isOpen.value = false;
                name.value = '';
            } else {
                dialogError.value = props.externalError ?? 'Failed to create subtopic';
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
                Create Subtopic
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
                Add a starting subtopic node for this subject.
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
                :counter="22"
                density="compact"
                label="Subtopic name"
                maxlength="22"
                placeholder="e.g. Probability Axioms"
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
