# Setting Environment Variables for EAS Builds

## Problem
Environment variables from `.env` files are **NOT automatically included** in EAS builds (APK/IPA). You need to configure them separately.

## Solution: Use EAS Secrets

### Step 1: Set EAS Secrets

Run these commands in the `mobile/` directory:

```bash
cd mobile

# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

**Important:** Replace the values with your actual Supabase credentials from your `.env` file.

### Step 2: Verify Secrets

Check that secrets are set:

```bash
eas secret:list
```

You should see:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Rebuild APK

After setting secrets, rebuild your APK:

```bash
eas build --platform android --profile preview
```

The environment variables will now be included in the build.

---

## Alternative: Update Existing Secrets

If secrets already exist, update them:

```bash
# Update URL
eas secret:update --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"

# Update Key
eas secret:update --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

---

## Finding Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** → **API**
3. Copy:
   - **Project URL** → Use for `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## Notes

- EAS secrets are stored securely and encrypted
- They are automatically injected during the build process
- No need to commit secrets to git (they're stored in EAS)
- Secrets are scoped to your project, so all builds use them

---

## Troubleshooting

If the APK still shows "Supabase is not configured":

1. **Verify secrets are set:**
   ```bash
   eas secret:list
   ```

2. **Check secret names match exactly:**
   - Must be: `EXPO_PUBLIC_SUPABASE_URL`
   - Must be: `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Case-sensitive!

3. **Rebuild after setting secrets:**
   - Old builds don't have the secrets
   - You must create a new build

4. **Check build logs:**
   ```bash
   eas build:list
   eas build:view [build-id]
   ```
   Look for environment variable injection in the logs


