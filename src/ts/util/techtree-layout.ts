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
    const subtopicMap = new Map<number, ModelSubtopic>();
    const childrenMap = new Map<number, number[]>();
    const inDegree = new Map<number, number>();
    const edgeSet = new Set<string>();

    const visit = ( item: ModelSubtopic ) => {
        const id = item.id;
        const children = item.children;

        if ( !subtopicMap.has( id ) || ( children != null && children.length > 0 ) ) {
            subtopicMap.set( id, item );
        }

        if ( !inDegree.has( id ) ) {
            inDegree.set( id, 0 );
        }

        if ( children != null && children.length > 0 && !childrenMap.has( id ) ) {
            const childIds: number[] = [];

            childrenMap.set( id, childIds );

            for ( const child of children ) {
                const edgeId = `e${ id }-${ child.id }`;

                if ( !edgeSet.has( edgeId ) ) {
                    edgeSet.add( edgeId );
                    childIds.push( child.id );
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

                visit( child );
            }
        }
    };

    for ( const item of items ) {
        visit( item );
    }

    const depth = new Map<number, number>();
    const queue: number[] = [];

    inDegree.forEach( ( deg, id ) => {
        if ( deg === 0 ) {
            depth.set( id, 0 );
            queue.push( id );
        }
    } );

    while ( queue.length > 0 ) {
        const currentId = queue.shift()!;
        const currentDepth = depth.get( currentId ) ?? 0;

        for ( const childId of childrenMap.get( currentId ) ?? [] ) {
            const nextDepth = Math.max( depth.get( childId ) ?? 0, currentDepth + 1 );

            depth.set( childId, nextDepth );
            const remaining = ( inDegree.get( childId ) ?? 1 ) - 1;

            inDegree.set( childId, remaining );

            if ( remaining === 0 ) {
                queue.push( childId );
            }
        }
    }

    const rows = new Map<number, number[]>();

    for ( const id of subtopicMap.keys() ) {
        const d = depth.get( id ) ?? 0;
        const row = rows.get( d ) ?? [];

        row.push( id );
        rows.set( d, row );
    }

    const colSpacing = 240;
    const rowSpacing = 130;

    rows.forEach( ( rowIds, rowDepth ) => {
        const rowWidth = ( rowIds.length - 1 ) * colSpacing;

        rowIds.forEach( ( id, index ) => {
            const subtopic = subtopicMap.get( id )!;
            const xOffset = ( index * colSpacing ) - ( rowWidth / 2 );

            nodes.push( {
                'id': String( id ),
                'type': 'tech-node',
                'position': {
                    'x': xOffset,
                    'y': rowDepth * rowSpacing
                },
                'data': {
                    'subtopic': subtopic
                }
            } );
        } );
    } );

    return {
        nodes,
        edges
    };
};
