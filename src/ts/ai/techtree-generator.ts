import type {
    GeneratedTechTree,
    TechTreeLlmClient,
    TechTreePromptContext
} from '@/ts/types/techtree-generation';
import {
    TECHTREE_GENERATION_SYSTEM_PROMPT,
    buildTechTreeUserPrompt
} from '@/ts/prompts/techtree-generation';
import {
    parseAndValidateTechTree
} from '@/ts/util/techtree-validator';

const getMockTopicsForCourse = ( subjectName: string ): string[] => {
    const lower = subjectName.toLowerCase();

    if ( lower.includes( 'prob' ) || lower.includes( 'stat' ) ) {
        return [
            'Probability Axioms',
            'Discrete Distributions',
            'Continuous Variables',
            'Expectation & Moments',
            'Joint Distributions',
            'Central Limit Theorem',
            'Confidence Intervals',
            'Hypothesis Testing'
        ];
    }

    if ( lower.includes( 'linear' ) || lower.includes( 'algebra' ) ) {
        return [
            'Vectors & Spaces',
            'Linear Systems',
            'Matrix Algebra',
            'Rank & Nullspace',
            'Determinants',
            'Eigenvalues & Modes',
            'Orthogonality',
            'Spectral Theorem'
        ];
    }

    if ( lower.includes( 'algo' ) || lower.includes( 'data' ) ) {
        return [
            'Asymptotic Bounds',
            'Trees & Heaps',
            'Sorting & Search',
            'Graph Traversal',
            'Shortest Paths',
            'Dynamic Programming',
            'Greedy Algorithms',
            'NP-Completeness'
        ];
    }

    return [
        'Core Foundations',
        'Key Definitions',
        'Formal Models',
        'Core Theorems',
        'Applied Methods',
        'Problem Solving',
        'Advanced Analysis',
        'Exam Synthesis'
    ];
};

export const isMockAiEnabled = (): boolean => {
    if ( import.meta.env.VITE_MOCK_AI === 'true' || import.meta.env.VITE_BACKENDLESS === 'true' ) {
        return true;
    }

    const hasProxyUrl = Boolean( import.meta.env.VITE_AI_API_URL );
    const hasAnthropicKey = Boolean( import.meta.env.VITE_ANTHROPIC_API_KEY );

    return !hasProxyUrl && !hasAnthropicKey;
};

export const generateMockTechTreeJson = ( ctx: TechTreePromptContext ): string => {
    const topics = getMockTopicsForCourse( ctx.subjectName );

    return JSON.stringify( {
        'subject': ctx.subjectName.trim() || 'Course',
        'subtopics': [
            {
                'id': 1,
                'name': topics[0],
                'layer': 0
            },
            {
                'id': 2,
                'name': topics[1],
                'layer': 1
            },
            {
                'id': 3,
                'name': topics[2],
                'layer': 1
            },
            {
                'id': 4,
                'name': topics[3],
                'layer': 2
            },
            {
                'id': 5,
                'name': topics[4],
                'layer': 2
            },
            {
                'id': 6,
                'name': topics[5],
                'layer': 2
            },
            {
                'id': 7,
                'name': topics[6],
                'layer': 3
            },
            {
                'id': 8,
                'name': topics[7],
                'layer': 3
            }
        ],
        'edges': [
            {
                'from': 1,
                'to': 2
            },
            {
                'from': 1,
                'to': 3
            },
            {
                'from': 2,
                'to': 4
            },
            {
                'from': 2,
                'to': 5
            },
            {
                'from': 3,
                'to': 5
            },
            {
                'from': 3,
                'to': 6
            },
            {
                'from': 4,
                'to': 7
            },
            {
                'from': 5,
                'to': 7
            },
            {
                'from': 5,
                'to': 8
            },
            {
                'from': 6,
                'to': 8
            }
        ]
    } );
};

const extractLlmText = ( data: unknown ): string => {
    if ( !data || typeof data !== 'object' ) {
        throw new Error( 'Unexpected empty response from AI service.' );
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

const callConfiguredLlm: TechTreeLlmClient = async ( systemPrompt, userPrompt ) => {
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
                'prompt': userPrompt
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
            'messages': [ {
                'role': 'user',
                'content': userPrompt
            } ]
        } )
    } );

    if ( !res.ok ) {
        throw new Error( `Anthropic API request failed (${ res.status }).` );
    }

    return extractLlmText( await res.json() );
};

export const generateTechTree = async (
    ctx: TechTreePromptContext,
    customClient?: TechTreeLlmClient
): Promise<{
    'tree': GeneratedTechTree;
    'usedMock': boolean;
}> => {
    if ( customClient ) {
        const raw = await customClient( TECHTREE_GENERATION_SYSTEM_PROMPT, buildTechTreeUserPrompt( ctx ) );

        return {
            'tree': parseAndValidateTechTree( raw ),
            'usedMock': false
        };
    }

    if ( isMockAiEnabled() ) {
        const rawMock = generateMockTechTreeJson( ctx );

        return {
            'tree': parseAndValidateTechTree( rawMock ),
            'usedMock': true
        };
    }

    const raw = await callConfiguredLlm( TECHTREE_GENERATION_SYSTEM_PROMPT, buildTechTreeUserPrompt( ctx ) );

    return {
        'tree': parseAndValidateTechTree( raw ),
        'usedMock': false
    };
};
