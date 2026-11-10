import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';

export const useAuthStore = defineStore( 'authstore', () => {
    const isAuth = ref( import.meta.env.PROD ? false : ( import.meta.env.VITE_BACKENDLESS == 'true' ? true : false ) );
    const username = ref( '' );
    const email = ref( '' );

    return {
        isAuth,
        username,
        email
    };
} );
