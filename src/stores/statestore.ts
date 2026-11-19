import type {
    ControllerCreatedResponse,
    ModelSubject
} from '@/ts/types/api';
import {
    createSampleSubjects
} from '@/composables/techtree-sample';
import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';
import {
    request
} from '@janishutz/oidc-login-sdk-browser';

export const useStateStore = defineStore( 'statestore', () => {
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const selectedSubject = ref( -1 );
    const selectedSubtopic = ref( -1 );
    const selectedChat = ref( -1 );
    const subjects = ref<ModelSubject[]>( [] );
    const subjectsError = ref<string | null>( null );

    try {
        selectedSubject.value = parseInt( localStorage.getItem( 'sp-selected-subject' )! );
    } catch { /* */ }

    try {
        selectedSubtopic.value = parseInt( localStorage.getItem( 'sp-selected-subtopic' )! );
    } catch { /* */ }

    try {
        selectedChat.value = parseInt( localStorage.getItem( 'sp-selected-chat' )! );
    } catch { /* */ }

    const fetchSubjects = async () => {
        if ( isBackendless ) {
            if ( subjects.value.length === 0 ) {
                subjects.value = createSampleSubjects();
            }

            return;
        }

        subjectsError.value = null;

        try {
            const response = await request.get( '/subjects/search' );
            const data = await response.json();

            subjects.value = Array.isArray( data ) ? data : [];
        } catch ( err ) {
            subjectsError.value = err instanceof Error ? err.message : 'Failed to load subjects';
            subjects.value = [];
        }
    };

    const createSubject = async ( name: string, icon = 'mdi-book-open-variant' ): Promise<ModelSubject | null> => {
        const cleanName = name.replace( /[^\x20-\x7E]/g, '' ).trim()
            .slice( 0, 100 );

        if ( cleanName.length < 3 ) {
            subjectsError.value = 'Subject name must be at least 3 ASCII characters.';

            return null;
        }

        subjectsError.value = null;

        if ( isBackendless ) {
            const mockSubject: ModelSubject = {
                'id': Date.now(),
                'name': cleanName,
                'icon': icon,
                'updatedAt': new Date().toISOString()
            };

            subjects.value = [
                ...subjects.value,
                mockSubject
            ];
            selectedSubject.value = mockSubject.id;

            try {
                localStorage.setItem( 'sp-selected-subject', String( mockSubject.id ) );
            } catch { /* */ }

            return mockSubject;
        }

        try {
            const createRes = await request.put(
                '/subjects/create',
                JSON.stringify( {
                    'name': cleanName,
                    'icon': icon
                } )
            );

            if ( !createRes.ok ) {
                throw new Error( `Failed to create subject (${ createRes.status })` );
            }

            const created = await createRes.json() as ControllerCreatedResponse;

            await fetchSubjects();
            selectedSubject.value = created.id;

            try {
                localStorage.setItem( 'sp-selected-subject', String( created.id ) );
            } catch { /* */ }

            return subjects.value.find( s => s.id === created.id ) ?? null;
        } catch ( err ) {
            subjectsError.value = err instanceof Error ? err.message : 'Failed to create subject';

            return null;
        }
    };

    return {
        selectedSubject,
        selectedSubtopic,
        selectedChat,
        subjects,
        subjectsError,
        fetchSubjects,
        createSubject
    };
} );
