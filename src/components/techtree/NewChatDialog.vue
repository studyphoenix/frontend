<script setup lang="ts">
    import {
        CHAT_MODES,
        getChatModeMeta
    } from '@/ts/util/chat-modes';
    import {
        ref,
        watch
    } from 'vue';
    import type {
        ModelChat
    } from '@/ts/types/api';

    const isOpen = defineModel<boolean>( {
        'default': false
    } );
    const props = defineProps<{
        'subtopicName': string;
        'existingChats': ModelChat[];
        'loading'?: boolean;
        'error'?: string | null;
    }>();
    const emit = defineEmits<{
        'create': [ payload: {
            'title': string;
            'mode': 1 | 2 | 3;
        } ];
        'clear-error': [];
    }>();
    const selectedMode = ref<1 | 2 | 3>( 1 );
    const chatTitle = ref( '' );

    watch( isOpen, open => {
        if ( open ) {
            selectedMode.value = 1;
            chatTitle.value = '';
            emit( 'clear-error' );
        }
    } );

    const getNextDefaultChatTitle = ( label: string, mode: 1 | 2 | 3 ): string => {
        const existing = new Set( props.existingChats
            .filter( c => c.mode === mode )
            .map( c => c.name.trim()
                .toLowerCase() ) );

        let index = 1;

        while ( existing.has( `${ label } #${ index }`.toLowerCase() ) ) {
            index++;
        }

        return `${ label } #${ index }`;
    };

    const handleSubmit = () => {
        const cfg = getChatModeMeta( selectedMode.value );
        const title = chatTitle.value.trim() || getNextDefaultChatTitle( cfg.label, cfg.mode );

        emit( 'create', {
            'title': title,
            'mode': cfg.mode
        } );
    };
</script>

<template>
    <v-dialog
        v-model="isOpen"
        max-width="440"
    >
        <v-sheet
            class="pa-5"
            rounded="lg"
        >
            <h3 class="text-h6 font-weight-bold mb-1">
                New Chat
            </h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
                Choose a learning mode for {{ props.subtopicName }}.
            </p>

            <v-list
                class="bg-transparent py-0 mb-4"
                density="comfortable"
                lines="two"
            >
                <v-list-item
                    v-for="cfg in CHAT_MODES"
                    :key="cfg.mode"
                    :active="selectedMode === cfg.mode"
                    class="mode-option rounded mb-2"
                    color="on-surface"
                    :prepend-icon="cfg.icon"
                    :subtitle="cfg.description"
                    :title="`${ cfg.label } Mode`"
                    @click="selectedMode = cfg.mode"
                />
            </v-list>

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

            <v-text-field
                v-model="chatTitle"
                density="compact"
                hide-details
                label="Chat title (optional)"
                variant="outlined"
                @keyup.enter="handleSubmit"
            />

            <div class="d-flex justify-end ga-2 mt-5">
                <v-btn
                    color="medium-emphasis"
                    variant="text"
                    @click="isOpen = false"
                >
                    Cancel
                </v-btn>

                <v-btn
                    color="on-surface"
                    :loading="props.loading"
                    variant="tonal"
                    @click="handleSubmit"
                >
                    Start Chat
                </v-btn>
            </div>
        </v-sheet>
    </v-dialog>
</template>

<style scoped lang="scss">
    .mode-option {
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }
</style>
