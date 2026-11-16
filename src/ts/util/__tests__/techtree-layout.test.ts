import type {
    ModelSubtopic
} from '../../types/api';
import assert from 'node:assert/strict';
import {
    buildTechTreeGraph
} from '../techtree-layout';
import test from 'node:test';

test( 'unfolds subtopics and creates edges', () => {
    const child: ModelSubtopic = {
        'id': 2,
        'name': 'Child Topic',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parent: ModelSubtopic = {
        'id': 1,
        'name': 'Parent Topic',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ child ]
    };
    const result = buildTechTreeGraph( [ parent ] );

    assert.equal( result.edges.length, 1 );
    assert.equal( result.edges[0].source, '1' );
    assert.equal( result.edges[0].target, '2' );
    assert.equal( result.nodes.length, 2 );
    assert.deepEqual(
        result.nodes.find( n => n.id === '1' )?.position,
        {
            'x': 0,
            'y': 0
        }
    );
    assert.deepEqual(
        result.nodes.find( n => n.id === '2' )?.position,
        {
            'x': 0,
            'y': 130
        }
    );
} );

test( 'deduplicates shared child with two parents', () => {
    const sharedChild: ModelSubtopic = {
        'id': 3,
        'name': 'Shared Child',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parentA: ModelSubtopic = {
        'id': 1,
        'name': 'Parent A',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ sharedChild ]
    };
    const parentB: ModelSubtopic = {
        'id': 2,
        'name': 'Parent B',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ sharedChild ]
    };
    const result = buildTechTreeGraph( [
        parentA,
        parentB,
        sharedChild
    ] );

    assert.equal( result.edges.length, 2 );
    assert.equal( result.edges[0].target, '3' );
    assert.equal( result.edges[1].target, '3' );
    assert.equal( result.nodes.length, 3 );
    assert.deepEqual(
        result.nodes.find( n => n.id === '1' )?.position,
        {
            'x': -120,
            'y': 0
        }
    );
    assert.deepEqual(
        result.nodes.find( n => n.id === '2' )?.position,
        {
            'x': 120,
            'y': 0
        }
    );
    assert.deepEqual(
        result.nodes.find( n => n.id === '3' )?.position,
        {
            'x': 0,
            'y': 130
        }
    );
} );

test( 'keeps children when full subtopic comes after stub', () => {
    const grandchild: ModelSubtopic = {
        'id': 3,
        'name': 'Grandchild',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const childStub: ModelSubtopic = {
        'id': 2,
        'name': 'Child Stub',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const parent: ModelSubtopic = {
        'id': 1,
        'name': 'Parent',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ childStub ]
    };
    const fullChild: ModelSubtopic = {
        'id': 2,
        'name': 'Full Child',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ grandchild ]
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
    assert.equal( result.nodes.length, 3 );
    assert.equal( result.nodes.find( n => n.id === '1' )?.position.y, 0 );
    assert.equal( result.nodes.find( n => n.id === '2' )?.position.y, 130 );
    assert.equal( result.nodes.find( n => n.id === '3' )?.position.y, 260 );
    assert.equal( ( result.nodes.find( n => n.id === '2' )?.data as {
        'subtopic': ModelSubtopic
    } ).subtopic.name, 'Full Child' );
} );

test( 'handles circular dependencies', () => {
    const nodeB: ModelSubtopic = {
        'id': 2,
        'name': 'Node B',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const nodeA: ModelSubtopic = {
        'id': 1,
        'name': 'Node A',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ nodeB ]
    };

    nodeB.children = [ nodeA ];

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

test( 'places node below all prerequisites', () => {
    const nodeC: ModelSubtopic = {
        'id': 3,
        'name': 'Final Topic',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const nodeB: ModelSubtopic = {
        'id': 2,
        'name': 'Intermediate Topic',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [ nodeC ]
    };
    const nodeA: ModelSubtopic = {
        'id': 1,
        'name': 'Root Topic',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z',
        'children': [
            nodeB,
            nodeC
        ]
    };
    const result = buildTechTreeGraph( [ nodeA ] );

    assert.equal( result.nodes.length, 3 );
    assert.equal( result.nodes.find( n => n.id === '1' )?.position.y, 0 );
    assert.equal( result.nodes.find( n => n.id === '2' )?.position.y, 130 );
    assert.equal( result.nodes.find( n => n.id === '3' )?.position.y, 260 );
} );
