# Continuing a reading conversation

A saved reading conversation can grow over several visits. Add characters or
relationships to an existing graph, extend a route, or add events to a timeline.
Earlier results remain available in the conversation selector.

## Behavior

- Reopening the assistant selects the branch nearest the reading position and
  resumes its latest continuation. A single conversation remains accessible
  elsewhere in the book. Selecting another branch preserves the current draft.
- People, Places and Timeline inherit results from the selected conversation.
  Opening a view or refreshing saved history does not start generation.
- Follow-ups merge additions and explicit corrections. Stable identifiers keep
  existing people, connections and events; earlier quotations retain their
  original chapter and passage. A requested replacement can start a different map.
- Larger graphs can be filtered by faction or family. Compact groups use a
  circular layout, with a separate tree layout and zoom controls. Selecting a
  person or connection opens its details.
- Timeline markers distinguish quoted dates from dates based on broader book
  knowledge. Relative or uncertain dates remain in narrative order.

## Implementation and verification

Complex visual requests use the configured, qualified capable model immediately.
Simple requests retain the economical route. Provider consent and regional routing
still apply. A failed structured response receives one bounded repair using
already retrieved evidence. Provider tool identifiers are normalized across calls;
read-only tool names, arguments and results remain validated by AgInTiLite.

The reproduced failure exceeded the former 32-person response limit; its repair
then referenced a removed person. Exploration now accepts bounded larger results
and incremental changes, with cumulative limits of 128 people, 384 relationships,
96 places, 192 routes and 160 events. Reaching a limit requests a focused branch;
previous saved entries are not silently truncated.

The live backend passed a real two-turn graph continuation: the original 20 people
were retained and the result reached 45 people and 53 relationships. Original
snapshots remained unchanged, and a separate account received no private history.
The rollout preserved existing sessions, configuration and the stored-message
checksum. Both current and compatibility HTTPS health routes passed.

Local qualification: 183 client tests and 180 server tests, lint, renderer checks
and production compilation. Four Chromium layouts exercise nearest-branch
restoration, branch switching, drafts, graph grouping, selection, zoom and timeline
markers with synthetic transport. Native device/provider delivery is recorded
separately; these checks are not a physical iOS or Watch runtime claim.

The installed Android43 upgrade passed 7 reader checks and 10 continuing-workspace
checks. The workspace uses synthetic transport; real provider qualification is
recorded above. Signed APK/AAB resources match, and no QA fixture ships in release.

Build43 is the cumulative internal candidate. Public reviews and releases retain
their existing candidates until separately qualified and submitted.
