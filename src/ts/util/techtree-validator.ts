import type {
    BulkCreateEdge,
    BulkCreateSubtopicItem,
    BulkCreateTechTreeRequest,
    GeneratedEdge,
    GeneratedSubtopic,
    GeneratedTechTree
} from '@/ts/types/techtree-generation';

const MIN_SUBTOPICS = 6;
const MAX_SUBTOPICS = 11;
const MIN_LAYERS = 3;
const MAX_LAYERS = 5;
const MAX_PER_LAYER = 3;
const MIN_NAME_LEN = 3;
const MAX_NAME_LEN = 22;

export const stripJsonFences = ( raw: string ): string => {
    const trimmed = raw.trim();
    const fenceMatch = trimmed.match( /^```(?:json)?\s*([\s\S]*?)\s*```$/i );

    if ( fenceMatch ) {
        return fenceMatch[1].trim();
    }

    return trimmed;
};

const isPrintableAscii = ( text: string ): boolean => ( /^[\x20-\x7E]+$/ ).test( text );

export const parseAndValidateTechTree = ( rawOutput: string ): GeneratedTechTree => {
    let parsed: unknown;

    try {
        parsed = JSON.parse( stripJsonFences( rawOutput ) );
    } catch {
        throw new Error( 'AI output is not valid JSON.' );
    }

    if ( !parsed || typeof parsed !== 'object' ) {
        throw new Error( 'AI output must be a JSON object.' );
    }

    const record = parsed as Record<string, unknown>;

    if ( !Array.isArray( record.subtopics ) || !Array.isArray( record.edges ) ) {
        throw new Error( 'AI output must include "subtopics" and "edges" arrays.' );
    }

    if ( record.subtopics.length < MIN_SUBTOPICS || record.subtopics.length > MAX_SUBTOPICS ) {
        throw new Error( `Expected ${ MIN_SUBTOPICS } to ${ MAX_SUBTOPICS } subtopics, got ${ record.subtopics.length }.` );
    }

    const subtopics: GeneratedSubtopic[] = [];
    const nodeById = new Map<number, GeneratedSubtopic>();
    const layerCounts = new Map<number, number>();

    for ( const rawNode of record.subtopics ) {
        if ( !rawNode || typeof rawNode !== 'object' ) {
            throw new Error( 'Each subtopic must be an object.' );
        }

        const item = rawNode as Record<string, unknown>;
        const id = item.id;
        const name = typeof item.name === 'string' ? item.name.trim() : '';
        const layer = item.layer;

        if ( typeof id !== 'number' || !Number.isInteger( id ) || id < 0 ) {
            throw new Error( 'Each subtopic must have a non-negative integer id.' );
        }

        if ( nodeById.has( id ) ) {
            throw new Error( `Duplicate subtopic id ${ id }.` );
        }

        if ( name.length < MIN_NAME_LEN || name.length > MAX_NAME_LEN ) {
            throw new Error( `Subtopic "${ name }" must be ${ MIN_NAME_LEN } to ${ MAX_NAME_LEN } characters.` );
        }

        if ( !isPrintableAscii( name ) ) {
            throw new Error( `Subtopic "${ name }" must contain only printable ASCII characters.` );
        }

        if ( typeof layer !== 'number' || !Number.isInteger( layer ) || layer < 0 || layer >= MAX_LAYERS ) {
            throw new Error( `Subtopic "${ name }" has invalid layer ${ String( layer ) }.` );
        }

        const node: GeneratedSubtopic = {
            id,
            name,
            layer
        };

        subtopics.push( node );
        nodeById.set( id, node );

        const nextCount = ( layerCounts.get( layer ) ?? 0 ) + 1;

        if ( nextCount > MAX_PER_LAYER ) {
            throw new Error( `Layer ${ layer } exceeds maximum of ${ MAX_PER_LAYER } subtopics.` );
        }

        layerCounts.set( layer, nextCount );
    }

    if ( layerCounts.size < MIN_LAYERS || layerCounts.size > MAX_LAYERS ) {
        throw new Error( `Expected ${ MIN_LAYERS } to ${ MAX_LAYERS } layers, got ${ layerCounts.size }.` );
    }

    const sortedLayers = Array.from( layerCounts.keys() ).sort( ( a, b ) => a - b );

    for ( let i = 0; i < sortedLayers.length; i++ ) {
        if ( sortedLayers[i] !== i ) {
            throw new Error( `Layers must be contiguous starting at 0 (missing layer ${ i }).` );
        }
    }

    const edges: GeneratedEdge[] = [];
    const seenEdges = new Set<string>();

    for ( const rawEdge of record.edges ) {
        if ( !rawEdge || typeof rawEdge !== 'object' ) {
            throw new Error( 'Each edge must be an object.' );
        }

        const item = rawEdge as Record<string, unknown>;
        const from = item.from;
        const to = item.to;

        if ( typeof from !== 'number' || typeof to !== 'number' ) {
            throw new Error( 'Each edge must specify numeric "from" and "to" ids.' );
        }

        const fromNode = nodeById.get( from );
        const toNode = nodeById.get( to );

        if ( !fromNode || !toNode ) {
            throw new Error( `Edge references unknown subtopic id (${ from } -> ${ to }).` );
        }

        if ( from === to ) {
            throw new Error( `Self-loop edge on subtopic ${ from } is not allowed.` );
        }

        if ( toNode.layer <= fromNode.layer ) {
            throw new Error( `Edge ${ from } -> ${ to } must go strictly downward to avoid cycles.` );
        }

        if ( toNode.layer !== fromNode.layer + 1 ) {
            throw new Error( `Edge ${ from } -> ${ to } skips layers (${ fromNode.layer } -> ${ toNode.layer }).` );
        }

        const edgeKey = `${ from }->${ to }`;

        if ( seenEdges.has( edgeKey ) ) {
            throw new Error( `Duplicate edge ${ edgeKey }.` );
        }

        seenEdges.add( edgeKey );
        edges.push( {
            from,
            to
        } );
    }

    return {
        'subject': typeof record.subject === 'string' && record.subject.trim()
            ? record.subject.trim()
            : 'Generated Subject',
        subtopics,
        edges
    };
};

export const toBulkCreatePayload = (
    subjectId: number,
    tree: GeneratedTechTree
): BulkCreateTechTreeRequest => {
    const idMap = new Map<number, number>();
    const subtopics: BulkCreateSubtopicItem[] = tree.subtopics.map( ( st, idx ) => {
        const tempId = idx + 1;

        idMap.set( st.id, tempId );

        return {
            tempId,
            'name': st.name,
            'icon': 'mdi-sitemap'
        };
    } );
    const edges: BulkCreateEdge[] = tree.edges.map( edge => ( {
        'from': idMap.get( edge.from )!,
        'to': idMap.get( edge.to )!
    } ) );

    return {
        subjectId,
        subtopics,
        edges
    };
};
