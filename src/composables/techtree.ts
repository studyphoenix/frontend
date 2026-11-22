import type {
    ControllerCreatedResponse,
    ModelAsset,
    ModelChat,
    ModelSubtopic
} from '@/ts/types/api';
import type {
    GeneratedTechTree
} from '@/ts/types/techtree-generation';
import {
    createSampleSubtopics
} from './techtree-sample';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';
import {
    toBulkCreatePayload
} from '@/ts/util/techtree-validator';

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

export const useTechTree = () => {
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const subtopics = ref<ModelSubtopic[]>( [] );
    const activeSubtopic = ref<ModelSubtopic | null>( null );
    const loading = ref( false );
    const error = ref<string | null>( null );
    const subtopicLoading = ref( false );
    const subtopicError = ref<string | null>( null );

    const fetchTechTree = async ( subjectId: number ) => {
        if ( isBackendless ) {
            subtopics.value = createSampleSubtopics();

            return;
        }

        loading.value = true;
        error.value = null;

        try {
            const response = await request.get( `/subjects/techtree/get/${ subjectId }` );
            const data = await response.json();

            subtopics.value = Array.isArray( data ) ? data : [];
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to load tech tree';
            subtopics.value = [];
        } finally {
            loading.value = false;
        }
    };

    const createSubtopic = async ( subjectId: number, name: string ): Promise<ModelSubtopic | null> => {
        const cleanName = name.replace( /[^\x20-\x7E]/g, '' ).trim()
            .slice( 0, 22 );

        if ( cleanName.length < 3 ) {
            error.value = 'Subtopic name must be at least 3 ASCII characters.';

            return null;
        }

        error.value = null;

        if ( isBackendless ) {
            const mockSubtopic: ModelSubtopic = {
                'id': Date.now(),
                'name': cleanName,
                'icon': 'mdi-sitemap',
                'progress': 0,
                'updatedAt': new Date().toISOString()
            };

            subtopics.value = [
                ...subtopics.value,
                mockSubtopic
            ];

            return mockSubtopic;
        }

        try {
            const createRes = await request.put(
                '/subtopics/create',
                JSON.stringify( {
                    'name': cleanName,
                    'icon': 'mdi-sitemap',
                    'subject': subjectId,
                    'progress': 0
                } )
            );

            if ( !createRes.ok ) {
                throw new Error( `Failed to create subtopic (${ createRes.status })` );
            }

            const created = await createRes.json() as ControllerCreatedResponse;

            await fetchTechTree( subjectId );

            return subtopics.value.find( st => st.id === created.id ) ?? null;
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to create subtopic';

            return null;
        }
    };

    const fetchSubtopicDetails = async ( subtopicId: number, fallbackSubtopic?: ModelSubtopic | null ) => {
        subtopicError.value = null;

        if ( isBackendless ) {
            const found = fallbackSubtopic ?? subtopics.value.find( st => st.id === subtopicId ) ?? null;

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
            const assocRes = await request.patch(
                `/subtopics/associate/chats/${ subtopicId }`,
                JSON.stringify( [ created.id ] )
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

    const deleteAndRefresh = async ( subtopicId: number, endpoint: string, label: string ) => {
        subtopicError.value = null;

        try {
            const res = await request.deleteRequest( endpoint );

            if ( !res.ok ) {
                throw new Error( `Failed to delete ${ label } (${ res.status })` );
            }

            await fetchSubtopicDetails( subtopicId );
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : `Failed to delete ${ label }`;
        }
    };

    const deleteChat = async ( subtopicId: number, chatId: number ) => {
        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.chats = ( activeSubtopic.value.chats ?? [] ).filter( c => c.id !== chatId );
            }

            return;
        }

        await deleteAndRefresh( subtopicId, `/chats/delete/${ chatId }`, 'chat' );
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

            const assocRes = await request.patch(
                `/subtopics/associate/assets/${ subtopicId }`,
                JSON.stringify( [ created.id ] )
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

    const deleteAsset = async ( subtopicId: number, assetId: number ) => {
        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.assets = ( activeSubtopic.value.assets ?? [] ).filter( a => a.id !== assetId );
            }

            return;
        }

        await deleteAndRefresh( subtopicId, `/assets/delete/${ assetId }`, 'asset' );
    };

    const bulkCreateTechTree = async ( subjectId: number, tree: GeneratedTechTree ): Promise<boolean> => {
        error.value = null;

        if ( isBackendless ) {
            const baseId = Date.now();
            const nodeMap = new Map<number, ModelSubtopic>();

            for ( const [
                idx,
                item
            ] of tree.subtopics.entries() ) {
                nodeMap.set( item.id, {
                    'id': baseId + idx,
                    'name': item.name,
                    'icon': 'mdi-sitemap',
                    'progress': 0,
                    'updatedAt': new Date().toISOString(),
                    'children': []
                } );
            }

            for ( const edge of tree.edges ) {
                const fromNode = nodeMap.get( edge.from );
                const toNode = nodeMap.get( edge.to );

                if ( fromNode && toNode ) {
                    fromNode.children = [
                        ...fromNode.children ?? [],
                        toNode
                    ];
                }
            }

            subtopics.value = Array.from( nodeMap.values() );

            return true;
        }

        try {
            const payload = toBulkCreatePayload( subjectId, tree );
            const res = await request.put( '/subjects/techtree/create', JSON.stringify( payload ) );

            if ( !res.ok ) {
                throw new Error( `Failed to save tech tree (${ res.status })` );
            }

            await fetchTechTree( subjectId );

            return true;
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to save generated tech tree';

            return false;
        }
    };

    return {
        subtopics,
        activeSubtopic,
        loading,
        error,
        subtopicLoading,
        subtopicError,
        fetchTechTree,
        createSubtopic,
        bulkCreateTechTree,
        fetchSubtopicDetails,
        createAndAttachChat,
        deleteChat,
        uploadAndAttachAsset,
        deleteAsset
    };
};
