import type {
    Edge,
    Node
} from '@vue-flow/core';
import type {
    ModelSubtopic
} from '@/ts/types/api';

export interface TechTreeGraph {
    'nodes': Node[];
    'edges': Edge[];
}

const isReachableFromOtherChild = (
    parentId: number,
    targetId: number,
    rawChildrenMap: Map<number, number[]>
): boolean => {
    const directChildren = rawChildrenMap.get( parentId ) ?? [];
    const visited = new Set<number>( [ parentId ] );
    const queue: number[] = [];

    for ( const siblingId of directChildren ) {
        if ( siblingId !== targetId && !visited.has( siblingId ) ) {
            visited.add( siblingId );
            queue.push( siblingId );
        }
    }

    let head = 0;

    while ( head < queue.length ) {
        const currentId = queue[head++];

        for ( const nextId of rawChildrenMap.get( currentId ) ?? [] ) {
            if ( nextId === targetId ) {
                return true;
            }

            if ( !visited.has( nextId ) ) {
                visited.add( nextId );
                queue.push( nextId );
            }
        }
    }

    return false;
};

export const buildTechTreeGraph = ( items: ModelSubtopic[] ): TechTreeGraph => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const subtopicMap = new Map<number, ModelSubtopic>();
    const rawChildrenMap = new Map<number, number[]>();
    const childrenMap = new Map<number, number[]>();
    const parentsMap = new Map<number, number[]>();
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

        if ( children != null && children.length > 0 && !rawChildrenMap.has( id ) ) {
            const childIds: number[] = [];

            rawChildrenMap.set( id, childIds );

            for ( const child of children ) {
                const edgeKey = `${ id }->${ child.id }`;

                if ( !edgeSet.has( edgeKey ) ) {
                    edgeSet.add( edgeKey );
                    childIds.push( child.id );
                }

                visit( child );
            }
        }
    };

    for ( const item of items ) {
        visit( item );
    }

    for ( const [
        parentId,
        rawChildIds
    ] of rawChildrenMap.entries() ) {
        const directChildIds: number[] = [];

        for ( const childId of rawChildIds ) {
            if ( !isReachableFromOtherChild( parentId, childId, rawChildrenMap ) ) {
                directChildIds.push( childId );
                edges.push( {
                    'id': `e${ parentId }-${ childId }`,
                    'source': String( parentId ),
                    'target': String( childId )
                } );
                inDegree.set( childId, ( inDegree.get( childId ) ?? 0 ) + 1 );
                const childParents = parentsMap.get( childId ) ?? [];

                childParents.push( parentId );
                parentsMap.set( childId, childParents );
            }
        }

        childrenMap.set( parentId, directChildIds );
    }

    const depth = new Map<number, number>();
    const queue: number[] = [];

    inDegree.forEach( ( deg, id ) => {
        if ( deg === 0 ) {
            depth.set( id, 0 );
            queue.push( id );
        }
    } );

    let head = 0;

    while ( head < queue.length ) {
        const currentId = queue[head++];
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

    const colSpacing = 260;
    const rowSpacing = 140;
    const nodeX = new Map<number, number>();
    const sortedDepths = Array.from( rows.keys() ).sort( ( a, b ) => a - b );

    for ( const rowDepth of sortedDepths ) {
        const rowIds = rows.get( rowDepth ) ?? [];

        if ( rowDepth > 0 ) {
            const getParentCenterX = ( id: number ): number => {
                const placedParents = ( parentsMap.get( id ) ?? [] ).filter( pid => nodeX.has( pid ) );

                if ( placedParents.length === 0 ) {
                    return 0;
                }

                const sum = placedParents.reduce( ( acc, pid ) => acc + ( nodeX.get( pid ) ?? 0 ), 0 );

                return sum / placedParents.length;
            };

            rowIds.sort( ( a, b ) => getParentCenterX( a ) - getParentCenterX( b ) );
        }

        const rowWidth = ( rowIds.length - 1 ) * colSpacing;

        rowIds.forEach( ( id, index ) => {
            const subtopic = subtopicMap.get( id )!;
            const xOffset = ( index * colSpacing ) - ( rowWidth / 2 );

            nodeX.set( id, xOffset );
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
    }

    return {
        nodes,
        edges
    };
};
