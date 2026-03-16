const fs = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

async function generate() {
  const eventPath = path.join(__dirname, '..', 'src', 'data', 'event.json');
  const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-US-AriaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const outDir = path.join(__dirname, '..', 'public', 'audio');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const slide of eventData.slides) {
    if (slide.speech) {
      console.log(`Generating audio for ${slide.id}...`);
      try {
        const { audioStream } = await tts.toStream(slide.speech);
        
        const chunks = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        
        const total = chunks.reduce((s, c) => s + c.byteLength, 0);
        const buffer = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) { buffer.set(c, offset); offset += c.byteLength; }
        
        fs.writeFileSync(path.join(outDir, `${slide.id}.mp3`), buffer);
        console.log(`Saved ${slide.id}.mp3`);
      } catch (err) {
        console.error(`Failed on ${slide.id}:`, err);
      }
    }
  }
}

generate().catch(console.error);
