import type {
    LlmMessage
} from '@/ts/types/professor-mode';

export const isLlmMockEnabled = (): boolean => {
    if ( import.meta.env.VITE_MOCK_AI === 'true' || import.meta.env.VITE_BACKENDLESS === 'true' ) {
        return true;
    }

    const hasProxyUrl = Boolean( import.meta.env.VITE_AI_API_URL );
    const hasAnthropicKey = Boolean( import.meta.env.VITE_ANTHROPIC_API_KEY );

    return !hasProxyUrl && !hasAnthropicKey;
};

export const extractLlmText = ( data: unknown ): string => {
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

export const callLlm = async (
    systemPrompt: string,
    messages: LlmMessage[],
    maxTokens = 1024
): Promise<string> => {
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
            'max_tokens': maxTokens,
            'system': systemPrompt,
            messages
        } )
    } );

    if ( !res.ok ) {
        throw new Error( `Anthropic API request failed (${ res.status }).` );
    }

    return extractLlmText( await res.json() );
};
