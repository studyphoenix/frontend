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

    if ( confirm( 'Do you really want to delete this asset?' ) ) {
        try {
            await request.deleteRequest( `/assets/delete/${ id }` );
        } catch {
            alert( 'Failed to delete asset' );
        }

        loadAssets();
    }
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
