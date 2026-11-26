import {
    buildProfessorSystemPrompt,
    parseProfessorResponse
} from '../professor-mode.ts';
import assert from 'node:assert/strict';
import test from 'node:test';

test( 'buildProfessorSystemPrompt includes subtopic, materials and bullet/length preferences', () => {
    const prompt = buildProfessorSystemPrompt( {
        'subtopicName': 'Eigenvalues',
        'chatName': 'Professor #1',
        'assetNames': [ 'Linear Algebra Ch 4' ],
        'settings': {
            'answerLength': 'short',
            'answerInBulletPoints': true
        },
        'currentProgress': 25,
        'checkpointActive': false
    } );

    assert.match( prompt, /Eigenvalues/ );
    assert.match( prompt, /Linear Algebra Ch 4/ );
    assert.match( prompt, /3 to 4 sentences/ );
    assert.match( prompt, /bullet points/ );
    assert.match( prompt, /concept milestone/ );
    assert.match( prompt, /proactively initiate/ );
} );

test( 'parseProfessorResponse parses fenced JSON with checkpoint flags', () => {
    const raw = `\`\`\`json
{
  "reply": "Nice explanation of eigenvectors!",
  "summary": "Passed eigenvector checkpoint",
  "isCheckpointPrompt": false,
  "checkpointPassed": true
}
\`\`\``;
    const parsed = parseProfessorResponse( raw );

    assert.equal( parsed.reply, 'Nice explanation of eigenvectors!' );
    assert.equal( parsed.summary, 'Passed eigenvector checkpoint' );
    assert.equal( parsed.isCheckpointPrompt, false );
    assert.equal( parsed.checkpointPassed, true );
} );

test( 'parseProfessorResponse falls back cleanly on plain text output', () => {
    const parsed = parseProfessorResponse( 'An eigenvector keeps its direction under a linear map.' );

    assert.equal( parsed.reply, 'An eigenvector keeps its direction under a linear map.' );
    assert.equal( parsed.checkpointPassed, false );
    assert.equal( parsed.isCheckpointPrompt, false );
} );
