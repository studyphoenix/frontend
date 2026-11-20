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

export const showAssetManager = ref( false );

export const assetManagerMode: Ref<'default' | 'select'> = ref( 'default' );

export const showAddAsset = ref( false );

export const assetsList: Ref<ModelAsset[]> = ref( [] );

export const selectedAssetId = ref( -1 );

export const showDeleteAssetConfirmation = ref( false );

export const isDeletingAsset = ref( false );

export const assetDeleteError = ref( '' );

let assetToDeleteId = -1;

/** (re)load assets from the backend */
export const loadAssets = async () => {
    try {
        assetsList.value = await ( await request.get( '/assets/search' ) ).json();
    } catch {
        alert( 'Loading of assets failed' );
    }
};

export const deleteAsset = async ( ev: MouseEvent, id: number ) => {
    ev.stopPropagation();
    showDeleteAssetConfirmation.value = true;
    assetToDeleteId = id;
};

/**
 * Deletes the asset, no questions asked. This is ideally the callback used for the delete confirmation popup
 */
export const doDeleteAsset = async () => {
    if ( assetToDeleteId < 0 ) return;

    isDeletingAsset.value = true;

    try {
        await request.deleteRequest( `/assets/delete/${ assetToDeleteId }` );
        showDeleteAssetConfirmation.value = false;
    } catch ( err ) {
        if ( err === 'ERR_404' )
            assetDeleteError.value = 'Asset not found';
        else
            assetDeleteError.value = 'Could not delete asset due to an unknown error';

        console.error( err );
    } finally {
        isDeletingAsset.value = false;
    }

    loadAssets();
};

export const openAssetManager = ( mode?: 'select' | 'default' ) => {
    assetManagerMode.value = mode ?? 'default';
    showAssetManager.value = true;
    selectedAssetId.value = -1;

    loadAssets();
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
    'application/gif': 'mdi-file-image',
    'application/jpeg': 'mdi-file-image',
    'application/png': 'mdi-file-image',
    'application/json': 'mdi-file-code',
    'text/markdown': 'mdi-file-code',
    'text/css': 'mdi-file-code',
    'text/javascript': 'mdi-file-code',
    'text/plain': 'mdi-note-text'
};
