var fs = require('fs');
var path = require('path');
var TASK_DIR = 'D:/workspace/s-local/.haki/tasks';

// Template for migrated task files
function buildTask(requirementId, taskName, description, techNotes, dependencies, specRef) {
  var firstSentence = description.split('.')[0].trim();
  if (firstSentence && !firstSentence.endsWith('.')) firstSentence += '.';
  if (!firstSentence) firstSentence = taskName;

  var cd = '';
  if (description) cd += description + '\n\n';
  if (techNotes) cd += '**Technical Notes:** ' + techNotes + '\n\n';
  if (dependencies) cd += '**Dependencies:**\n' + dependencies + '\n\n';
  if (specRef) cd += '**Spec Reference:** ' + specRef + '\n';

  return '# Task ' + requirementId + ': ' + taskName + '\n\n' +
    '> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.\n\n' +
    '**Goal:** ' + firstSentence + '\n\n' +
    '**Architecture:** _not specified_\n\n' +
    '**Tech Stack:** _not specified_\n\n' +
    '---\n\n' +
    '## Context & Decisions\n\n' +
    cd +
    '---\n\n' +
    '## Implementation Steps\n\n' +
    '> **Filled during /haki:plan phase by the planner agent.**\n' +
    '> Each step: write test \u2192 verify FAIL \u2192 implement \u2192 verify PASS \u2192 commit.\n' +
    '> Each step \u2264 5 minutes of work.\n\n' +
    '> No implementation steps defined yet. Run `/haki:plan ' + requirementId + '` to generate steps.\n\n' +
    '---\n\n' +
    '## Implementation Details\n\n' +
    '> **Filled by the executing agent after each step.** Do NOT leave blank.\n\n' +
    '### Files Changed\n\n' +
    '| File | Action | Notes |\n' +
    '|------|--------|-------|\n' +
    '| _path_ | Created/Modified/Deleted | _brief description_ |\n\n' +
    '### Key Decisions & Deviations\n\n' +
    '- _Any deviation from the plan and why_\n' +
    "- _Runtime decision that wasn't in the plan_\n\n\n" +
    '---\n\n' +
    '## Execution Results\n\n' +
    '> **Filled by the executing agent after task completion.** Do NOT leave blank.\n\n' +
    '- **Test Results:** _e.g. 12/12 passed_\n' +
    '- **Build Status:** _e.g. \u2705 Clean build_\n' +
    '- **Lint Status:** _e.g. \u2705 No errors_\n' +
    '- **Issues Encountered:** _e.g. None / describe blockers_\n' +
    '- **Completed At:** _timestamp_\n\n\n' +
    '---\n\n' +
    '## Verification\n\n' +
    '- [ ] All tests pass\n' +
    '- [ ] Acceptance criteria from ROADMAP met\n' +
    '- [ ] No lint errors\n' +
    '- [ ] Implementation Details section filled\n' +
    '- [ ] Execution Results section filled\n';
}

// Extract the original task data from the current (broken) file content
// The broken file has title '# Task AUTH-01: phase-1-AUTH-01' and empty Context & Decisions
// We need to parse the old data from the file's current state
// Since first pass wrote correctly, the current state has NEW format
// So we need to read the SPEC REFERENCE from ROADMAP.md and reconstruct

// Actually, the SPEC data is in ROADMAP.md - let's read it from there
// Strategy: read ROADMAP.md and extract each task's Requirement+Acceptance Criteria

var ROADMAP_PATH = 'D:/workspace/s-local/.haki/ROADMAP.md';
var roadmap = fs.readFileSync(ROADMAP_PATH, 'utf8');

// Extract all task sections from ROADMAP
// Pattern: ### Task N.M: TASK_NAME (`task-slug`)
var taskBlocks = roadmap.match(/### Task [\d.]+: ([^\n(]+)[^\n]*\n\n\*\*Status:\*\* [^\n]+\n\*\*Priority:\*\* [^\n]+\n\*\*Dependencies:\*\* [^\n]+\n\*\*Plan:\*\*[^\n]+\n\n\*\*Requirements:\*\*\n([\s\S]*?)\n\n\*\*Acceptance Criteria:\*\*\n([\s\S]*?)(?=### Task |## Phase |## Requirement Coverage |## v1\.1|\n## |---$|$)/g);

if (!taskBlocks) {
  // Try alternate pattern
  taskBlocks = roadmap.match(/### Task [\d.]+: [^\n(]+[^\n]*\n\n\*\*Status:\*\*[^\n]*\n([\s\S]*?)(?=### Task |## Phase)/g);
}

console.log('Task blocks found in ROADMAP:', taskBlocks ? taskBlocks.length : 0);
if (taskBlocks) console.log('First block:', taskBlocks[0].substring(0, 200));
