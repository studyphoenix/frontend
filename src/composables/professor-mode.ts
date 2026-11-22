import type {
    ControllerCreatedResponse,
    ModelAsset,
    ModelChat,
    ModelChatMessage,
    ModelSettings,
    ModelSubject,
    ModelSubtopic
} from '@/ts/types/api';
import {
    createProfessorOpeningMessage,
    requestProfessorReply
} from '@/ts/ai/professor-chat';
import type {
    ProfessorPromptContext
} from '@/ts/prompts/professor-mode';
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
const CHECKPOINT_PROGRESS_STEP = 25;

export const useProfessorMode = () => {
    const isBackendless = import.meta.env.VITE_BACKENDLESS === 'true';
    const subtopic = ref<ModelSubtopic | null>( null );
    const assets = ref<ModelAsset[]>( [] );
    const settings = ref<ModelSettings>( {
        ...DEFAULT_SETTINGS
    } );
    const messages = ref<ModelChatMessage[]>( [] );
    const openingMessage = ref( '' );
    const checkpointActive = ref( false );
    const checkpointFeedback = ref<string | null>( null );
    const loadingContext = ref( false );
    const sending = ref( false );
    const error = ref<string | null>( null );
    const buildContext = ( chatName: string ): ProfessorPromptContext => ( {
        'subtopicName': subtopic.value?.name || chatName || 'Study Topic',
        'chatName': chatName || 'Professor Session',
        'assetNames': assets.value.map( a => a.name ),
        'settings': settings.value,
        'currentProgress': Number( subtopic.value?.progress ?? 0 ),
        'checkpointActive': checkpointActive.value
    } );

    const loadUserSettings = async () => {
        if ( isBackendless ) {
            settings.value = {
                ...DEFAULT_SETTINGS
            };

            return;
        }

        try {
            const res = await request.get( '/user/config' );

            if ( res.ok ) {
                const data = await res.json() as Partial<ModelSettings>;

                settings.value = {
                    'answerLength': data.answerLength ?? 'default',
                    'answerInBulletPoints': Boolean( data.answerInBulletPoints )
                };
            }
        } catch {
            settings.value = {
                ...DEFAULT_SETTINGS
            };
        }
    };

    const loadTopicContext = async ( subtopicId: number | null, subjectId: number | null ) => {
        if ( isBackendless ) {
            subtopic.value = {
                'id': subtopicId && subtopicId > 0 ? subtopicId : 1,
                'name': 'Probability & Distributions',
                'icon': 'mdi-sitemap',
                'progress': 25,
                'updatedAt': new Date().toISOString()
            };
            assets.value = [ {
                'id': 101,
                'name': 'Lecture Script Week 1',
                'mediaType': 'application/pdf',
                'icon': 'mdi-file-document-multiple',
                'updatedAt': new Date().toISOString()
            } ];

            return;
        }

        const collected: ModelAsset[] = [];
        const seenIds = new Set<number>();

        if ( subjectId && subjectId > 0 ) {
            try {
                const subjectRes = await request.get( `/subjects/get/${ subjectId }` );

                if ( subjectRes.ok ) {
                    const subjectData = await subjectRes.json() as ModelSubject;

                    for ( const asset of subjectData.assets ?? [] ) {
                        if ( !seenIds.has( asset.id ) ) {
                            seenIds.add( asset.id );
                            collected.push( asset );
                        }
                    }
                }
            } catch {
                // Optional subject materials
            }
        }

        if ( subtopicId && subtopicId > 0 ) {
            try {
                const subtopicRes = await request.get( `/subtopics/get/${ subtopicId }` );

                if ( subtopicRes.ok ) {
                    const subtopicData = await subtopicRes.json() as ModelSubtopic;

                    subtopic.value = subtopicData;

                    for ( const asset of subtopicData.assets ?? [] ) {
                        if ( !seenIds.has( asset.id ) ) {
                            seenIds.add( asset.id );
                            collected.push( asset );
                        }
                    }
                }
            } catch {
                subtopic.value = null;
            }
        } else {
            subtopic.value = null;
        }

        assets.value = collected;
    };

    const initSession = async (
        chat: ModelChat | null,
        chatName: string,
        subtopicId: number | null,
        subjectId: number | null
    ) => {
        error.value = null;
        checkpointFeedback.value = null;
        checkpointActive.value = false;
        loadingContext.value = true;
        messages.value = Array.isArray( chat?.chatMessages ) ? [ ...chat.chatMessages ] : [];

        try {
            await Promise.all( [
                loadUserSettings(),
                loadTopicContext( subtopicId, subjectId )
            ] );
            openingMessage.value = createProfessorOpeningMessage( buildContext( chatName ) );
        } finally {
            loadingContext.value = false;
        }
    };

    const sendMessage = async (
        rawText: string,
        chatId: number | null,
        chatName: string
    ): Promise<boolean> => {
        const trimmed = rawText.trim();

        if ( trimmed.length < 3 ) {
            error.value = 'Please enter at least 3 characters.';

            return false;
        }

        error.value = null;
        checkpointFeedback.value = null;
        sending.value = true;

        try {
            const ctx = buildContext( chatName );
            const result = await requestProfessorReply( ctx, messages.value, trimmed );

            let persistedId = Date.now();

            if ( !isBackendless && chatId && chatId > 0 ) {
                const res = await request.put(
                    `/chats/messages/add/${ chatId }`,
                    JSON.stringify( {
                        'userMessage': trimmed,
                        'modelMessage': result.reply,
                        'summary': result.summary
                    } )
                );

                if ( !res.ok ) {
                    throw new Error( `Failed to save message (${ res.status }).` );
                }

                const created = await res.json() as ControllerCreatedResponse;

                persistedId = created.id;
            }

            messages.value = [
                ...messages.value,
                {
                    'id': persistedId,
                    'chatId': chatId ?? 0,
                    'userMessage': trimmed,
                    'modelMessage': result.reply,
                    'summary': result.summary,
                    'updatedAt': new Date().toISOString()
                }
            ];

            if ( result.checkpointPassed ) {
                checkpointActive.value = false;

                if ( subtopic.value && subtopic.value.id > 0 ) {
                    const current = Number( subtopic.value.progress ?? 0 );
                    const nextProgress = Math.min( 100, current + CHECKPOINT_PROGRESS_STEP );

                    if ( !isBackendless ) {
                        await request.patch(
                            `/subtopics/update/${ subtopic.value.id }`,
                            JSON.stringify( {
                                'progress': nextProgress
                            } )
                        );
                    }

                    subtopic.value = {
                        ...subtopic.value,
                        'progress': nextProgress
                    };
                    checkpointFeedback.value = `Checkpoint passed! Subtopic progress updated to ${ nextProgress }%.`;
                } else {
                    checkpointFeedback.value = 'Checkpoint passed!';
                }
            } else if ( result.isCheckpointPrompt ) {
                checkpointActive.value = true;
            }

            return true;
        } catch ( err ) {
            error.value = err instanceof Error ? err.message : 'Failed to send message.';

            return false;
        } finally {
            sending.value = false;
        }
    };

    return {
        subtopic,
        assets,
        settings,
        messages,
        openingMessage,
        checkpointActive,
        checkpointFeedback,
        loadingContext,
        sending,
        error,
        initSession,
        sendMessage
    };
};
