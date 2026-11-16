/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ControllerUserProfileResponse {
    /** @example "jane.doe@example.com" */
    'email': string;
    /** @example "My Nice Username" */
    'username': string;
}

export interface HttputilHTTPError {
    /** @example 500 */
    'code': number;
    /** @example "Error processing data due to db issue" */
    'message': string;
}

export interface ModelAddChatMessageRequest {
    /** @example "Model's message" */
    'modelMessage': string;
    /**
   * @minLength 0
   * @maxLength 250
   * @example "test messages"
   */
    'summary': string;
    /**
   * @minLength 3
   * @maxLength 20000
   * @example "User's message"
   */
    'userMessage': string;
}

export interface ModelAsset {
    /** @example "fa-gear" */
    'icon': string;
    'id': number;
    /** @example "application/pdf" */
    'mediaType': string;
    /** @example "my asset name" */
    'name': string;
    /** @example "2027-01-01T00:00:00Z" */
    'updatedAt': string;
}

export interface ModelChat {
    'chatMessages': ModelChatMessage[];
    /** @example 1 */
    'id': number;
    /**
   * the mode to be used for the UI
   * @example 1
   */
    'mode': 1 | 2 | 3;
    /** @example "My nice chat name" */
    'name': string;
    /** @example "2026-12-31T08:32:08Z" */
    'updatedAt': string;
}

export interface ModelChatMessage {
    /** @example 1 */
    'chatId': number;
    /** @example 10 */
    'id': number;
    /** @example "Certianly! This..." */
    'modelMessage': string;
    /** @example "summary for this message pair" */
    'summary': string;
    /** @example "2026-12-31T08:34:12Z" */
    'updatedAt': string;
    /** @example "Explain why ..." */
    'userMessage': string;
}

export interface ModelCreateAssetRequest {
    /**
   * Must be a valid identifier for vuetify
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon': string;
    /**
   * The mediatype (formerly MIME type) of the asset. Will block replacement with asset of another type
   * @minLength 3
   * @maxLength 40
   * @example "application/pdf"
   */
    'mediaType': string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis Script"
   */
    'name': string;
}

export interface ModelCreateChatRequest {
    /**
   * @min 1
   * @max 3
   * @example 1
   */
    'mode': 1 | 2 | 3;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis Explanation"
   */
    'name': string;
}

export interface ModelCreateFlashcardRequest {
    /**
   * @minLength 0
   * @example "summarized content for this flashcard with everything needed for the model to ask sensible questions"
   */
    'content': string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis"
   */
    'name': string;
}

export interface ModelCreateSubjectRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 100
   * @example "fa-gear"
   */
    'icon': string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis"
   */
    'name': string;
}

export interface ModelCreateSubtopicRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 100
   * @example "fa-gear"
   */
    'icon': string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis"
   */
    'name': string;
}

export interface ModelFlashcard {
    'completionCount': number;
    'content': string;
    'id': number;
    'name': string;
    /** @example "2026-12-17T13:47:33Z" */
    'updatedAt': string;
}

export interface ModelSettings {
    /** @default false */
    'answerInBulletPoints': boolean;
    /** @default "default" */
    'answerLength': 'very-short' | 'short' | 'default' | 'long' | 'very-long';
}

export interface ModelSubject {
    'assets'?: ModelAsset[];
    /** @example "fa-gear" */
    'icon': string;
    'id': number;
    /** @example "Analysis" */
    'name': string;
    /** @example "2026-12-17T13:47:33Z" */
    'updatedAt': string;
}

export interface ModelSubtopic {
    'assets'?: ModelAsset[];
    'chats'?: ModelChat[];
    /** @example "fa-gear" */
    'icon': string;
    'id': number;
    /** @example "ordinary differential equations" */
    'name': string;
    'subtopics'?: ModelSubtopic[];
    /** @example "2026-12-17T13:47:33Z" */
    'updatedAt': string;
}

export interface ModelUpdateAssetRequest {
    /**
   * Must be a valid identifier for vuetify
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis Script"
   */
    'name'?: string;
}

export interface ModelUpdateChatMessageRequest {
    /** @example "Model's message" */
    'modelMessage'?: string;
    /**
   * @minLength 0
   * @maxLength 250
   * @example "test messages"
   */
    'summary'?: string;
    /**
   * @minLength 3
   * @maxLength 20000
   * @example "User's message"
   */
    'userMessage'?: string;
}

export interface ModelUpdateChatRequest {
    /**
   * @min 1
   * @max 3
   * @example 2
   */
    'mode'?: 1 | 2 | 3;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis Explanation"
   */
    'name'?: string;
}

export interface ModelUpdateFlashcardRequest {
    /**
   * @minLength 0
   * @example "summarized content for this flashcard with everything needed for the model to ask sensible questions"
   */
    'content'?: string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "ODEs"
   */
    'name'?: string;
}

export interface ModelUpdateSubjectRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 100
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ModelUpdateSubtopicRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 100
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 100
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ModelUpdateUserConfigRequest {
    /** @default false */
    'answerInBulletPoints'?: boolean;
    /** @default "default" */
    'answerLength'?: 'very-short' | 'short' | 'default' | 'long' | 'very-long';
}
