# Share a book

Open **Share** from a book page or the reading toolbar. The shared link carries
the book title and opens a public preview with browser, app and store choices.
It does not include your reading position, notes or account details.

- **Share via…** opens the device's sharing options.
- **WeChat** uses the device share sheet. If WeChat blocks an app link, open the
  preview in your browser and use its app or store button.
- **Copy for EchoMind** copies the title and link for a conversation.
- **AiMemo · save to read later** copies a reading-list draft.
- **AiMemo · explore ideas** copies a draft asking about ideas in the book.

Paste the draft into the destination app and review it before sending. Direct
EchoMind and AiMemo receiving screens are being qualified separately; copying a
link does not send a message or create a memo.

## Integration

Canonical previews use
`https://bunko.lazying.art/bunko/share/book/<catalogue-id>`. Only books in the public
catalogue resolve. Preview metadata is escaped, generated without JavaScript and
read through the existing bounded book cache. Native book links use
`art.lazying.bunko://book/<catalogue-id>` in supporting builds.

The existing service hostname and login callback remain unchanged. Public share
previews carry no authentication or private document access.
