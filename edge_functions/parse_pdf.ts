// parse-pdf with CORS support
import pdf from "npm:pdf-parse@1.1.1";
const DEFAULT_ALLOWED_ORIGINS = "*"; // change to specific origin(s) for production, e.g. "https://app.example.com"
const ALLOWED_ORIGINS = Deno.env.get("ALLOWED_ORIGINS") ?? DEFAULT_ALLOWED_ORIGINS;
const ALLOWED_METHODS = "POST, OPTIONS";
const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type, accept";
/** Helper to create a Response with standard CORS headers */ function withCors(body, status = 200, extraHeaders = {}) {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGINS,
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        // Optional: allow credentials if you need cookies/auth
        // "Access-Control-Allow-Credentials": "true",
        ...extraHeaders
    };
    return new Response(body, {
        status,
        headers
    });
}
async function extractFileFromFormData(req, fieldName = "file") {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) return null;
        const formData = await req.formData();
        const file = formData.get(fieldName);
        if (!file || !(file instanceof File)) return null;
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (err) {
        console.error("extractFileFromFormData error:", err.message);
        return null;
    }
}
Deno.serve(async (req) => {
    try {
        // Handle preflight
        if (req.method === "OPTIONS") {
            // Optionally, you can inspect request.headers.get("Origin") and return 403 if not allowed
            return withCors(null, 204);
        }
        if (req.method !== "POST") {
            return withCors(JSON.stringify({
                error: "Method not allowed. Use POST with multipart/form-data."
            }), 405);
        }
        const fileBuffer = await extractFileFromFormData(req, "file");
        if (!fileBuffer) {
            return withCors(JSON.stringify({
                error: "No file provided. Include a 'file' field in multipart/form-data."
            }), 400);
        }
        const data = await pdf(fileBuffer);
        const text = data?.text ?? "";
        return withCors(JSON.stringify({
            text
        }), 200);
    } catch (err) {
        console.error("parse-pdf error:", err);
        return withCors(JSON.stringify({
            error: "Failed to parse PDF.",
            details: String(err.message)
        }), 500);
    }
});
