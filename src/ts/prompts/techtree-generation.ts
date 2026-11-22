export interface TechTreePromptContext {
    'subjectName': string;
    'syllabusContext'?: string;
    'assetNames'?: string[];
}

export const TECHTREE_GENERATION_SYSTEM_PROMPT = `You are designing a structured prerequisite learning graph ("Tech Tree") for a university course in StudyPhoenix.

Given a subject name and optional syllabus or lecture materials, output a valid JSON object representing the subtopics and their prerequisite edges:

{
  "subject": "<Subject Name>",
  "subtopics": [
    { "id": 1, "name": "<Short Title>", "layer": 0 }
  ],
  "edges": [
    { "from": 1, "to": 2 }
  ]
}

STRICT GRAPH & UI CONSTRAINTS (MUST FOLLOW ALL):

1. Title length limit (hard limit):
   - Every subtopic "name" MUST be at most 22 characters long (including spaces and "&").
   - Use crisp domain labels such as "Matrices & Rank" (15 chars), "Graph Traversal" (15 chars) or "Virtual Memory" (14 chars). Never exceed 22 characters.

2. Graph size and grid limits:
   - Include between 6 and 11 subtopics total.
   - Use 3 to 5 vertical layers (layer 0 at the top through layer 3 or 4 at the bottom).
   - Place at most 3 subtopics in any single layer so cards fit comfortably side by side.

3. Directed Acyclic Graph (DAG):
   - Edges represent prerequisite relationships ("from" must be studied before "to").
   - No cycles are permitted. Every edge must go strictly downward to a higher layer.

4. Adjacent-layer connections only (NEVER skip rows):
   - Every edge { "from": u, "to": v } MUST connect a node in layer L to a node in layer L + 1 (layer(v) === layer(u) + 1).
   - NEVER connect a node in layer L directly to a node in layer L + 2 or deeper.
   - If a later topic depends on an earlier track, place intermediate bridging topics in layer L + 1 so all edges remain layer-adjacent, or converge branches at a shared layer L -> L + 1.

5. Direct edges only (no transitive shortcuts):
   - Never add an edge A -> C if C is already reachable from A through another path (A -> B -> C).

6. Planar left-to-right branch ordering:
   - Splits (1 -> 2 or 3) and merges (2 -> 1, such as diamond prerequisites) are encouraged so the tree captures real topic dependencies.
   - Order subtopics within each layer in the "subtopics" array from left to right consistently with their parents so edges between adjacent layers do not cross one another.
   - Parallel branches must never cross over one another across layers.

Return ONLY valid JSON matching the schema above.`;

export const buildTechTreeUserPrompt = ( ctx: TechTreePromptContext ): string => {
    const sections: string[] = [ `Subject: ${ ctx.subjectName.trim() }` ];

    if ( ctx.assetNames && ctx.assetNames.length > 0 ) {
        sections.push( `Attached course materials:\n${ ctx.assetNames.map( name => `- ${ name }` ).join( '\n' ) }` );
    }

    if ( ctx.syllabusContext && ctx.syllabusContext.trim() ) {
        sections.push( `Syllabus or course notes:\n${ ctx.syllabusContext.trim() }` );
    }

    sections.push( 'Generate the prerequisite Tech Tree JSON now.' );

    return sections.join( '\n\n' );
};
