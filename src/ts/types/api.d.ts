/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ControllerCreateAssetRequest {
    /**
   * The Icon of the asset. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerCreateChatRequest {
    /**
   * The Icon of the chat. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerCreateFlashcardRequest {
    /**
   * The Icon of the flashcard. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerCreateSubjectRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerCreateSubtopicRequest {
    /**
   * The Icon of the subtopic. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUpdateAssetRequest {
    /**
   * The Icon of the asset. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUpdateChatRequest {
    /**
   * The Icon of the chat. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUpdateFlashcardRequest {
    /**
   * The Icon of the flashcard. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUpdateSubjectRequest {
    /**
   * The Icon of the subject. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUpdateSubtopicRequest {
    /**
   * The Icon of the subtopic. Must be an icon that can be rendered in the browser
   * @minLength 0
   * @maxLength 250
   * @example "fa-gear"
   */
    'icon'?: string;
    /**
   * @minLength 3
   * @maxLength 250
   * @example "Analysis"
   */
    'name'?: string;
}

export interface ControllerUserProfileResponse {
    /** @example "My Nice Username" */
    'username'?: string;
}

export interface HttputilHTTPError {
    /** @example 500 */
    'code'?: number;
    /** @example "Error processing data due to db issue" */
    'message'?: string;
}

export interface ModelAsset {
    'id'?: number;
    /** @example "application/pdf" */
    'mediaType'?: string;
    /** @example "2027-01-01T00:00:00Z" */
    'updatedAt'?: string;
}

export interface ModelChat {
    'chatMessages'?: ModelChatMessage[];
    /** @example 1 */
    'id'?: number;
    /**
   * the mode to be used for the UI
   * @example 0
   */
    'mode'?: number;
    /** @example "My nice chat name" */
    'name'?: string;
    /**
   * The id of the subtopic it belongs to
   * @example 0
   */
    'subtopicId'?: number;
    /** @example "2026-12-31T08:32:08Z" */
    'updatedAt'?: string;
}

export interface ModelChatMessage {
    /** @example 1 */
    'chatId'?: number;
    /** @example "2026-12-31T08:32:08Z" */
    'createdAt'?: string;
    /** @example "2026-12-31T08:34:12Z" */
    'editedAt'?: string;
    /** @example 10 */
    'id'?: number;
    /** @example "Certianly! This..." */
    'modelMessage'?: string;
    /** @example "Explain why ..." */
    'userMessage'?: string;
}

export interface ModelFlashcard {
    'id'?: number;
}

export type ModelSubject = object;

export type ModelSubtopic = object;
