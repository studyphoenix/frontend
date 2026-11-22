import type {
    ModelSettings
} from '@/ts/types/api';

export interface LlmMessage {
    'role': 'user' | 'assistant';
    'content': string;
}

export interface ProfessorPromptContext {
    'subtopicName': string;
    'chatName': string;
    'assetNames': string[];
    'settings': ModelSettings;
    'currentProgress': number;
    'checkpointActive': boolean;
}

export interface ParsedProfessorTurn {
    'reply': string;
    'summary': string;
    'isCheckpointPrompt': boolean;
    'checkpointPassed': boolean;
}

export interface ProfessorTurnResult extends ParsedProfessorTurn {
    'usedMock': boolean;
}

export type ProfessorLlmClient = (
    systemPrompt: string,
    messages: LlmMessage[]
) => Promise<string>;
