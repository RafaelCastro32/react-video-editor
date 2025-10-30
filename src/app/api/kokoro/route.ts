import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Lista de vozes disponíveis no Kokoro
export const KOKORO_VOICES = [
  // American English
  { id: "af_heart", name: "Heart (Female)", lang: "en-US", gender: "female" },
  { id: "af_alloy", name: "Alloy (Female)", lang: "en-US", gender: "female" },
  { id: "af_bella", name: "Bella (Female)", lang: "en-US", gender: "female" },
  { id: "af_nova", name: "Nova (Female)", lang: "en-US", gender: "female" },
  { id: "af_sarah", name: "Sarah (Female)", lang: "en-US", gender: "female" },
  { id: "am_adam", name: "Adam (Male)", lang: "en-US", gender: "male" },
  { id: "am_eric", name: "Eric (Male)", lang: "en-US", gender: "male" },
  { id: "am_liam", name: "Liam (Male)", lang: "en-US", gender: "male" },
  { id: "am_michael", name: "Michael (Male)", lang: "en-US", gender: "male" },
  
  // British English
  { id: "bf_alice", name: "Alice (Female)", lang: "en-GB", gender: "female" },
  { id: "bf_emma", name: "Emma (Female)", lang: "en-GB", gender: "female" },
  { id: "bm_daniel", name: "Daniel (Male)", lang: "en-GB", gender: "male" },
  { id: "bm_george", name: "George (Male)", lang: "en-GB", gender: "male" },
  
  // Brazilian Portuguese
  { id: "pf_dora", name: "Dora (Feminino)", lang: "pt-BR", gender: "female" },
  { id: "pm_alex", name: "Alex (Masculino)", lang: "pt-BR", gender: "male" },
  
  // Spanish
  { id: "ef_dora", name: "Dora (Femenino)", lang: "es", gender: "female" },
  { id: "em_alex", name: "Alex (Masculino)", lang: "es", gender: "male" },
  
  // French
  { id: "ff_siwis", name: "Siwis (Féminin)", lang: "fr", gender: "female" },
  
  // Italian
  { id: "if_sara", name: "Sara (Femminile)", lang: "it", gender: "female" },
  { id: "im_nicola", name: "Nicola (Maschile)", lang: "it", gender: "male" },
];

// Mapeamento de lang_code para Kokoro
const LANG_CODES: Record<string, string> = {
  "en-US": "a", "en-GB": "b", "pt-BR": "p", "es": "e", 
  "fr": "f", "it": "i", "ja": "j", "zh": "z", "hi": "h"
};

export async function GET(request: NextRequest) {
  try {
    // Retorna lista de vozes disponíveis
    return NextResponse.json({ voices: KOKORO_VOICES });
  } catch (error: any) {
    console.error("Error fetching Kokoro voices:", error);
    return NextResponse.json(
      { error: "Failed to fetch voices", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice } = body;

    if (!text || !voice) {
      return NextResponse.json(
        { error: "Text and voice are required" },
        { status: 400 }
      );
    }

    // Encontrar a voz e determinar lang_code
    const selectedVoice = KOKORO_VOICES.find(v => v.id === voice);
    if (!selectedVoice) {
      return NextResponse.json(
        { error: "Invalid voice selected" },
        { status: 400 }
      );
    }

    const langCode = LANG_CODES[selectedVoice.lang] || "a";

    // Caminho para o script Python e ambiente virtual
    const projectRoot = process.cwd();
    const pythonScript = path.join(projectRoot, "kokoro_api.py");
    const venvPython = process.platform === "win32" 
      ? path.join(projectRoot, "venv", "Scripts", "python.exe")
      : path.join(projectRoot, "venv", "bin", "python");

    // Criar arquivo temporário para o áudio
    const tempDir = path.join(projectRoot, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const audioFileName = `kokoro_${Date.now()}.wav`;
    const audioPath = path.join(tempDir, audioFileName);

    // Executar script Python
    const pythonProcess = spawn(venvPython, [
      pythonScript,
      text,
      voice,
      langCode,
      audioPath
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const exitCode = await new Promise<number>((resolve) => {
      pythonProcess.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error("Python script error:", stderr);
      return NextResponse.json(
        { error: "Failed to generate audio", details: stderr },
        { status: 500 }
      );
    }

    // Ler arquivo de áudio gerado
    const audioBuffer = await fs.promises.readFile(audioPath);
    const audioBase64 = audioBuffer.toString("base64");

    // Limpar arquivo temporário
    await unlink(audioPath).catch(console.error);

    return NextResponse.json({
      success: true,
      audio: `data:audio/wav;base64,${audioBase64}`,
      voice: selectedVoice,
      text
    });

  } catch (error: any) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: "Failed to generate audio", details: error.message },
      { status: 500 }
    );
  }
}
