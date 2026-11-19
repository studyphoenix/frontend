import type {
    ModelCreateAssetRequest,
    ModelCreateSubjectRequest,
    ModelSubject
} from '@/ts/types/api';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

const readCreatedId = async ( response: Response ): Promise<number> => {
    const body: unknown = await response.json();

    if ( typeof body !== 'object' || body === null || !( 'id' in body ) || typeof body.id !== 'number' ) {
        throw new Error( 'The server did not return an ID for the created item.' );
    }

    return body.id;
};

export const getSubjects = async (): Promise<ModelSubject[]> => {
    return await ( await request.get( '/subjects/search' ) ).json();
};

export const createSubject = async ( payload: ModelCreateSubjectRequest ): Promise<number> => {
    const response = await request.put( '/subjects/create', JSON.stringify( payload ) );

    return await readCreatedId( response );
};

export const createAsset = async ( payload: ModelCreateAssetRequest ): Promise<number> => {
    const response = await request.put( '/assets/create', JSON.stringify( payload ) );

    return await readCreatedId( response );
};

export const uploadAsset = async ( assetId: number, file: File ): Promise<void> => {
    const backendUrl = request.getBackendURL();

    backendUrl.pathname = `/assets/upload/${ assetId }`;

    const formData = new FormData();

    formData.append( 'file', file );

    const response = await fetch( backendUrl, {
        'body': formData,
        'credentials': 'include',
        'method': 'PUT',
        'redirect': 'manual'
    } );

    if ( response.type === 'opaqueredirect' ) {
        document.dispatchEvent( new CustomEvent( 'autherror' ) );

        throw new Error( 'Your session is no longer authorized. Please log in again.' );
    }

    if ( !response.ok ) {
        throw new Error( `Unable to upload "${ file.name }" (HTTP ${ response.status }).` );
    }
};

export const associateAssetsToSubject = async ( subjectId: number, assetIds: number[] ): Promise<void> => {
    await request.patch( `/subjects/associate/assets/${ subjectId }`, JSON.stringify( assetIds ) );
};