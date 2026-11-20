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
