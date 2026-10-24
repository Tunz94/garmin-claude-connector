# Garmin → Claude-connector

Prata med Claude om **din egen Garmin-data**: sömn, HRV, stress, Body Battery, vilopuls, steg, vikt och alla pass du någonsin registrerat. Det fungerar på claude.ai i webbläsaren, på datorn och i mobilen.

Den körs som din egen privata server på Cloudflares gratisnivå. Den skyddas av ett lösenord som bara du kan och använder Garmins officiella **Personal API-nyckel**. Datan går direkt från Garmin via din server till Claude. Ingen annan lagrar den.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Tunz94/garmin-claude-connector)

🇬🇧 [English guide](README.md)

---

## Det här behöver du (allt gratis utom Claude)

- Ett **Garmin Connect**-konto och en Garmin Personal API-nyckel
- Ett **Cloudflare**-konto (gratis)
- Ett **GitHub**-konto (gratis). Deploy-knappen kopierar projektet dit.
- Ett **Claude**-abonnemang där du kan lägga till egna connectors

Ingen installation på datorn behövs. Allt görs i webbläsaren, även på mobilen.

## Installation (cirka 15 minuter)

1. **Skapa Garmin-nyckeln.** Gå till **Inställningar → Personal API token** i Garmin Connect ([direktlänk](https://connect.garmin.com/app/settings/personalApiToken)) och skapa en nyckel. Håll den hemlig.
2. **Klicka på "Deploy to Cloudflare"** ovan. Logga in på Cloudflare och GitHub när du blir ombedd. Fyll sedan i:
   - **Git account:** välj ditt GitHub-konto och kryssa i **Create private Git repository**
   - `GARMIN_PERSONAL_API_KEY`: nyckeln från steg 1
   - `LOGIN_PASSWORD`: ett **nytt**, långt lösenord som du hittar på nu (minst 20 tecken). Spara det i din lösenordshanterare.
   - Låt resten vara som det är och klicka på **Deploy**.
3. **Kopiera adressen.** När bygget är klart får du en adress som ser ut så här: `https://garmin-claude-connector.<namn>.workers.dev`. Öppna den. Den ska visa *"The server is running."*
4. **Koppla Claude.** Gå till **Inställningar → Connectors → Add custom connector** på claude.ai:
   - Namn: `Garmin`
   - URL: din adress + `/mcp`, till exempel `https://garmin-claude-connector.<namn>.workers.dev/mcp`
   - Behåll förvalen som Claude hittar (*Sign in now*, *Use Claude's published identity*) och klicka på **Add → Connect**.
5. **Godkänn.** En sida som heter *"Connect Garmin data"* öppnas. Skriv ditt `LOGIN_PASSWORD` och klicka på **Approve**.
6. **Testa.** Starta en ny chatt, slå på Garmin och fråga: *"Hur har min sömn och Body Battery varit den här veckan?"*

## Underhåll

- **Garmin-nyckeln har gått ut** (den gäller i högst ett år): skapa en ny i Garmin Connect. Gå sedan till **Workers → garmin-claude-connector → Settings → Variables and Secrets** i Cloudflare, ändra `GARMIN_PERSONAL_API_KEY` och klicka på deploy.
- **Byta lösenord:** ändra `LOGIN_PASSWORD` på samma ställe. Ta sedan bort connectorn i Claude och lägg till den igen.
- **Stänga av:** radera workern i Cloudflare. Åtkomsten upphör direkt.

## Det här kan Claude läsa

Alla verktyg kan bara läsa. Ingenting kan ändras i ditt Garmin-konto.

Pass (hela historiken, varvtider och FIT-filer), dagssammanfattningar, sömn, HRV, stress, Body Battery, puls, steg, SpO2, vätskeintag, vikt, konditionsålder, pulszoner och profilinställningar.

## Säkerhet

- Hemligheterna lagras krypterade i ditt eget Cloudflare-konto. De finns aldrig i koden eller i chatten.
- Claude får en egen nyckel via OAuth när du har skrivit lösenordet. Den förnyas automatiskt och kan bara användas för att läsa.
- Felaktiga lösenord bromsas. Använd ett långt och unikt lösenord.
- Klistra aldrig in Garmin-nyckeln eller lösenordet i en chatt, ett mejl eller en skärmdump.

## Tack till och licens

Bygger på öppen källkod: [garmin-personal-mcp](https://github.com/Shape-Calendar/garmin-personal-mcp) (MIT) och Cloudflares [workers-oauth-provider](https://github.com/cloudflare/workers-oauth-provider). Projektet har MIT-licens.

Projektet har ingen koppling till Garmin eller Anthropic. Garmins Personal API är avsett för personligt bruk av din egen data. Följ Garmins villkor.
