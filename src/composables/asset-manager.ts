import {
    type Ref,
    ref,
    watch
} from 'vue';
import type {
    ModelAsset
} from '@/ts/types/api';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

type cbFn = ( assetId?: number ) => void;

export const showAssetManager = ref( false );

export const assetManagerMode: Ref<'default' | 'select'> = ref( 'default' );

export const showAddAsset = ref( false );

export const assetsList: Ref<ModelAsset[]> = ref( [] );

export const selectedIdx = ref( -1 );

/** (re)load assets from the backend */
export const loadAssets = async () => {
    try {
        assetsList.value = await ( await request.get( '/assets/search' ) ).json();
    } catch {
        alert( 'Loading of assets failed' );
    }
};

export const deleteAsset = async ( id: number ) => {
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
    selectedIdx.value = -1;
    const listeners: cbFn[] = [];

    /**
     * Add an event listener for the selection of an asset
     * @param cb - Callback function receiving the asset id or undefined upon closing the interface
     */
    const addEventListener = ( cb: cbFn ) => {
        listeners.push( cb );
    };

    watch( selectedIdx, () => {
        if ( selectedIdx.value > -1 ) {
            listeners.forEach( val => val( selectedIdx.value ) );
        }
    } );

    loadAssets();

    return {
        addEventListener,
        loadAssets
    };
};
