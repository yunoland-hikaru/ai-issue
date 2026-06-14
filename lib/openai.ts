import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Returns raw image bytes so the caller can persist to permanent storage.
// gpt-image-1 returns base64 (no URL). 1536x1024 is the closest 16:9 landscape size.
export async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'high',
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error('Image generation: no image data in response');
      return null;
    }
    return Buffer.from(b64, 'base64');
  } catch (e) {
    console.error('Image generation failed:', e);
    return null;
  }
}
