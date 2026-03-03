# Hotel IQ — Session System

Each coding session gets a numbered file: `session-001.md`, `session-002.md`, etc.

## Start of every session
1. Read the latest session file first (highest number)
2. Note says "STATUS: HANDOFF → " with what to do next
3. Pick up exactly where the last session left off

## End of every session
1. Update the current session file → mark STATUS: COMPLETE
2. Create the NEXT session file → mark STATUS: HANDOFF
3. Commit everything

## File naming
sessions/session-NNN.md  (zero-padded to 3 digits)
