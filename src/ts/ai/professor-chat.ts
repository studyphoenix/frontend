import {
    type ParsedProfessorTurn,
    type ProfessorPromptContext,
    buildProfessorSystemPrompt,
    parseProfessorResponse
} from '@/ts/prompts/professor-mode';
import type {
    ModelChatMessage
} from '@/ts/types/api';

export interface ProfessorTurnResult extends ParsedProfessorTurn {
    'usedMock': boolean;
}

export type ProfessorLlmClient = (
    systemPrompt: string,
    messages: Array<{
        'role': 'user' | 'assistant';
        'content': string;
    }>
) => Promise<string>;

export const isProfessorMockEnabled = (): boolean => {
    if ( import.meta.env.VITE_MOCK_AI === 'true' || import.meta.env.VITE_BACKENDLESS === 'true' ) {
        return true;
    }

    const hasProxyUrl = Boolean( import.meta.env.VITE_AI_API_URL );
    const hasAnthropicKey = Boolean( import.meta.env.VITE_ANTHROPIC_API_KEY );

    return !hasProxyUrl && !hasAnthropicKey;
};

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

const extractLlmText = ( data: unknown ): string => {
    if ( !data || typeof data !== 'object' ) {
        throw new Error( 'Empty response from AI service.' );
    }

    const record = data as Record<string, unknown>;

    if ( typeof record.text === 'string' ) {
        return record.text;
    }

    if ( Array.isArray( record.content ) ) {
        const textBlock = record.content.find(
            block => block && typeof block === 'object' && ( block as Record<string, unknown> ).type === 'text'
        ) as Record<string, unknown> | undefined;

        if ( textBlock && typeof textBlock.text === 'string' ) {
            return textBlock.text;
        }
    }

    if ( Array.isArray( record.choices ) && record.choices[0] && typeof record.choices[0] === 'object' ) {
        const message = ( record.choices[0] as Record<string, unknown> ).message;

        if ( message && typeof message === 'object' && typeof ( message as Record<string, unknown> ).content === 'string' ) {
            return ( message as Record<string, unknown> ).content as string;
        }
    }

    throw new Error( 'AI response did not contain generated text.' );
};

const callConfiguredProfessorLlm: ProfessorLlmClient = async ( systemPrompt, messages ) => {
    const proxyUrl = import.meta.env.VITE_AI_API_URL as string | undefined;

    if ( proxyUrl ) {
        const res = await fetch( proxyUrl, {
            'method': 'POST',
            'credentials': 'include',
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': JSON.stringify( {
                'system': systemPrompt,
                messages
            } )
        } );

        if ( !res.ok ) {
            throw new Error( `AI proxy request failed (${ res.status }).` );
        }

        return extractLlmText( await res.json() );
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;

    if ( !apiKey ) {
        throw new Error( 'No AI endpoint or API key configured.' );
    }

    const model = ( import.meta.env.VITE_ANTHROPIC_MODEL as string | undefined ) || 'claude-sonnet-4-5-20250929';
    const res = await fetch( 'https://api.anthropic.com/v1/messages', {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        'body': JSON.stringify( {
            model,
            'max_tokens': 1024,
            'system': systemPrompt,
            messages
        } )
    } );

    if ( !res.ok ) {
        throw new Error( `Anthropic API request failed (${ res.status }).` );
    }

    return extractLlmText( await res.json() );
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
    const messages: Array<{
        'role': 'user' | 'assistant';
        'content': string;
    }> = [];

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

    const client = customClient ?? callConfiguredProfessorLlm;
    const raw = await client( systemPrompt, messages );

    return {
        ...parseProfessorResponse( raw ),
        'usedMock': false
    };
};
