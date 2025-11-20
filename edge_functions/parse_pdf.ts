
// Edge Function: parse-pdf
// Name suggestion: parse-pdf
// Uses: npm:pdf-parse

import pdf from "npm:pdf-parse@1.1.1";

/**
 * Helper to read the request's multipart/form-data and extract the file buffer.
 * Deno's Request doesn't provide a built-in multipart parser in the runtime,
 * but the global FormData API works when the request has form data.
 *
 * Note: On Supabase Edge Functions, the Request.json() / text() / formData() APIs are available.
 */
async function extractFileFromFormData(req: Request, fieldName = "file"): Promise<Uint8Array | null> {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) return null;
        const formData = await req.formData();
        const file = formData.get(fieldName);
        if (!file || !(file instanceof File)) return null;
        const arrayBuffer = await file.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (err) {
        console.error("extractFileFromFormData error:", err);
        return null;
    }
}

Deno.serve(async (req: Request) => {
    try {
        if (req.method !== "POST") {
            return new Response(JSON.stringify({ error: "Method not allowed. Use POST with multipart/form-data." }), {
                status: 405,
                headers: { "Content-Type": "application/json" },
            });
        }

        const fileBuffer = await extractFileFromFormData(req, "file");
        if (!fileBuffer) {
            return new Response(JSON.stringify({ error: "No file provided. Include a 'file' field in multipart/form-data." }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // pdf-parse accepts Buffer or Uint8Array
        const data = await pdf(fileBuffer);
        // data.text contains the extracted plain text
        const text = data?.text ?? "";

        return new Response(JSON.stringify({ text }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("parse-pdf error:", err);
        return new Response(JSON.stringify({ error: "Failed to parse PDF.", details: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});