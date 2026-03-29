# SecureNote Conceptual Report

## 1. JS Engine vs. Runtime
JavaScript relies on both an engine (which parses, compiles, and executes the language itself) and a runtime environment (which provides the APIs to interact with the outside world).

*   **Frontend (Browser):**
    *   **JS Engine:** Executes in the browser using engines like **V8** (Chrome/Edge), SpiderMonkey (Firefox), or JavaScriptCore (Safari). The engine compiles our vanilla JS code into machine code.
    *   **Runtime Environment:** The web browser itself acts as the runtime environment, providing the Web APIs we used (e.g., `document`, `fetch`, `localStorage`).
*   **Backend (Node.js):**
    *   **JS Engine:** Node.js also uses the **V8 Engine** to execute Javascript on the server side.
    *   **Runtime Environment:** **Node.js** is the runtime environment. Instead of Web APIs like the DOM, it provides internal C++ bindings for server operations (e.g., `fs` for the file system, network bindings, and environment variables via `process.env`).

## 2. DOM (Document Object Model) Update Mechanism
Since we chose **Path A (Vanilla JavaScript, HTML, CSS)**, the frontend dynamically updates the screen via **direct DOM tree manipulation**.

Unlike heavy frameworks (like React) that calculate interface changes using an abstraction called a Virtual DOM to minimize rendering costs, our app operates tightly and directly on the browser's native nodes:
1.  **Selection:** We interact with HTML elements immediately (`document.getElementById`).
2.  **Updating:** When a note is created, fetched, or deleted, our JavaScript explicitly issues commands like `document.createElement()` and `appendChild()` to inject new `div` node "cards" representing the notes directly into the live DOM tree.
3.  **Result:** The browser evaluates the new nodes, recalculates styles, and immediately repaints the screen dynamically without triggering a full page reload.

## 3. HTTP/HTTPS Cycle & Security
When a user clicks "Submit" to save a note:
1.  **Request:** The frontend `fetch()` API constructs an HTTP `POST` request dynamically requesting `http://localhost:3000/api/notes`.
    *   **Headers Sent:**
        *   `Content-Type: application/json` (Tells the Node.js Express server we are sending JSON format data).
        *   `Authorization: Bearer <SECRET_TOKEN>` (Attaches our token variable securely injected from our UI lock input).
    *   **Body:** A JSON-stringified payload containing the user's `title` and `content`.
2.  **Server Evaluation:** The Node.js Express server receives the request, parses the headers, triggers our `authenticateToken` middleware to accurately verify the token against `.env`, records the JSON body into `db.json`. 
3.  **Response:** The backend replies with HTTP status `201 Created` along with the newly created note object.

**Why HTTPS in Production?**
Over a standard HTTP network connection, all traffic—including data bodies and our `Authorization` header security token—is transmitted in **plaintext**. Without encryption, an attacker on the same network (e.g., a public Wi-Fi) could easily sniff the network packets, steal the `SECRET_TOKEN`, and view/delete private notes (a classic Man-in-the-Middle attack). **HTTPS** enforces TLS/SSL protocols encrypting the entire request-response cycle cryptographically so network observers see only scrambled gibberish.

## 4. Environment Variables
**Why store `SECRET_TOKEN` in the backend `.env` instead of frontend code?**
*   **Frontend code is completely public.** Anything written in `app.js`, HTML, or CSS is downloaded explicitly by the user's web browser so it can be parsed and rendered. If the `SECRET_TOKEN` was hardcoded inside the frontend fetch requests, literally anyone could right-click, select "Inspect", go to the Network/Sources tab, and instantly extract the plain token.
*   **The Backend `.env` remains exclusively private.** Environment variables reside privately on the server's OS process. A public visitor can *never* download the code powering an endpoint securely mapped server-side. By storing it natively in `.env` (and excluding it from Github via `.gitignore`), the token remains permanently inaccessible to clients.

**What happens if it were exposed?**
If a malicious actor acquired the `SECRET_TOKEN`, they could send automated HTTP script requests (via tools like Postman or `curl`) originating from anywhere in the world to arbitrarily list, manipulate, or delete all confidential internal notes, completely bypassing the visual frontend entirely.
