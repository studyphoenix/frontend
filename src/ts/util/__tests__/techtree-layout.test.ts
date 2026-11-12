import type {
    ModelSubtopic
} from '../../types/api';
import assert from 'node:assert/strict';
import {
    buildTechTreeGraph
} from '../techtree-layout';
import test from 'node:test';

test( 'buildTechTreeGraph correctly unfolds subtopics and creates edges', () => {
    const child: ModelSubtopic = {
        'id': 2,
        'name': 'Child Topic',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parent: ModelSubtopic = {
        'id': 1,
        'name': 'Parent Topic',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ child ]
    };
    const result = buildTechTreeGraph( [ parent ] );

    assert.equal( result.edges.length, 1 );
    assert.equal( result.edges[0].source, '1' );
    assert.equal( result.edges[0].target, '2' );
} );

test( 'buildTechTreeGraph handles multi-parent convergence and deduplicates', () => {
    const sharedChild: ModelSubtopic = {
        'id': 3,
        'name': 'Shared Child',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parentA: ModelSubtopic = {
        'id': 1,
        'name': 'Parent A',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ sharedChild ]
    };
    const parentB: ModelSubtopic = {
        'id': 2,
        'name': 'Parent B',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ sharedChild ]
    };
    const result = buildTechTreeGraph( [
        parentA,
        parentB,
        sharedChild
    ] );

    assert.equal( result.edges.length, 2 );
    assert.equal( result.edges[0].target, '3' );
    assert.equal( result.edges[1].target, '3' );
} );

test( 'buildTechTreeGraph upgrades stubs when full node arrives later in list', () => {
    const grandchild: ModelSubtopic = {
        'id': 3,
        'name': 'Grandchild',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    // Child stub embedded inside parent without its subtopics populated
    const childStub: ModelSubtopic = {
        'id': 2,
        'name': 'Child Stub',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parent: ModelSubtopic = {
        'id': 1,
        'name': 'Parent',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ childStub ]
    };
    // Full child arriving later at root level with its grandchild subtopic
    const fullChild: ModelSubtopic = {
        'id': 2,
        'name': 'Full Child',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ grandchild ]
    };
    const result = buildTechTreeGraph( [
        parent,
        fullChild
    ] );

    assert.equal( result.edges.length, 2 );
    assert.deepEqual(
        result.edges.map( e => `${ e.source }->${ e.target }` ),
        [
            '1->2',
            '2->3'
        ]
    );
} );

test( 'buildTechTreeGraph terminates cleanly if circular dependency exists', () => {
    const nodeB: ModelSubtopic = {
        'id': 2,
        'name': 'Node B',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const nodeA: ModelSubtopic = {
        'id': 1,
        'name': 'Node A',
        'icon': '',
        'updatedAt': '2026-11-12T00:00:00Z',
        'subtopics': [ nodeB ]
    };

    nodeB.subtopics = [ nodeA ];

    const result = buildTechTreeGraph( [ nodeA ] );

    assert.equal( result.edges.length, 2 );
    assert.deepEqual(
        result.edges.map( e => `${ e.source }->${ e.target }` ),
        [
            '1->2',
            '2->1'
        ]
    );
} );
