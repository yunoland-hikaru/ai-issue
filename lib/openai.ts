import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Returns raw image bytes so the caller can persist to permanent storage.
export async function generateImage(prompt: string): Promise<ArrayBuffer | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const tempUrl = response.data?.[0]?.url;
    if (!tempUrl) return null;

    // Download image bytes before the temporary URL expires
    const imgRes = await fetch(tempUrl);
    if (!imgRes.ok) return null;
    return await imgRes.arrayBuffer();
  } catch (e) {
    console.error('DALL-E generation failed:', e);
    return null;
  }
}
