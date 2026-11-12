import type {
    Edge,
    Node
} from '@vue-flow/core';
import {
    MarkerType
} from '@vue-flow/core';
import type {
    ModelSubtopic
} from '@/ts/types/api';

export interface TechTreeGraph {
    'nodes': Node[];
    'edges': Edge[];
}

export const buildTechTreeGraph = ( items: ModelSubtopic[] ): TechTreeGraph => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    // Internal Graph Representation
    const subtopicMap = new Map<number, ModelSubtopic>();
    const childrenMap = new Map<number, number[]>();
    const inDegree = new Map<number, number>();
    const edgeSet = new Set<string>();

    const visit = ( item: ModelSubtopic ) => {
        const id = item.id;
        const subtopics = item.subtopics;

        // Save topic, upgrading if a copy with children arrives
        if ( !subtopicMap.has( id ) || ( subtopics != null && subtopics.length > 0 ) ) {
            subtopicMap.set( id, item );
        }

        if ( !inDegree.has( id ) ) {
            inDegree.set( id, 0 );
        }

        // Process children if this node has any and we haven't expanded it yet
        if ( subtopics != null && subtopics.length > 0 && !childrenMap.has( id ) ) {
            const childIds: number[] = [];

            childrenMap.set( id, childIds );

            for ( const child of subtopics ) {
                childIds.push( child.id );

                const edgeId = `e${ id }-${ child.id }`;

                if ( !edgeSet.has( edgeId ) ) {
                    edgeSet.add( edgeId );
                    edges.push( {
                        'id': edgeId,
                        'source': String( id ),
                        'target': String( child.id ),
                        'markerEnd': {
                            'type': MarkerType.ArrowClosed
                        }
                    } );
                    inDegree.set( child.id, ( inDegree.get( child.id ) ?? 0 ) + 1 );
                }

                // Recursively visit child in case subtopics are deeply nested
                visit( child );
            }
        }
    };

    for ( const item of items ) {
        visit( item );
    }

    // TODO: Next step is computing row numbers and (x, y) coordinates

    return {
        nodes,
        edges
    };
};
