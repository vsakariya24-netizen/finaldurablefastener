import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!;
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')!;
const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL')!;

serve(async (req) => {
  try {
    const { fileName, fileType, fileData } = await req.json();

    // Extract base64 data
    const base64Data = fileData.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Create R2 upload URL
    const url = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}`;

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType,
        'Authorization': `AWS ${R2_ACCESS_KEY_ID}:${await getSignature(R2_SECRET_ACCESS_KEY, 'PUT', fileName, fileType)}`,
      },
      body: binaryData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 upload failed: ${uploadResponse.statusText}`);
    }

    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

    return new Response(
      JSON.stringify({ success: true, url: publicUrl, fileName }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function getSignature(secretKey: string, method: string, fileName: string, contentType: string): Promise<string> {
  // Simplified signature - in production use proper AWS Signature V4
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${method}\n\n${contentType}\n\n/${fileName}`)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}