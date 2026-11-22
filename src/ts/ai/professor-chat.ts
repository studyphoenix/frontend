import type {
    LlmMessage,
    ParsedProfessorTurn,
    ProfessorLlmClient,
    ProfessorPromptContext,
    ProfessorTurnResult
} from '@/ts/types/professor-mode';
import {
    buildProfessorSystemPrompt,
    parseProfessorResponse
} from '@/ts/prompts/professor-mode';
import {
    callLlm,
    isLlmMockEnabled
} from '@/ts/ai/llm-client';
import type {
    ModelChatMessage
} from '@/ts/types/api';

export const isProfessorMockEnabled = (): boolean => isLlmMockEnabled();

const formatMockReply = (
    paragraphs: string[],
    bullets: string[],
    ctx: ProfessorPromptContext
): string => {
    const preferBullets = ctx.settings.answerInBulletPoints;
    const isShort = ctx.settings.answerLength === 'very-short' || ctx.settings.answerLength === 'short';

    if ( preferBullets ) {
        const items = isShort ? bullets.slice( 0, 2 ) : bullets;

        return items.map( b => `• ${ b }` ).join( '\n' );
    }

    return isShort ? paragraphs[0] : paragraphs.join( '\n\n' );
};

export const createProfessorOpeningMessage = ( ctx: ProfessorPromptContext ): string => {
    const materialHint = ctx.assetNames.length > 0
        ? `We have ${ ctx.assetNames.length } material(s) attached (${ ctx.assetNames.join( ', ' ) }) open on the left.`
        : 'Ask questions anytime while I guide you toward understanding checkpoints.';

    return formatMockReply(
        [
            `Welcome to your guided session on ${ ctx.subtopicName }! ${ materialHint }`,
            `Let us start with the core intuition behind ${ ctx.subtopicName }: what do you already know about it, or should I walk through the main idea step by step?`
        ],
        [
            `Topic: ${ ctx.subtopicName } (${ ctx.currentProgress }% progress).`,
            materialHint,
            'Tell me what you already know or click a quick action below to begin.'
        ],
        ctx
    );
};

const countTurnsSinceLastCheckpoint = ( history: ModelChatMessage[] ): number => {
    let count = 0;

    for ( let i = history.length - 1; i >= 0; i-- ) {
        const summary = history[i]?.summary ?? '';

        if ( summary.startsWith( 'Passed checkpoint' ) ) {
            break;
        }

        count += 1;
    }

    return count;
};

const createMilestoneCheckpointTurn = (
    ctx: ProfessorPromptContext,
    leadIn: string
): ParsedProfessorTurn => {
    const reply = formatMockReply(
        [
            leadIn,
            `Milestone Understanding Checkpoint: in your own words (at least one full sentence), how would you explain the core idea of ${ ctx.subtopicName } and why it matters?`
        ],
        [
            leadIn,
            `Milestone checkpoint for ${ ctx.subtopicName }: explain the core concept in your own words.`,
            'Mention why it matters or how its main parts connect.'
        ],
        ctx
    );

    return {
        reply,
        'summary': `Initiated milestone checkpoint for ${ ctx.subtopicName }`.slice( 0, 240 ),
        'isCheckpointPrompt': true,
        'checkpointPassed': false
    };
};

