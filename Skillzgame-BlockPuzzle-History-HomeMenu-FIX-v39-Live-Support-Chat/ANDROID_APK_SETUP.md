# Skillzgame Android APK — GitHub-friendly setup

This project now includes a lightweight Android WebView shell. The APK loads the deployed Skillzgame website, so normal React/Vite/backend updates can be pushed to GitHub and deployed without rebuilding the APK.

## 1. Configure the website URL

In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**.

Create:

- `WEB_APP_URL` = your production HTTPS Skillzgame URL

Example: `https://your-domain.example`

Do not put private API keys or database credentials in this value.

## 2. Build the APK

Open **Actions → Build Skillzgame APK → Run workflow**.

Choose the version name/code and run it. The workflow creates an APK artifact.

## 3. GitHub Releases

For player downloads, create a GitHub Release and upload the generated APK. Keep the release link stable (for example, always use the latest release URL) so the website's Download APK button can point there.

## 4. Web updates

Players normally do not need a new APK for website changes. After the GitHub/Vercel deployment finishes, the installed APK opens the updated web app.

A new APK is needed only when native Android behavior, app permissions, app icon, or the Android shell itself changes.

## 5. Important limitation

A direct APK downloaded from a website cannot silently install a new APK by itself. Android requires user confirmation for sideloaded APK updates. Google Play distribution is the easiest path if you later want Play-managed updates.
