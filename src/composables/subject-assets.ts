import type {
    ModelAsset,
    ModelSubject
} from '@/ts/types/api';
import {
    assetsList
} from './asset-manager';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
const subjectAssets = ref<ModelAsset[]>( [] );
const loadedSubjectId = ref<number>( -1 );
const loading = ref( false );
const error = ref<string | null>( null );
const backendlessMap = ref<Record<number, ModelAsset[]>>( {} );

export const useSubjectAssets = () => {
    const fetchSubjectAssets = async ( subjectId: number ) => {
        error.value = null;

        if ( loadedSubjectId.value !== subjectId ) {
            subjectAssets.value = [];
            loadedSubjectId.value = subjectId;
        }

        if ( isBackendless ) {
            subjectAssets.value = backendlessMap.value[subjectId] ?? [];

            return;
        }

        loading.value = true;

        try {
            const response = await request.get( `/subjects/get/${ subjectId }` );

            if ( !response.ok ) {
                throw new Error( `Failed to load subject assets (${ response.status })` );
            }

            const data = await response.json() as ModelSubject;

            subjectAssets.value = Array.isArray( data.assets ) ? data.assets : [];
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to load subject assets';
        } finally {
            loading.value = false;
        }
    };

    const updateSubjectAssetAssociation = async (
        subjectId: number,
        assetId: number,
        action: 'associate' | 'deassociate'
    ): Promise<boolean> => {
        error.value = null;

        if ( isBackendless ) {
            const current = backendlessMap.value[subjectId] ?? [];

            if ( action === 'associate' ) {
                const found = assetsList.value.find( a => a.id === assetId );

                if ( found && !current.some( a => a.id === assetId ) ) {
                    backendlessMap.value[subjectId] = [
                        ...current,
                        found
                    ];
                }
            } else {
                backendlessMap.value[subjectId] = current.filter( a => a.id !== assetId );
            }

            loadedSubjectId.value = subjectId;
            subjectAssets.value = backendlessMap.value[subjectId] ?? [];

            return true;
        }

        try {
            const res = await request.patch(
                `/subjects/${ action }/assets/${ subjectId }`,
                JSON.stringify( [ assetId ] )
            );

            if ( !res.ok ) {
                throw new Error( `Failed to ${ action } asset (${ res.status })` );
            }

            await fetchSubjectAssets( subjectId );

            return true;
        } catch ( err ) {
            error.value = err instanceof Error
                ? err.message
                : `Failed to ${ action === 'associate' ? 'attach' : 'remove' } asset`;

            return false;
        }
    };

    const associateAssetToSubject = ( subjectId: number, assetId: number ): Promise<boolean> => {
        return updateSubjectAssetAssociation( subjectId, assetId, 'associate' );
    };

    const deassociateAssetFromSubject = ( subjectId: number, assetId: number ): Promise<boolean> => {
        return updateSubjectAssetAssociation( subjectId, assetId, 'deassociate' );
    };

    const removeSubjectAssetLocally = ( assetId: number, subjectId?: number ) => {
        subjectAssets.value = subjectAssets.value.filter( a => a.id !== assetId );

        if ( isBackendless && subjectId !== undefined && backendlessMap.value[subjectId] ) {
            backendlessMap.value[subjectId] = backendlessMap.value[subjectId].filter( a => a.id !== assetId );
        }
    };

    return {
        subjectAssets,
        loading,
        error,
        fetchSubjectAssets,
        associateAssetToSubject,
        deassociateAssetFromSubject,
        removeSubjectAssetLocally
    };
};
