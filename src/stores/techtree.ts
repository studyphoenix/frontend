import type {
    ModelSubject,
    ModelSubtopic
} from '@/ts/types/api';
import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

const createSampleSubtopics = (): ModelSubtopic[] => {
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

    return [
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
    ];
};

export const useTechTreeStore = defineStore( 'techtree', () => {
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const subjects = ref<ModelSubject[]>( [] );
    const subtopics = ref<ModelSubtopic[]>( [] );
    const selectedSubtopicId = ref<number | null>( null );
    const loading = ref( false );
    const error = ref<string | null>( null );

    const fetchSubjects = async () => {
        if ( isBackendless ) {
            subjects.value = [ {
                'id': 1,
                'name': 'Probability & Statistics',
                'icon': 'mdi-chart-bell-curve',
                'updatedAt': '2026-11-12T00:00:00Z'
            } ];

            return;
        }

        error.value = null;

        try {
            const response = await request.get( '/subjects/search' );
            const data = await response.json();

            subjects.value = Array.isArray( data ) ? data : [];
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to load subjects';
            subjects.value = [];
        }
    };

    const fetchTechTree = async ( subjectId: number ) => {
        if ( isBackendless ) {
            subtopics.value = createSampleSubtopics();

            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await request.get( `/subjects/techtree/${ subjectId }` );
            const data = await response.json();

            subtopics.value = Array.isArray( data ) ? data : [];
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to load tech tree';
            subtopics.value = [];
        } finally {
            loading.value = false;
        }
    };

    return {
        subjects,
        subtopics,
        selectedSubtopicId,
        loading,
        error,
        fetchSubjects,
        fetchTechTree
    };
} );
