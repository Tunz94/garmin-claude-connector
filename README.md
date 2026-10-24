# Garmin → Claude connector

Talk to Claude about **your own Garmin data**: sleep, HRV, stress, Body Battery, resting heart rate, steps, weight and every activity you've ever recorded. It works in claude.ai on the web, on desktop and on mobile.

It runs as your own private server on Cloudflare's free tier. It's protected by a password only you know and uses Garmin's official **Personal API key**. Your data goes straight from Garmin to your server to Claude. Nobody else stores it.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Tunz94/garmin-claude-connector)

🇸🇪 [Svensk guide](README.sv.md)

---

## What you need (all free except Claude)

- A **Garmin Connect** account and a Garmin Personal API key
- A **Cloudflare** account (free)
- A **GitHub** account (free). The deploy button copies this project into it.
- A **Claude** plan that lets you add custom connectors

No computer setup is needed. Everything works in a browser, even on a phone.

## Setup (about 15 minutes)

1. **Create your Garmin key.** In Garmin Connect, go to **Settings → Personal API token** ([direct link](https://connect.garmin.com/app/settings/personalApiToken)) and create a key. Keep it private.
2. **Click "Deploy to Cloudflare"** above. Sign in to Cloudflare and GitHub when asked. Then fill in:
   - **Git account:** pick your GitHub account and tick **Create private Git repository**
   - `GARMIN_PERSONAL_API_KEY`: the key from step 1
   - `LOGIN_PASSWORD`: a **new** long password that you invent now (20+ characters). Save it in your password manager.
   - Leave everything else as it is, and click **Deploy**.
3. **Copy your address.** When the deploy finishes you get an address like `https://garmin-claude-connector.<name>.workers.dev`. Open it. It should say *"The server is running."*
4. **Connect Claude.** In claude.ai go to **Settings → Connectors → Add custom connector**:
   - Name: `Garmin`
   - URL: your address + `/mcp`, e.g. `https://garmin-claude-connector.<name>.workers.dev/mcp`
   - Keep the detected defaults (*Sign in now*, *Use Claude's published identity*) and click **Add → Connect**.
5. **Approve.** A page called *"Connect Garmin data"* opens. Type your `LOGIN_PASSWORD` and click **Approve**.
6. **Try it.** In a new chat, turn on the Garmin connector and ask *"How was my sleep and Body Battery this week?"*

## Maintenance

- **Garmin key expired** (keys last up to a year): create a new one in Garmin Connect. Then in Cloudflare go to **Workers → garmin-claude-connector → Settings → Variables and Secrets**, edit `GARMIN_PERSONAL_API_KEY` and deploy.
- **Change the password:** edit `LOGIN_PASSWORD` in the same place, then remove and re-add the connector in Claude.
- **Turn it off:** delete the Worker in Cloudflare. Access stops immediately.

## What Claude can read

All tools are read-only. Nothing can be changed in your Garmin account.

Activities (full history, splits, FIT recordings), daily summaries, sleep, HRV, stress, Body Battery, heart rate, steps, SpO2, hydration, weight, fitness age, heart-rate zones and profile settings.

## Security

- Secrets are stored encrypted in your own Cloudflare account. They are never in the code or in the chat.
- Claude gets its own token through OAuth after you type the password. Tokens refresh automatically and can't be used for anything except reading.
- Wrong passwords are slowed down. Use a long, unique password.
- Never paste your Garmin key or password into a chat, email or screenshot.

## Credits and license

Built on the open-source [garmin-personal-mcp](https://github.com/Shape-Calendar/garmin-personal-mcp) (MIT) and Cloudflare's [workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider). This project is MIT licensed.

Not affiliated with Garmin or Anthropic. The Garmin Personal API is intended for personal use of your own data. Follow Garmin's terms.
