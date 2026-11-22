import {
    parseAndValidateTechTree,
    toBulkCreatePayload
} from '../techtree-validator.ts';
import assert from 'node:assert/strict';
import test from 'node:test';

const makeValidTree = () => ( {
    'subject': 'Linear Algebra',
    'subtopics': [
        {
            'id': 0,
            'name': 'Vectors & Spaces',
            'layer': 0
        },
        {
            'id': 1,
            'name': 'Matrices & Rank',
            'layer': 1
        },
        {
            'id': 2,
            'name': 'Linear Maps',
            'layer': 1
        },
        {
            'id': 3,
            'name': 'Determinants',
            'layer': 2
        },
        {
            'id': 4,
            'name': 'Eigenvalues',
            'layer': 2
        },
        {
            'id': 5,
            'name': 'Diagonalization',
            'layer': 3
        }
    ],
    'edges': [
        {
            'from': 0,
            'to': 1
        },
        {
            'from': 0,
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
            'from': 3,
            'to': 5
        },
        {
            'from': 4,
            'to': 5
        }
    ]
} );

test( 'parses valid JSON wrapped in markdown fences and remaps tempIds to 1-based', () => {
    const raw = `\`\`\`json\n${ JSON.stringify( makeValidTree() ) }\n\`\`\``;
    const tree = parseAndValidateTechTree( raw );

    assert.equal( tree.subtopics.length, 6 );
    assert.equal( tree.edges.length, 6 );

    const payload = toBulkCreatePayload( 42, tree );

    assert.equal( payload.subjectId, 42 );
    assert.deepEqual(
        payload.subtopics.map( st => st.tempId ),
        [
            1,
            2,
            3,
            4,
            5,
            6
        ]
    );
    assert.equal( payload.edges[0].from, 1 );
    assert.equal( payload.edges[0].to, 2 );
} );

test( 'rejects subtopic names longer than 22 characters', () => {
    const bad = makeValidTree();

    bad.subtopics[1].name = 'This Title Exceeds Twenty Two Chars';
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /3 to 22 characters/
    );
} );

test( 'rejects non-ASCII characters in subtopic names', () => {
    const bad = makeValidTree();

    bad.subtopics[1].name = 'Probability Ω';
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /printable ASCII/
    );
} );

test( 'rejects edges that skip layers', () => {
    const bad = makeValidTree();

    bad.edges.push( {
        'from': 0,
        'to': 3
    } );
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /skips layers/
    );
} );

test( 'rejects backward or cyclic edges', () => {
    const bad = makeValidTree();

    bad.edges.push( {
        'from': 5,
        'to': 0
    } );
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /strictly downward/
    );
} );

test( 'rejects more than 3 subtopics in a single layer', () => {
    const bad = makeValidTree();

    bad.subtopics.push(
        {
            'id': 6,
            'name': 'Nullspace',
            'layer': 1
        },
        {
            'id': 7,
            'name': 'Row Space',
            'layer': 1
        }
    );
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /exceeds maximum of 3/
    );
} );

test( 'rejects fewer than 6 subtopics', () => {
    const bad = makeValidTree();

    bad.subtopics = bad.subtopics.slice( 0, 5 );
    bad.edges = bad.edges.slice( 0, 4 );
    assert.throws(
        () => parseAndValidateTechTree( JSON.stringify( bad ) ),
        /Expected 6 to 11 subtopics/
    );
} );
