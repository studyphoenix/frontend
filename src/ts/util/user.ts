import type {
    ControllerUserProfileResponse
} from '../types/api';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';
import {
    useAuthStore
} from '@/stores/authstore';

export const loadUserProfile = async () => {
    const store = useAuthStore();

    try {
        const user = await ( await request.get( '/user/profile' ) ).json() as ControllerUserProfileResponse;

        store.username = user.username;
        store.email = user.email;
    } catch { /* emtpy */ }
};
