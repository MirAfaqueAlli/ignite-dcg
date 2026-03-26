import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Polyfill __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/edithScript.json');
const audioDir = path.resolve(__dirname, '../public/audio');

// Make sure output dir exists
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Read the script
const rawData = fs.readFileSync(jsonPath, 'utf8');
const scriptData = JSON.parse(rawData);

async function generate() {
  const tts = new MsEdgeTTS();
  
  // Free Microsoft Edge natural voice
  await tts.setMetadata(
    'en-US-AriaNeural',
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );

  console.log('Starting offline audio generation...');

  for (const slide of scriptData.slides) {
    if (!slide.speech || !slide.id) {
      console.log(`Skipping ${slide.id} — no speech defined.`);
      continue;
    }

    const filepath = path.join(audioDir, `${slide.id}.mp3`);
    console.log(`Generating: ${slide.id}.mp3...`);

    const { audioStream } = await tts.toStream(slide.speech);
    
    // Convert readable stream to file
    const writeStream = fs.createWriteStream(filepath);
    
    for await (const chunk of audioStream) {
      writeStream.write(chunk);
    }
    
    writeStream.end();
    console.log(`✓ Saved ${slide.id}.mp3`);
  }

  console.log('\nAll audio files successfully generated in /public/audio!');
}

generate().catch(console.error);
