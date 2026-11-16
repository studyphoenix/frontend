import type {
    ModelSubtopic
} from '@/ts/types/api';
import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';

export const useTechTreeStore = defineStore( 'techtree', () => {
    const discrete: ModelSubtopic = {
        'id': 2,
        'name': 'Discrete Distributions',
        'icon': '',
        'progress': 100,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const continuous: ModelSubtopic = {
        'id': 3,
        'name': 'Continuous Variables',
        'icon': '',
        'progress': 60,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const expectation: ModelSubtopic = {
        'id': 4,
        'name': 'Expectation & Variance',
        'icon': '',
        'progress': 25,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const joint: ModelSubtopic = {
        'id': 5,
        'name': 'Joint Distributions',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const clt: ModelSubtopic = {
        'id': 6,
        'name': 'Central Limit Theorem',
        'icon': '',
        'progress': 0,
        'updatedAt': '2026-11-12T00:00:00Z'
    };
    const subtopics = ref<ModelSubtopic[]>( [
        {
            'id': 1,
            'name': 'Probability Axioms',
            'icon': '',
            'progress': 100,
            'updatedAt': '2026-11-12T00:00:00Z',
            'children': [
                discrete,
                continuous
            ]
        },
        {
            ...discrete,
            'children': [ expectation ]
        },
        {
            ...continuous,
            'children': [
                expectation,
                joint
            ]
        },
        {
            ...expectation,
            'children': [ clt ]
        },
        joint,
        clt
    ] );
    const selectedSubtopicId = ref<number | null>( null );

    return {
        subtopics,
        selectedSubtopicId
    };
} );