const createMockProfessorTurn = (
    ctx: ProfessorPromptContext,
    history: ModelChatMessage[],
    userMessage: string
): ParsedProfessorTurn => {
    const lower = userMessage.trim().toLowerCase();

    if ( ctx.checkpointActive ) {
        const wordCount = userMessage.trim().split( /\s+/ ).length;

        if ( wordCount >= 5 && userMessage.trim().length >= 25 ) {
            const reply = formatMockReply(
                [
                    `Well explained! You captured the key relationship in ${ ctx.subtopicName } accurately.`,
                    'I have recorded this checkpoint toward your subtopic progress. Ask another question or move on whenever you are ready.'
                ],
                [
                    `Checkpoint passed for ${ ctx.subtopicName }.`,
                    'Your explanation connects the core definition and intuition clearly.',
                    'Progress updated! Ask a follow up question or return to the Tech Tree.'
                ],
                ctx
            );

            return {
                reply,
                'summary': `Passed checkpoint on ${ ctx.subtopicName }`.slice( 0, 240 ),
                'isCheckpointPrompt': false,
                'checkpointPassed': true
            };
        }

        const hintReply = formatMockReply(
            [
                `Good start, though your explanation is a bit brief for ${ ctx.subtopicName }.`,
                'Try writing 1 to 2 complete sentences connecting the main definition with why or when it applies.'
            ],
            [
                'Almost there — expand your explanation slightly.',
                'Include both the main definition and how the pieces relate.',
                'Try again in your own words to complete the checkpoint.'
            ],
            ctx
        );

        return {
            'reply': hintReply,
            'summary': 'Checkpoint attempt needs more detail',
            'isCheckpointPrompt': true,
            'checkpointPassed': false
        };
    }

    const turnsSinceCheckpoint = countTurnsSinceLastCheckpoint( history );

    if ( turnsSinceCheckpoint >= 1 ) {
        if ( lower.includes( 'example' ) ) {
            return createMilestoneCheckpointTurn(
                ctx,
                `Here is a concrete way to picture ${ ctx.subtopicName }: start from the simplest case with small values, verify the rule holds step by step and then generalize.`
            );
        }

        if ( lower.includes( 'simply' ) || lower.includes( 'simple' ) ) {
            return createMilestoneCheckpointTurn(
                ctx,
                `Think of ${ ctx.subtopicName } as breaking a complex rule into one small building block you already know.`
            );
        }

        return createMilestoneCheckpointTurn(
            ctx,
            `Good thinking on ${ ctx.subtopicName }! You have covered enough intuition to pause for a quick milestone check.`
        );
    }

    if ( lower.includes( 'example' ) ) {
        const reply = formatMockReply(
            [
                `Here is a concrete way to picture ${ ctx.subtopicName }: start from the simplest case with small values, verify the rule holds step by step and then generalize.`,
                'Which step in that example feels clearest, and which part should we unpack further?'
            ],
            [
                `Concrete example for ${ ctx.subtopicName }: start with a minimal case.`,
                'Check each assumption before applying the general rule.',
                'Ask if another angle or clarification would help.'
            ],
            ctx
        );

        return {
            reply,
            'summary': `Walked through an example for ${ ctx.subtopicName }`.slice( 0, 240 ),
            'isCheckpointPrompt': false,
            'checkpointPassed': false
        };
    }

    if ( lower.includes( 'simply' ) || lower.includes( 'simple' ) ) {
        const reply = formatMockReply(
            [
                `Think of ${ ctx.subtopicName } as breaking a complex rule into one small building block you already know.`,
                'Once you see what problem that building block solves, the formal notation becomes much easier. Which part should we explore next?'
            ],
            [
                `${ ctx.subtopicName } in plain terms: focus on the problem it solves first.`,
                'Notation just summarizes that core rule concisely.',
                'Ask a follow up question or ask for a concrete example next.'
            ],
            ctx
        );

        return {
            reply,
            'summary': `Simplified explanation of ${ ctx.subtopicName }`.slice( 0, 240 ),
            'isCheckpointPrompt': false,
            'checkpointPassed': false
        };
    }

    const reply = formatMockReply(
        [
            `Great question about ${ ctx.subtopicName }! Connecting "${ userMessage.trim().slice( 0, 60 ) }" back to the fundamentals: focus on what assumptions hold and how each step follows from the previous one.`,
            'Would you like a concrete example or a simpler intuitive explanation next?'
        ],
        [
            `Focusing on ${ ctx.subtopicName }: verify the underlying assumptions first.`,
            'Trace how your question connects to the main definition.',
            'Next step: tell me your takeaway or ask for a concrete example.'
        ],
        ctx
    );

    return {
        reply,
        'summary': `Discussed ${ ctx.subtopicName }`.slice( 0, 240 ),
        'isCheckpointPrompt': false,
        'checkpointPassed': false
    };
};

export const requestProfessorReply = async (
    ctx: ProfessorPromptContext,
    history: ModelChatMessage[],
    userMessage: string,
    customClient?: ProfessorLlmClient
): Promise<ProfessorTurnResult> => {
    if ( !customClient && isProfessorMockEnabled() ) {
        const mockTurn = createMockProfessorTurn( ctx, history, userMessage );

        return {
            ...mockTurn,
            'usedMock': true
        };
    }

    const systemPrompt = buildProfessorSystemPrompt( ctx );
    const messages: LlmMessage[] = [];

    for ( const turn of history ) {
        if ( turn.userMessage.trim() ) {
            messages.push( {
                'role': 'user',
                'content': turn.userMessage
            } );
        }

        if ( turn.modelMessage.trim() ) {
            messages.push( {
                'role': 'assistant',
                'content': turn.modelMessage
            } );
        }
    }

    messages.push( {
        'role': 'user',
        'content': userMessage
    } );

    const raw = customClient
        ? await customClient( systemPrompt, messages )
        : await callLlm( systemPrompt, messages );

    return {
        ...parseProfessorResponse( raw ),
        'usedMock': false
    };
};
