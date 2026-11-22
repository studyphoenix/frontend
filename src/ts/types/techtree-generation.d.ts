export interface GeneratedSubtopic {
    'id': number;
    'name': string;
    'layer': number;
}

export interface GeneratedEdge {
    'from': number;
    'to': number;
}

export interface GeneratedTechTree {
    'subject': string;
    'subtopics': GeneratedSubtopic[];
    'edges': GeneratedEdge[];
}

export interface BulkCreateSubtopicItem {
    'tempId': number;
    'name': string;
    'icon': string;
}

export interface BulkCreateEdge {
    'from': number;
    'to': number;
}

export interface BulkCreateTechTreeRequest {
    'subjectId': number;
    'subtopics': BulkCreateSubtopicItem[];
    'edges': BulkCreateEdge[];
}

export interface TechTreePromptContext {
    'subjectName': string;
    'syllabusContext'?: string;
    'assetNames'?: string[];
}

export type TechTreeLlmClient = ( systemPrompt: string, userPrompt: string ) => Promise<string>;
