# Gemini Journal & Reflections

A user-authenticated reflective journaling and cognitive thinking partner powered by **Google Gemini 3.6 Flash** and backed by **Cloud Firestore** for secure, user-isolated document storage.

---

## Architecture & Security Highlights

1. **User Identity & Federated Authentication**:
   - Outsources credential management via **Firebase Authentication (Google Sign-In)**.
   - Strictly prohibits storing raw passwords or handling user credentials in application code.

2. **Zero-Trust Firestore Rules & User Isolation**:
   - All reflections and dialogue interactions are stored exclusively under:
     ```
     /users/{userId}/interactions/{interactionId}
     ```
   - Firestore security rules strictly enforce `request.auth.uid == userId` for both reads and writes. Cross-tenant reads/writes are blocked at the database engine level.

3. **Resilient Server-Side Gemini API Proxy**:
   - `GEMINI_API_KEY` is maintained strictly server-side inside an Express proxy layer to prevent exposure to client-side bundles.
   - Includes an automated model fallback ladder:
     1. Primary: `gemini-3.6-flash`
     2. High-Availability Fallback: `gemini-3.1-flash-lite`
     3. Dynamic Alias: `gemini-flash-latest`
     4. Deep Reasoning Fallback: `gemini-3.7-flash`
   - Handles recoverable errors (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`) with sequential retry before bubbling errors to the client.

4. **Zero-Crash Payload Sanitation**:
   - Payloads are recursively stripped of `undefined` values before touching the Firestore driver.
   - Transactional persistence guarantees that user entries and Gemini responses are stored immediately.

---

## Firestore Security Rules

Deploy the following rules via the Firebase Console or Firebase CLI to enforce user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Isolated interactions subcollection
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## Google Cloud Secret Manager Setup

To configure `GEMINI_API_KEY` securely in Google Cloud Secret Manager:

```bash
# 1. Enable required Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run runtime service account access to read the secret
# Replace PROJECT_NUMBER with your Google Cloud project number:
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Cloud Run Deployment

Deploy the full-stack container directly using `gcloud run deploy`:

```bash
# 1. Build and deploy container to Cloud Run
gcloud run deploy gemini-journal \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=3000

# 2. Apply mandatory campaign verification label
gcloud run services update gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## Functional Verification Walkthrough

The following step-by-step test matrix can be verified manually or by automated test scripts:

| Test Case | Step-by-Step Actions | Expected Result |
| :--- | :--- | :--- |
| **TC-01: Landing & Auth Guard** | 1. Open root application URL.<br>2. Verify Landing page renders with features and "Sign In with Google" button.<br>3. Inspect console for any leaks of `GEMINI_API_KEY`. | Unauthenticated users cannot access dashboard or journal entries. No secrets exposed. |
| **TC-02: Federated Login** | 1. Click "Sign In with Google".<br>2. Complete Google authentication popup.<br>3. Observe screen transition. | Authenticated session is established. User profile (avatar, name, email) appears in the top navigation bar. |
| **TC-03: Create New Reflection** | 1. Click "New Entry" on the sidebar.<br>2. Observe a new item added to the sidebar with temporary title "New Reflection".<br>3. Change title to "Morning Clarity". | Title is updated immediately in local state and persisted to Firestore under `/users/{uid}/interactions/{id}`. |
| **TC-04: Multi-Turn Dialogue** | 1. Type "I am feeling overwhelmed with three competing priorities." into composer.<br>2. Click "Send" or press Enter.<br>3. Verify user bubble appears.<br>4. Wait for Gemini 3.6 Flash response. | Gemini generates empathetic, structured observations. Both user message and AI response are written to Firestore. |
| **TC-05: Follow-Up Conversation** | 1. Type "Help me rank them by cognitive load." and send.<br>2. Wait for model reply. | Multi-turn context is maintained. Conversation thread persists across page refresh. |
| **TC-06: AI Reflection Summary** | 1. Click "AI Summary" button on top right.<br>2. Wait for Gemini synthesis. | Summary box renders at the top of the entry with concise themes and actionable takeaways. |
| **TC-07: Cross-User Isolation** | 1. Click "Sign Out".<br>2. Sign in with a different Google account.<br>3. Inspect the sidebar history list. | Second user sees an empty list or only their own reflections. Cannot read entries belonging to user 1. |
| **TC-08: Deletion & Cleanup** | 1. Hover over a reflection in the sidebar.<br>2. Click the trash icon and confirm dialog. | Reflection document is removed from Firestore and disappears from sidebar. |
