import type {
    ModelSettings
} from '@/ts/types/api';

export interface ProfessorPromptContext {
    'subtopicName': string;
    'chatName': string;
    'assetNames': string[];
    'settings': ModelSettings;
    'currentProgress': number;
    'checkpointActive': boolean;
}

export interface ParsedProfessorTurn {
    'reply': string;
    'summary': string;
    'isCheckpointPrompt': boolean;
    'checkpointPassed': boolean;
}

const LENGTH_GUIDANCE: Record<ModelSettings['answerLength'], string> = {
    'very-short': 'Keep responses ultra concise (1 to 2 short sentences).',
    'short': 'Keep responses brief (around 3 to 4 sentences).',
    'default': 'Use balanced, clear explanations (1 to 2 concise paragraphs).',
    'long': 'Provide detailed explanations with worked steps or intuition.',
    'very-long': 'Provide thorough, in-depth academic explanations with examples.'
};

export const buildProfessorSystemPrompt = ( ctx: ProfessorPromptContext ): string => {
    const lengthRule = LENGTH_GUIDANCE[ctx.settings.answerLength] ?? LENGTH_GUIDANCE.default;
    const formatRule = ctx.settings.answerInBulletPoints
        ? 'Format key takeaways using concise bullet points.'
        : 'Write in clear, well-structured prose paragraphs.';
    const materialsLine = ctx.assetNames.length > 0
        ? `Attached study materials: ${ ctx.assetNames.join( ', ' ) }.`
        : 'No study materials are attached yet; teach from core principles.';
    const checkpointLine = ctx.checkpointActive
        ? 'An understanding checkpoint is currently active: evaluate the student explanation fairly. Set "checkpointPassed": true if they demonstrate core understanding, or false with a constructive hint.'
        : 'Guide the student step by step. Once they reach a concept milestone, proactively initiate an understanding checkpoint asking them to explain the concept in their own words ("isCheckpointPrompt": true) instead of waiting for them to request one.';

    return [
        `You are Professor, a supportive university tutor in StudyPhoenix leading a guided session on "${ ctx.subtopicName }" (session "${ ctx.chatName }", current progress ${ ctx.currentProgress }%).`,
        materialsLine,
        'Pedagogy rules:',
        '- Lead the session proactively rather than acting like a passive search engine.',
        '- Ask guiding questions so the student actively reasons through the topic.',
        `- ${ lengthRule }`,
        `- ${ formatRule }`,
        `- ${ checkpointLine }`,
        'Respond ONLY with valid JSON matching this schema:',
        '{',
        '  "reply": "<message shown to the student>",',
        '  "summary": "<short <= 120 char summary of this turn>",',
        '  "isCheckpointPrompt": false,',
        '  "checkpointPassed": false',
        '}'
    ].join( '\n' );
};

export const parseProfessorResponse = ( rawText: string ): ParsedProfessorTurn => {
    const trimmed = rawText.trim();
    const fenceMatch = trimmed.match( /^```(?:json)?\s*([\s\S]*?)\s*```$/i );
    const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

    try {
        const parsed = JSON.parse( candidate ) as Record<string, unknown>;

        if ( parsed && typeof parsed.reply === 'string' && parsed.reply.trim() ) {
            const rawSummary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';

            return {
                'reply': parsed.reply.trim(),
                'summary': ( rawSummary || parsed.reply.trim() ).slice( 0, 240 ),
                'isCheckpointPrompt': Boolean( parsed.isCheckpointPrompt ),
                'checkpointPassed': Boolean( parsed.checkpointPassed )
            };
        }
    } catch {
        // Fallback to plain text response when model does not emit JSON
    }

    const fallback = trimmed || 'Let us continue exploring this topic together. What part would you like to focus on next?';

    return {
        'reply': fallback,
        'summary': fallback.slice( 0, 240 ),
        'isCheckpointPrompt': false,
        'checkpointPassed': false
    };
};
