# Switching Expo Accounts - Guide

## Steps to Switch to a Different Expo Account

### Step 1: Log Out of Current Account

```bash
cd mobile
eas logout
```

Or if using Expo CLI:
```bash
expo logout
```

### Step 2: Log In with New Account

```bash
eas login
```

Enter the credentials for your new Expo account.

### Step 3: Create or Link a New Project

You have two options:

#### Option A: Create a New Project (Recommended)

This will generate a new project ID for the new account:

```bash
cd mobile
eas init
```

This will:
- Ask if you want to create a new project
- Generate a new project ID
- Update `app.json` automatically with the new project ID

#### Option B: Link to Existing Project

If you already have a project in the new account:

```bash
cd mobile
eas init --id YOUR_EXISTING_PROJECT_ID
```

### Step 4: Verify Project ID

After running `eas init`, check that `app.json` has been updated:

```json
"extra": {
  "eas": {
    "projectId": "NEW_PROJECT_ID_HERE"
  }
}
```

### Step 5: Set EAS Secrets Again

**IMPORTANT:** EAS secrets are account/project-specific. You'll need to set them again:

```bash
cd mobile

# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://qxdbzcnsqqajcxpqcbyr.supabase.co"

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

### Step 6: Verify Account

Check which account you're logged in as:

```bash
eas whoami
```

---

## What Gets Changed

1. ✅ **Project ID** in `app.json` - Updated automatically by `eas init`
2. ✅ **EAS Secrets** - Need to be recreated (they're account-specific)
3. ✅ **Build History** - New account = new build history
4. ✅ **Credentials** - New account may need new signing certificates

---

## Important Notes

- **Old builds** from the previous account won't be accessible
- **EAS secrets** must be recreated (they don't transfer between accounts)
- **Project ID** will change (this is normal and expected)
- **Build credentials** may need to be regenerated

---

## Quick Reference Commands

```bash
# Log out
eas logout

# Log in
eas login

# Create new project
eas init

# Set secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_URL"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_KEY"

# Verify account
eas whoami

# List secrets
eas secret:list

# Build APK
eas build --platform android --profile preview
```



