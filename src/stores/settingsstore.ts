import type {
    ModelSettings,
    ModelUpdateUserConfigRequest
} from '@/ts/types/api';
import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

const DEFAULT_SETTINGS: ModelSettings = {
    'answerLength': 'default',
    'answerInBulletPoints': false
};

export const useSettingsStore = defineStore( 'settingsstore', () => {
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const settings = ref<ModelSettings>( {
        ...DEFAULT_SETTINGS
    } );
    const loaded = ref( false );
    const loading = ref( false );
    const error = ref<string | null>( null );

    const loadSettings = async ( force = false ): Promise<ModelSettings> => {
        if ( isBackendless ) {
            settings.value = {
                ...DEFAULT_SETTINGS
            };
            loaded.value = true;

            return settings.value;
        }

        if ( loaded.value && !force ) {
            return settings.value;
        }

        loading.value = true;
        error.value = null;

        try {
            const res = await request.get( '/user/config' );

            if ( !res.ok ) {
                throw new Error( `Failed to load settings (${ res.status }).` );
            }

            const data = await res.json() as Partial<ModelSettings>;

            settings.value = {
                'answerLength': data.answerLength ?? DEFAULT_SETTINGS.answerLength,
                'answerInBulletPoints': Boolean( data.answerInBulletPoints )
            };
            loaded.value = true;
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to load settings.';
            settings.value = {
                ...DEFAULT_SETTINGS
            };
        } finally {
            loading.value = false;
        }

        return settings.value;
    };

    const updateSettings = async ( patch: ModelUpdateUserConfigRequest ): Promise<boolean> => {
        const next: ModelSettings = {
            'answerLength': patch.answerLength ?? settings.value.answerLength,
            'answerInBulletPoints': patch.answerInBulletPoints ?? settings.value.answerInBulletPoints
        };

        if ( isBackendless ) {
            settings.value = next;
            loaded.value = true;

            return true;
        }

        error.value = null;

        try {
            const res = await request.patch( '/user/config', JSON.stringify( patch ) );

            if ( !res.ok ) {
                throw new Error( `Failed to update settings (${ res.status }).` );
            }

            settings.value = next;
            loaded.value = true;

            return true;
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to update settings.';

            return false;
        }
    };

    return {
        settings,
        loaded,
        loading,
        error,
        loadSettings,
        updateSettings
    };
} );
