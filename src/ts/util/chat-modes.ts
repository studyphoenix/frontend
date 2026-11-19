export interface ChatModeConfig {
    'mode': 1 | 2 | 3;
    'label': string;
    'description': string;
    'icon': string;
}

export const CHAT_MODES: ChatModeConfig[] = [
    {
        'mode': 1,
        'label': 'Professor',
        'description': 'Guided explanations and concept Q&A',
        'icon': 'mdi-school-outline'
    },
    {
        'mode': 2,
        'label': 'Student',
        'description': 'Flashcards and active recall practice',
        'icon': 'mdi-cards-outline'
    },
    {
        'mode': 3,
        'label': 'Detective',
        'description': 'Find and close gaps in understanding',
        'icon': 'mdi-magnify'
    }
];

export const getChatModeMeta = ( mode: number ): ChatModeConfig => {
    return CHAT_MODES.find( m => m.mode === mode ) ?? CHAT_MODES[0];
};
