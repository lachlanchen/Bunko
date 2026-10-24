# Reading model routing

Bunko starts with DeepSeek Flash. A failed structured answer or unverified source
quotation can use DeepSeek Pro for the existing single repair attempt. A temporary
provider failure may also use the configured alternative. The overall deadline,
citation checks, provider consent and regional restriction still apply. Saved
answers reopen without another model call.

Administrator settings offer two choices: Default and For harder questions.
Only configured, qualified models are selectable. The catalog includes DeepSeek
Flash/Pro, GPT-6 Luna, GPT-5.6 Terra, GPT-6.1 Sol and GPT-6 Astra. Adding a catalog
entry does not grant API access.

Verified 25 October 2026: Bunko's DeepSeek account lists Flash and Pro; Pro returned
correct relationships for a small synthetic passage. The existing AiMemo OpenAI
API key returned a successful model inventory but none of the requested
Luna/Terra/Sol/Astra IDs. Those routes remain unavailable pending account access
and app-owned qualification. No OpenAI credential was copied or activated.

References: [DeepSeek model details](https://api-docs.deepseek.com/quick_start/pricing/),
[OpenAI model catalog](https://developers.openai.com/api/docs/models),
[GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra).
