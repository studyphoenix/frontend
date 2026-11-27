import type {
    ModelCreateSubjectRequest,
    ModelSubject,
    ModelUpdateSubjectRequest
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

export const updateSubject = async ( subjectId: number, payload: ModelUpdateSubjectRequest ): Promise<void> => {
    const response = await request.patch( `/subjects/update/${ subjectId }`, JSON.stringify( payload ) );

    if ( !response.ok ) {
        throw new Error( `Failed to update subject (${ response.status })` );
    }
};

export const deleteSubject = async ( subjectId: number ): Promise<void> => {
    const response = await request.deleteRequest( `/subjects/delete/${ subjectId }` );

    if ( !response.ok ) {
        throw new Error( `Failed to delete subject (${ response.status })` );
    }
};

export const associateAssetsToSubject = async ( subjectId: number, assetIds: number[] ): Promise<void> => {
    await request.patch( `/subjects/associate/assets/${ subjectId }`, JSON.stringify( assetIds ) );
};
