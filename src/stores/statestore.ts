import {
    defineStore
} from 'pinia';
import {
    ref
} from 'vue';

export const useStateStore = defineStore( 'statestore', () => {
    const selectedSubject = ref( -1 );
    const selectedSubtopic = ref( -1 );
    const selectedChat = ref( -1 );

    try {
        selectedSubject.value = parseInt( localStorage.getItem( 'sp-selected-subject' )! );
    } catch { /* */ }

    try {
        selectedSubtopic.value = parseInt( localStorage.getItem( 'sp-selected-subtopic' )! );
    } catch { /* */ }

    try {
        selectedChat.value = parseInt( localStorage.getItem( 'sp-selected-chat' )! );
    } catch { /* */ }

    return {
        selectedSubject,
        selectedSubtopic,
        selectedChat
    };
} );
