<script setup lang="ts">
    import {
        computed,
        ref
    } from 'vue';
    import ChatView from '@/components/chat/ChatView.vue';
    import type {
        ModelFlashcard
    } from '@/ts/types/api';

    interface FlashcardItem extends ModelFlashcard {
        'expectedKeywords': string[];
    }

    const props = defineProps<{
        'chatId': number | null;
        'chatName': string;
    }>();
    const DEFAULT_DECK: FlashcardItem[] = [
        {
            'id': 1,
            'name': 'Kolmogorov Axioms',
            'content': 'What are the three axioms that define a valid probability measure P on a sample space Ω?',
            'completionCount': 0,
            'updatedAt': '2026-11-21T00:00:00Z',
            'expectedKeywords': [
                'non-negative',
                '1',
                'disjoint'
            ]
        },
        {
            'id': 2,
            'name': 'Conditional Probability & Independence',
            'content': 'How is the conditional probability P(A | B) defined, and what condition makes events A and B independent?',
            'completionCount': 0,
            'updatedAt': '2026-11-21T00:00:00Z',
            'expectedKeywords': [
                'intersection',
                'p(b)',
                'p(a)'
            ]
        },
        {
            'id': 3,
            'name': 'Bayes\' Theorem',
            'content': 'Write Bayes\' theorem for P(A | B) in terms of P(B | A), P(A), and P(B).',
            'completionCount': 0,
            'updatedAt': '2026-11-21T00:00:00Z',
            'expectedKeywords': [
                'p(b|a)',
                'p(a)',
                'p(b)'
            ]
        }
    ];
    const flashcards = ref<FlashcardItem[]>( DEFAULT_DECK );
    const currentIndex = ref( 0 );
    const userAnswer = ref( '' );
    const lastAttempt = ref( '' );
    const isStickyChatOpen = ref( false );
    const feedbackBanner = ref<{
        'type': 'success' | 'error';
        'text': string;
    } | null>( null );
    const completedCount = computed( () => Math.min( currentIndex.value, flashcards.value.length ) );
    const isCompleted = computed( () => completedCount.value >= flashcards.value.length );
    const currentCard = computed( () => flashcards.value[currentIndex.value] ?? null );
    const deckProgress = computed( () => {
        if ( flashcards.value.length === 0 ) {
            return 0;
        }

        return Math.round( ( completedCount.value / flashcards.value.length ) * 100 );
    } );
    const progressColor = computed( () => {
        if ( deckProgress.value >= 100 ) {
            return 'success';
        }

        if ( deckProgress.value > 0 ) {
            return 'primary';
        }

        return 'surface-variant';
    } );

    const evaluateAnswer = ( rawAnswer: string, card: FlashcardItem ): boolean => {
        const normalized = rawAnswer.trim().toLowerCase();

        if ( normalized.length < 2 ) {
            return false;
        }

        const matchedCount = card.expectedKeywords.filter( kw => normalized.includes( kw.toLowerCase() ) ).length;

        return matchedCount >= Math.max( 1, Math.ceil( card.expectedKeywords.length / 2 ) );
    };

    const advanceToNextCard = () => {
        feedbackBanner.value = null;
        isStickyChatOpen.value = false;
        userAnswer.value = '';
        lastAttempt.value = '';
        currentIndex.value++;
    };

    const handleCheckAnswer = () => {
        const card = currentCard.value;

        if ( !card || !userAnswer.value.trim() ) {
            return;
        }

        const attempt = userAnswer.value.trim();

        if ( evaluateAnswer( attempt, card ) ) {
            feedbackBanner.value = {
                'type': 'success',
                'text': 'Correct! Moving to the next card...'
            };
            setTimeout( () => {
                advanceToNextCard();
            }, 900 );
        } else {
            lastAttempt.value = attempt;
            feedbackBanner.value = {
                'type': 'error',
                'text': 'Not quite. Ask the AI below about this question, then click Next Card when ready.'
            };
            isStickyChatOpen.value = true;
        }
    };

    const openStickyChatForHelp = () => {
        if ( !currentCard.value ) {
            return;
        }

        lastAttempt.value = userAnswer.value.trim();
        feedbackBanner.value = null;
        isStickyChatOpen.value = true;
    };

    const restartDeck = () => {
        currentIndex.value = 0;
        userAnswer.value = '';
        lastAttempt.value = '';
        isStickyChatOpen.value = false;
        feedbackBanner.value = null;
    };
</script>

