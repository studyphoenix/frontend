import type {
    ControllerCreatedResponse,
    ModelChat,
    ModelSubtopic
} from '@/ts/types/api';
import {
    assetsList
} from './asset-manager';
import {
    createSampleSubtopics
} from './techtree-sample';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

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
            const found = ( activeSubtopic.value?.id === subtopicId ? activeSubtopic.value : null )
                ?? subtopics.value.find( st => st.id === subtopicId )
                ?? fallbackSubtopic
                ?? null;

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

    const deleteChat = async ( subtopicId: number, chatId: number ) => {
        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                activeSubtopic.value.chats = ( activeSubtopic.value.chats ?? [] ).filter( c => c.id !== chatId );
            }

            return;
        }

        subtopicError.value = null;

        try {
            const res = await request.deleteRequest( `/chats/delete/${ chatId }` );

            if ( !res.ok ) {
                throw new Error( `Failed to delete chat (${ res.status })` );
            }

            await fetchSubtopicDetails( subtopicId );
        } catch ( err ) {
            subtopicError.value = err instanceof Error ? err.message : 'Failed to delete chat';
        }
    };

    const updateSubtopicAssetAssociation = async (
        subtopicId: number,
        assetId: number,
        action: 'associate' | 'deassociate'
    ): Promise<boolean> => {
        subtopicError.value = null;

        if ( isBackendless ) {
            if ( activeSubtopic.value && activeSubtopic.value.id === subtopicId ) {
                const current = activeSubtopic.value.assets ?? [];

                if ( action === 'associate' ) {
                    const found = assetsList.value.find( a => a.id === assetId );

                    if ( found && !current.some( a => a.id === assetId ) ) {
                        activeSubtopic.value.assets = [
                            ...current,
                            found
                        ];
                    }
                } else {
                    activeSubtopic.value.assets = current.filter( a => a.id !== assetId );
                }
            }

            return true;
        }

        try {
            const res = await request.patch(
                `/subtopics/${ action }/assets/${ subtopicId }`,
                JSON.stringify( [ assetId ] )
            );

            if ( !res.ok ) {
                throw new Error( `Failed to ${ action } asset (${ res.status })` );
            }

            await fetchSubtopicDetails( subtopicId );

            return true;
        } catch ( err ) {
            subtopicError.value = err instanceof Error
                ? err.message
                : `Failed to ${ action === 'associate' ? 'attach' : 'remove' } asset`;

            return false;
        }
    };

    const associateAssetToSubtopic = ( subtopicId: number, assetId: number ): Promise<boolean> => {
        return updateSubtopicAssetAssociation( subtopicId, assetId, 'associate' );
    };

    const deassociateAssetFromSubtopic = ( subtopicId: number, assetId: number ): Promise<boolean> => {
        return updateSubtopicAssetAssociation( subtopicId, assetId, 'deassociate' );
    };

    const removeAssetLocally = ( assetId: number ) => {
        if ( activeSubtopic.value?.assets ) {
            activeSubtopic.value.assets = activeSubtopic.value.assets.filter( a => a.id !== assetId );
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
        fetchSubtopicDetails,
        createAndAttachChat,
        deleteChat,
        associateAssetToSubtopic,
        deassociateAssetFromSubtopic,
        removeAssetLocally
    };
};
