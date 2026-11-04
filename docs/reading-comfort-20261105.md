# Reading comfort and map details

Maps now open place and connection details inside the map. Readers can move
between places, focus the selected location, follow connected places and return
to cited passages. The expanded map stays open during selection. Location
sources and historical approximations remain visible; story connections do not
claim to trace exact roads.

Book text can reach 250%, with quick presets. Navigation and controls have an
independent size choice up to 150%; ruby keeps its own setting. Chapter and
language changes use short transitions that respect reduced-motion preferences.
Reading positions, guide selections and earlier conversations are preserved.

The reading service accepts complete JSON code fences, reserves time for a
qualified alternate model after transient failures, and keeps schema and source
checks in place. Cancellation and authentication errors do not trigger model
fallback. The server correction is deployed; no provider catalog was changed.

## Qualification

- Full lint, 187 client tests, server tests, renderer checks and production build
  passed. The focused provider recovery suite passed all 17 cases on the server.
- A real whole-book Faxian request completed with four people, six places and
  five events. Thirteen browser checks covered map interaction, saved reuse and
  phone/tablet/desktop widths. Six more covered independent text sizing up to
  250%/150%, including 320 px.
- Existing accounts, content, sessions and billing records were checked unchanged
  across deployment. Both current and legacy HTTPS service routes pass health.
- These browser results are not physical iOS, Watch, Monterey or Duo runtime
  qualification. Candidate 48 requires its separate native internal-delivery gates.

GitHub remains the only publicly enabled Bunko sign-in method at this checkpoint.
The optional central methods and canonical LAC consumer require their actual
app callback/consent qualification; this update does not advertise them as active.
