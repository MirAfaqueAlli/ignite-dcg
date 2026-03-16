import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns: audio/mpeg stream using Microsoft Aria Neural (natural AI voice)
 */
export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text: string };
    if (!text?.trim()) {
      return new Response('Missing text', { status: 400 });
    }

    const tts = new MsEdgeTTS();

    // en-US-AriaNeural — warm, natural, female voice (free via MS Edge servers)
    await tts.setMetadata(
      'en-US-AriaNeural',
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    );

    const { audioStream } = await tts.toStream(text);

    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk as Uint8Array);
    }

    const total  = chunks.reduce((s, c) => s + c.byteLength, 0);
    const buffer = new Uint8Array(total);
    let offset   = 0;
    for (const c of chunks) { buffer.set(c, offset); offset += c.byteLength; }

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[TTS API]', err);
    return new Response('TTS error', { status: 500 });
  }
}
