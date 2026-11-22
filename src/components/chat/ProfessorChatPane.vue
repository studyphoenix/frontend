<script setup lang="ts">
    import {
        nextTick,
        ref,
        watch
    } from 'vue';
    import type {
        ModelChatMessage
    } from '@/ts/types/api';

    const props = defineProps<{
        'openingMessage': string;
        'messages': ModelChatMessage[];
        'checkpointActive': boolean;
        'checkpointFeedback': string | null;
        'sending': boolean;
    }>();
    const emit = defineEmits<{
        'send': [ text: string ];
        'clear-checkpoint-feedback': [];
    }>();
    const draft = ref( '' );
    const chatScrollRef = ref<HTMLElement | null>( null );

    const scrollToBottom = async () => {
        await nextTick();

        if ( chatScrollRef.value ) {
            chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
        }
    };

    watch( () => props.messages.length, () => {
        scrollToBottom();
    } );

    watch( () => props.sending, value => {
        if ( value ) {
            scrollToBottom();
        }
    } );

    const submitText = ( customText?: string ) => {
        const text = customText ?? draft.value;

        if ( !text.trim() || props.sending ) {
            return;
        }

        if ( !customText ) {
            draft.value = '';
        }

        emit( 'send', text );
    };

    const handleKeydown = ( event: KeyboardEvent ) => {
        if ( event.key === 'Enter' && !event.shiftKey ) {
            event.preventDefault();
            submitText();
        }
    };
</script>

<template>
    <div class="chat-pane d-flex flex-column h-100 pa-3">
        <div
            ref="chatScrollRef"
            class="chat-scroll flex-grow-1 pr-1"
        >
            <v-sheet
                v-if="props.openingMessage"
                class="bubble professor-bubble pa-4 mb-4 rounded-lg"
            >
                <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-1">
                    <v-icon
                        icon="mdi-school-outline"
                        size="16"
                    />
                    <span>Professor</span>
                </div>
                <div class="message-text text-body-2">
                    {{ props.openingMessage }}
                </div>
            </v-sheet>

            <div
                v-for="turn in props.messages"
                :key="turn.id"
                class="d-flex flex-column"
            >
                <v-sheet
                    class="bubble pa-3 mb-3 align-self-end rounded-lg"
                    color="primary"
                >
                    <div class="message-text text-body-2">
                        {{ turn.userMessage }}
                    </div>
                </v-sheet>

                <v-sheet
                    class="bubble professor-bubble pa-4 mb-4 align-self-start rounded-lg"
                >
                    <div class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-1">
                        <v-icon
                            icon="mdi-school-outline"
                            size="16"
                        />
                        <span>Professor</span>
                    </div>
                    <div class="message-text text-body-2">
                        {{ turn.modelMessage }}
                    </div>
                </v-sheet>
            </div>

            <div
                v-if="props.sending"
                class="d-flex align-center ga-2 text-caption text-medium-emphasis mb-4"
            >
                <v-progress-circular
                    indeterminate
                    size="16"
                    width="2"
                />
                <span>Professor is thinking...</span>
            </div>
        </div>

        <v-alert
            v-if="props.checkpointFeedback"
            class="mb-2 flex-shrink-0"
            closable
            density="compact"
            :icon="false"
            type="success"
            variant="tonal"
            @click:close="emit( 'clear-checkpoint-feedback' )"
        >
            {{ props.checkpointFeedback }}

            <template #close="{ props: closeProps }">
                <v-btn
                    v-bind="closeProps"
                    color="success"
                />
            </template>
        </v-alert>

        <v-alert
            v-else-if="props.checkpointActive"
            class="mb-2 flex-shrink-0"
            density="compact"
            :icon="false"
            type="info"
            variant="tonal"
        >
            Understanding checkpoint active: explain this concept in your own words below.
        </v-alert>

        <div class="d-flex align-center ga-2 flex-wrap mb-2 flex-shrink-0">
            <v-chip
                :disabled="props.sending"
                size="small"
                variant="outlined"
                @click="submitText( 'Please explain that more simply.' )"
            >
                Explain more simply
            </v-chip>
            <v-chip
                :disabled="props.sending"
                size="small"
                variant="outlined"
                @click="submitText( 'Can you give me a concrete example?' )"
            >
                Give an example
            </v-chip>
        </div>

        <div class="d-flex align-end ga-2 flex-shrink-0">
            <v-textarea
                v-model="draft"
                auto-grow
                density="compact"
                :disabled="props.sending"
                hide-details
                :label="props.checkpointActive ? 'Explain the concept in your own words...' : 'Ask Professor or answer...'"
                max-rows="5"
                rows="2"
                variant="outlined"
                @keydown="handleKeydown"
            />
            <v-btn
                aria-label="Send message"
                color="on-surface"
                :disabled="!draft.trim() || props.sending"
                height="48"
                icon="mdi-send"
                :loading="props.sending"
                variant="tonal"
                width="48"
                @click="submitText()"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
    .chat-pane {
        min-height: 0;
    }

    .chat-scroll {
        min-height: 0;
        overflow-y: auto;
    }

    .bubble {
        max-width: 78ch;
        word-wrap: break-word;
    }

    .professor-bubble {
        background-color: rgba(var(--v-theme-on-surface), 0.08);
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    .message-text {
        white-space: pre-line;
    }
</style>
