import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// コンテンツポリシー拒否を減らすための安全ガイド。記事プロンプトに必ず付与する。
const SAFE_STYLE =
  '\n\nStyle & safety constraints: abstract, conceptual editorial illustration. ' +
  'Do NOT depict real, identifiable people or faces. No brand logos, trademarks, or product replicas. ' +
  'No text, letters, or watermarks. No violent, graphic, weapon, or disturbing content. ' +
  'Clean, modern, professional, suitable for a general-audience news site.';

// Returns raw image bytes so the caller can persist to permanent storage.
// gpt-image-1 returns base64 (no URL). 1536x1024 is the closest 16:9 landscape size.
// quality 'medium' でコスト約1/4（high比）に抑える。
export async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: prompt + SAFE_STYLE,
      n: 1,
      size: '1536x1024',
      quality: 'medium',
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
