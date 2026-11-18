export interface ChatMessagePair {
    'question': string;
    'response': string;
    'child': ChatMessagePair;
}

/**
 * We can have multiple types in a single file (and should)
 */
export interface AnotherTypeExample {
    'test': ChatMessagePair;
}
