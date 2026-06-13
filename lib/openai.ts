import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
    });
    return response.data[0]?.url ?? null;
  } catch (e) {
    console.error('DALL-E generation failed:', e);
    return null;
  }
}
