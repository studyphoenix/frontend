<script setup lang="ts">
    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'title': string;
        'message': string;
        'loading'?: boolean;
        'error'?: string | null;
    }>();
    const emit = defineEmits<{
        'confirm': [];
        'clear-error': [];
    }>();
</script>

<template>
    <v-dialog
        v-model="isOpen"
        max-width="400"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <h3 class="text-h6 font-weight-bold mb-2">
                {{ props.title }}
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-5">
                {{ props.message }}
            </p>

            <v-alert
                v-if="props.error"
                class="mb-4"
                closable
                density="compact"
                :icon="false"
                type="error"
                variant="tonal"
                @click:close="emit( 'clear-error' )"
            >
                {{ props.error }}

                <template #close="{ props: closeProps }">
                    <v-btn
                        v-bind="closeProps"
                        color="error"
                    />
                </template>
            </v-alert>

            <div class="d-flex justify-end ga-2">
                <v-btn
                    color="medium-emphasis"
                    variant="text"
                    @click="isOpen = false"
                >
                    Cancel
                </v-btn>

                <v-btn
                    color="error"
                    :loading="props.loading"
                    variant="tonal"
                    @click="emit( 'confirm' )"
                >
                    Delete
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
</template>
