import type {
    ControllerCreatedResponse,
    ModelAsset,
    ModelChat,
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

interface AssetMeta {
    'mediaType': string;
    'icon': string;
    'uploadExt': string;
}

const SUPPORTED_ASSET_TYPES: Record<string, AssetMeta> = {
    'pdf': {
        'mediaType': 'application/pdf',
        'icon': 'mdi-file-pdf-box',
        'uploadExt': '.pdf'
    },
    'png': {
        'mediaType': 'image/png',
        'icon': 'mdi-file-image',
        'uploadExt': '.png'
    },
    'jpg': {
        'mediaType': 'image/jpg',
        'icon': 'mdi-file-image',
        'uploadExt': '.jpg'
    },
    'jpeg': {
        'mediaType': 'image/jpeg',
        'icon': 'mdi-file-image',
        'uploadExt': '.jpg'
    },
    'json': {
        'mediaType': 'application/json',
        'icon': 'mdi-code-json',
        'uploadExt': '.json'
    }
};

const toAsciiName = ( raw: string, fallback: string ): string => {
    const cleaned = raw.replace( /[^\x20-\x7E]/g, '' ).trim();

    if ( cleaned.length < 3 ) {
        return fallback;
    }

    return cleaned.slice( 0, 100 );
};

const patchJson = ( path: string, payload: unknown ): Promise<Response> => {
    const targetUrl = new URL( path, request.getBackendURL() );

    return fetch( targetUrl, {
        'method': 'PATCH',
        'credentials': 'include',
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': JSON.stringify( payload )
    } );
};

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
    const activeSubtopic = ref<ModelSubtopic | null>( null );
    const loading = ref( false );
    const error = ref<string | null>( null );
    const subtopicLoading = ref( false );
    const subtopicError = ref<string | null>( null );

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

    const fetchSubtopicDetails = async ( subtopicId: number ) => {
        subtopicError.value = null;

        if ( isBackendless ) {
            const found = subtopics.value.find( st => st.id === subtopicId ) ?? null;

            activeSubtopic.value = found
                ? {
                    ...found,
                    'chats': found.chats ?? [],
                    'assets': found.assets ?? []
                }
                : null;

            return;
        }

        subtopicLoading.value = true;

        try {
            const response = await request.get( `/subtopics/get/${ subtopicId }` );

            if ( !response.ok ) {
                throw new Error( `Failed to load subtopic (${ response.status })` );
            }

            const data = await response.json() as ModelSubtopic;

            activeSubtopic.value = {
                ...data,
                'chats': Array.isArray( data.chats ) ? data.chats : [],
                'assets': Array.isArray( data.assets ) ? data.assets : []
            };
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to load subtopic details';
        } finally {
            subtopicLoading.value = false;
        }
    };

    const createAndAttachChat = async ( subtopicId: number, name: string, mode: 1 | 2 | 3 ): Promise<ModelChat | null> => {
        const cleanName = toAsciiName( name, 'Study Session' );

        if ( isBackendless ) {
            const mockChat: ModelChat = {
                'id': Date.now(),
                'mode': mode,
                'name': cleanName,
                'updatedAt': new Date().toISOString(),
                'chatMessages': []
            };

            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.chats = [
                    ...activeSubtopic.value.chats ?? [],
                    mockChat
                ];
            }

            return mockChat;
        }

        subtopicError.value = null;

        try {
            const createRes = await request.put(
                '/chats/create',
                JSON.stringify( {
                    'name': cleanName,
                    'mode': mode
                } )
            );

            if ( !createRes.ok ) {
                throw new Error( `Failed to create chat (${ createRes.status })` );
            }

            const created = await createRes.json() as ControllerCreatedResponse;
            const assocRes = await patchJson(
                `/subtopics/associate/chats/${ subtopicId }`,
                [ created.id ]
            );

            if ( !assocRes.ok ) {
                throw new Error( `Failed to attach chat (${ assocRes.status })` );
            }

            await fetchSubtopicDetails( subtopicId );

            return activeSubtopic.value?.chats?.find( c => c.id === created.id ) ?? null;
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to create chat';

            return null;
        }
    };

    const detachChat = async ( subtopicId: number, chatId: number ) => {
        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.chats = ( activeSubtopic.value.chats ?? [] ).filter( c => c.id !== chatId );
            }

            return;
        }

        subtopicError.value = null;

        try {
            const res = await patchJson(
                `/subtopics/deassociate/chats/${ subtopicId }`,
                [ chatId ]
            );

            if ( !res.ok ) {
                throw new Error( `Failed to detach chat (${ res.status })` );
            }

            await fetchSubtopicDetails( subtopicId );
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to remove chat';
        }
    };

    const uploadAndAttachAsset = async ( subtopicId: number, file: File ): Promise<ModelAsset | null> => {
        const ext = file.name.split( '.' ).pop()
            ?.toLowerCase() ?? '';
        const meta = SUPPORTED_ASSET_TYPES[ext];

        if ( !meta ) {
            subtopicError.value = `Unsupported file type ".${ ext }". Supported: PDF, PNG, JPG, JSON`;

            return null;
        }

        const cleanName = toAsciiName( file.name.replace( /\.[^/.]+$/, '' ), 'Uploaded Asset' );

        if ( isBackendless ) {
            const mockAsset: ModelAsset = {
                'id': Date.now(),
                'name': cleanName,
                'mediaType': meta.mediaType,
                'icon': meta.icon,
                'updatedAt': new Date().toISOString()
            };

            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.assets = [
                    ...activeSubtopic.value.assets ?? [],
                    mockAsset
                ];
            }

            return mockAsset;
        }

        subtopicError.value = null;

        try {
            const createRes = await request.put(
                '/assets/create',
                JSON.stringify( {
                    'name': cleanName,
                    'mediaType': meta.mediaType,
                    'icon': meta.icon
                } )
            );

            if ( !createRes.ok ) {
                throw new Error( `Failed to create asset (${ createRes.status })` );
            }

            const created = await createRes.json() as ControllerCreatedResponse;
            const formData = new FormData();

            formData.append( 'file', file, `${ created.id }${ meta.uploadExt }` );
            const uploadUrl = new URL( `/assets/upload/${ created.id }`, request.getBackendURL() );
            const uploadRes = await fetch( uploadUrl, {
                'method': 'PUT',
                'credentials': 'include',
                'body': formData
            } );

            if ( !uploadRes.ok ) {
                throw new Error( `Failed to upload file (${ uploadRes.status })` );
            }

            const assocRes = await patchJson(
                `/subtopics/associate/assets/${ subtopicId }`,
                [ created.id ]
            );

            if ( !assocRes.ok ) {
                throw new Error( `Failed to attach asset (${ assocRes.status })` );
            }

            await fetchSubtopicDetails( subtopicId );

            return activeSubtopic.value?.assets?.find( a => a.id === created.id ) ?? null;
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to upload asset';

            return null;
        }
    };

    const detachAsset = async ( subtopicId: number, assetId: number ) => {
        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.assets = ( activeSubtopic.value.assets ?? [] ).filter( a => a.id !== assetId );
            }

            return;
        }

        subtopicError.value = null;

        try {
            const res = await patchJson(
                `/subtopics/deassociate/assets/${ subtopicId }`,
                [ assetId ]
            );

            if ( !res.ok ) {
                throw new Error( `Failed to detach asset (${ res.status })` );
            }

            await fetchSubtopicDetails( subtopicId );
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to remove asset';
        }
    };

    return {
        subjects,
        subtopics,
        selectedSubtopicId,
        activeSubtopic,
        loading,
        error,
        subtopicLoading,
        subtopicError,
        fetchSubjects,
        fetchTechTree,
        fetchSubtopicDetails,
        createAndAttachChat,
        detachChat,
        uploadAndAttachAsset,
        detachAsset
    };
} );
