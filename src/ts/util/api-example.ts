import {
    request
} from '@janishutz/oidc-login-sdk-browser';

export const getSubjects = async () => {
    return await ( await request.get( '/subjects/search' ) ).json();
};
