import {
    type Ref,
    ref
} from 'vue';
import type {
    ModelAsset
} from '@/ts/types/api';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';

export const showAssetManager = ref( false );

export const assetManagerMode: Ref<'default' | 'select'> = ref( 'default' );

export const showAddAsset = ref( false );

export const assetsList: Ref<ModelAsset[]> = ref( [] );

export const disabledAssetIds = ref<number[]>( [] );

export const selectedAssetId = ref( -1 );

export const assetsLoadError = ref<string | null>( null );

export const showDeleteAssetConfirmation = ref( false );

export const isDeletingAsset = ref( false );

export const assetDeleteError = ref( '' );

let assetToDeleteId = -1;
let seededBackendless = false;

const createSampleAssets = (): ModelAsset[] => [
    {
        'id': 101,
        'name': 'Lecture Notes Week 1',
        'mediaType': 'application/pdf',
        'icon': 'mdi-file-document-multiple',
        'updatedAt': '2026-11-12T00:00:00Z'
    },
    {
        'id': 102,
        'name': 'Cheat Sheet Formulae',
        'mediaType': 'image/png',
        'icon': 'mdi-file-image',
        'updatedAt': '2026-11-14T00:00:00Z'
    }
];

/** (re)load assets from the backend */
export const loadAssets = async () => {
    assetsLoadError.value = null;

    if ( isBackendless ) {
        if ( !seededBackendless ) {
            assetsList.value = createSampleAssets();
            seededBackendless = true;
        }

        return;
    }

    try {
        const res = await request.get( '/assets/search' );
        const data = await res.json();

        assetsList.value = Array.isArray( data ) ? data : [];
    } catch ( err ) {
        assetsLoadError.value = err instanceof Error ? err.message : 'Failed to load assets';
    }
};

export const deleteAsset = ( ev: MouseEvent, id: number ) => {
    ev.stopPropagation();
    assetDeleteError.value = '';
    assetToDeleteId = id;
    showDeleteAssetConfirmation.value = true;
};

/**
 * Deletes the asset globally. Callback used for the delete confirmation dialog
 */
export const doDeleteAsset = async () => {
    if ( assetToDeleteId < 0 ) {
        return;
    }

    const deletedId = assetToDeleteId;

    assetDeleteError.value = '';
    isDeletingAsset.value = true;

    try {
        if ( isBackendless ) {
            assetsList.value = assetsList.value.filter( asset => asset.id !== deletedId );
        } else {
            await request.deleteRequest( `/assets/delete/${ deletedId }` );
        }

        if ( selectedAssetId.value === deletedId ) {
            selectedAssetId.value = -1;
        }

        disabledAssetIds.value = disabledAssetIds.value.filter( id => id !== deletedId );
        assetToDeleteId = -1;
        showDeleteAssetConfirmation.value = false;
        document.dispatchEvent( new CustomEvent( 'studyphoenix:assets:deleted', {
            'detail': deletedId
        } ) );
        await loadAssets();
    } catch ( err ) {
        if ( err instanceof Error && err.message === 'ERR_404' ) {
            assetDeleteError.value = 'Asset not found';
        } else {
            assetDeleteError.value = 'Could not delete asset due to an unknown error';
        }

        console.error( err );
    } finally {
        isDeletingAsset.value = false;
    }
};

export const openAssetManager = (
    mode: 'select' | 'default' = 'default',
    options?: {
        'disabledIds'?: number[];
    }
) => {
    assetManagerMode.value = mode;
    disabledAssetIds.value = options?.disabledIds ?? [];
    selectedAssetId.value = -1;
    assetsLoadError.value = null;
    showAssetManager.value = true;

    loadAssets();
};

export const formatMediaBadge = ( mediaType: string ): string => {
    const sub = mediaType.split( '/' ).pop() ?? 'file';

    return sub.toUpperCase();
};

export const getAssetDownloadUrl = ( assetId: number ): string => {
    if ( isBackendless ) {
        return '#';
    }

    const url = request.getBackendURL();

    url.pathname = `/assets/download/${ assetId }`;

    return url.toString();
};

export const getIconForMediaType = ( mediaType: string ) => {
    if ( iconMap[mediaType] ) {
        return iconMap[mediaType];
    } else {
        return 'mdi-file-question';
    }
};

const iconMap: Record<string, string> = {
    'application/pdf': 'mdi-file-document-multiple',
    'application/msword': 'mdi-file-document-multiple',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'mdi-file-document-multiple',
    'application/vnd.oasis.opendocument.text': 'mdi-file-document-multiple',
    'application/vnd.oasis.opendocument.spreadsheet': 'mdi-file-delimited',
    'application/vnd.oasis.opendocument.presentation': 'mdi-presentation-play',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'mdi-presentation-play',
    'image/gif': 'mdi-file-image',
    'image/jpeg': 'mdi-file-image',
    'image/jpg': 'mdi-file-image',
    'image/png': 'mdi-file-image',
    'application/json': 'mdi-file-code',
    'text/markdown': 'mdi-file-code',
    'text/css': 'mdi-file-code',
    'text/javascript': 'mdi-file-code',
    'text/plain': 'mdi-note-text'
};