<template>
    <div class="student-mode d-flex flex-column flex-grow-1 w-100">
        <div class="d-flex align-center justify-space-between w-100 mb-4 ga-4">
            <div class="d-flex align-center ga-3">
                <v-btn
                    aria-label="Back to Tech Tree"
                    color="on-surface"
                    density="comfortable"
                    icon="mdi-arrow-left"
                    title="Back to Tech Tree"
                    to="/techtree"
                    variant="outlined"
                />

                <div>
                    <div class="text-caption text-medium-emphasis">
                        Student Mode
                    </div>
                    <h1>
                        {{ props.chatName }}
                    </h1>
                </div>
            </div>

            <div class="progress-block mr-6">
                <div class="d-flex align-baseline justify-space-between ga-3 mb-1">
                    <span class="text-caption text-medium-emphasis">
                        Progress
                    </span>
                    <span class="text-body-2 font-weight-medium text-medium-emphasis">
                        {{ completedCount }} / {{ flashcards.length }}
                    </span>
                </div>

                <v-progress-linear
                    :chunk-gap="0"
                    :color="progressColor"
                    height="4"
                    :model-value="deckProgress"
                    rounded
                    :stop-indicator="false"
                />
            </div>
        </div>

        <div
            v-if="isCompleted"
            class="d-flex flex-column align-center justify-center flex-grow-1"
        >
            <v-sheet
                class="surface-card pa-6 text-center"
                max-width="480"
                rounded="lg"
                width="100%"
            >
                <v-icon
                    class="mb-3"
                    color="success"
                    icon="mdi-check-circle"
                    size="48"
                />

                <h2 class="text-h5 font-weight-bold mb-2">
                    Completed
                </h2>

                <p class="text-body-2 text-medium-emphasis mb-6">
                    You completed all {{ flashcards.length }} flashcards in this session.
                </p>

                <div class="d-flex justify-center ga-2">
                    <v-btn
                        color="medium-emphasis"
                        variant="text"
                        @click="restartDeck"
                    >
                        Restart
                    </v-btn>

                    <v-btn
                        color="on-surface"
                        prepend-icon="mdi-arrow-left"
                        to="/techtree"
                        variant="tonal"
                    >
                        Back to Tech Tree
                    </v-btn>
                </div>
            </v-sheet>
        </div>

        <div
            v-else-if="currentCard && !isStickyChatOpen"
            class="d-flex flex-column align-center justify-center flex-grow-1"
        >
            <div class="w-100" style="max-width: 640px;">
                <v-sheet
                    class="surface-card pa-5 mb-4"
                    rounded="lg"
                >
                    <div class="d-flex align-baseline justify-space-between ga-3 mb-2">
                        <h3 class="text-h6 font-weight-bold">
                            {{ currentCard.name }}
                        </h3>

                        <span class="text-body-2 font-weight-medium text-medium-emphasis">
                            Card {{ currentIndex + 1 }} of {{ flashcards.length }}
                        </span>
                    </div>

                    <p class="text-body-1 mb-0">
                        {{ currentCard.content }}
                    </p>
                </v-sheet>

                <v-alert
                    v-if="feedbackBanner"
                    class="mb-4"
                    closable
                    density="compact"
                    :icon="false"
                    :type="feedbackBanner.type"
                    variant="tonal"
                    @click:close="feedbackBanner = null"
                >
                    {{ feedbackBanner.text }}

                    <template #close="{ props: closeProps }">
                        <v-btn
                            v-bind="closeProps"
                            :color="feedbackBanner.type"
                        />
                    </template>
                </v-alert>

                <v-sheet
                    class="surface-card pa-5"
                    rounded="lg"
                >
                    <v-textarea
                        v-model="userAnswer"
                        auto-grow
                        autofocus
                        density="compact"
                        hide-details
                        label="Your answer"
                        rows="3"
                        variant="outlined"
                        @keydown.ctrl.enter="handleCheckAnswer"
                    />

                    <div class="d-flex justify-end ga-2 mt-4">
                        <v-btn
                            color="medium-emphasis"
                            variant="text"
                            @click="openStickyChatForHelp"
                        >
                            Ask AI
                        </v-btn>

                        <v-btn
                            color="on-surface"
                            :disabled="!userAnswer.trim()"
                            variant="tonal"
                            @click="handleCheckAnswer"
                        >
                            Check Answer
                        </v-btn>
                    </div>
                </v-sheet>
            </div>
        </div>

        <div
            v-else-if="currentCard && isStickyChatOpen"
            class="sticky-chat-layout d-flex flex-column flex-grow-1 overflow-y-auto"
        >
            <div class="sticky-question-wrapper pb-3">
                <v-sheet
                    class="surface-card mx-auto pa-5"
                    max-width="920"
                    rounded="lg"
                >
                    <div class="d-flex align-start justify-space-between ga-4">
                        <div class="flex-grow-1">
                            <div class="text-caption text-medium-emphasis mb-1">
                                {{ currentCard.name }} · Card {{ currentIndex + 1 }} of {{ flashcards.length }}
                            </div>

                            <p class="text-body-1 font-weight-medium mb-1">
                                {{ currentCard.content }}
                            </p>

                            <p
                                v-if="lastAttempt"
                                class="text-body-2 text-medium-emphasis mb-0"
                            >
                                Your answer: {{ lastAttempt }}
                            </p>
                        </div>

                        <v-btn
                            class="flex-shrink-0"
                            color="on-surface"
                            append-icon="mdi-arrow-right"
                            variant="tonal"
                            @click="advanceToNextCard"
                        >
                            Next Card
                        </v-btn>
                    </div>

                    <v-alert
                        v-if="feedbackBanner"
                        class="mt-3"
                        closable
                        density="compact"
                        :icon="false"
                        :type="feedbackBanner.type"
                        variant="tonal"
                        @click:close="feedbackBanner = null"
                    >
                        {{ feedbackBanner.text }}

                        <template #close="{ props: closeProps }">
                            <v-btn
                                v-bind="closeProps"
                                :color="feedbackBanner.type"
                            />
                        </template>
                    </v-alert>
                </v-sheet>
            </div>

            <div class="chat-slot flex-grow-1 d-flex flex-column">
                <ChatView :id="chatId" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .student-mode {
        min-height: 0;
    }

    .progress-block {
        width: 180px;
    }

    .surface-card {
        background-color: rgb(var(--v-theme-surface));
        border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    }

    .sticky-question-wrapper {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: rgb(var(--v-theme-background));
    }

    .chat-slot {
        min-height: 0;
    }
</style>
