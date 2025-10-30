#!/usr/bin/env python3
"""
API script para integração do Kokoro TTS com Next.js
Uso: python kokoro_api.py <texto> <voice_id> <lang_code> <output_path>
"""

import sys
import tempfile
import soundfile as sf
from kokoro import KPipeline
import numpy as np

def generate_audio(text: str, voice: str, lang_code: str, output_path: str):
    """
    Gera áudio usando Kokoro TTS
    
    Args:
        text: Texto para converter em áudio
        voice: ID da voz (ex: "pf_dora", "af_heart")
        lang_code: Código do idioma (ex: "p", "a", "b")
        output_path: Caminho completo para salvar o arquivo WAV
    """
    try:
        print(f"Initializing Kokoro pipeline with lang_code: {lang_code}, voice: {voice}", file=sys.stderr)
        
        # Inicializar pipeline
        pipeline = KPipeline(lang_code=lang_code)
        
        # Limitar texto se for muito longo (para evitar demora)
        max_length = 500
        if len(text) > max_length:
            text = text[:max_length]
            print(f"Text truncated to {max_length} characters", file=sys.stderr)
        
        print(f"Generating audio for text: {text[:50]}...", file=sys.stderr)
        
        # Gerar áudio (não usar split_pattern para textos curtos - mais rápido)
        if len(text) < 200:
            # Texto curto - gera tudo de uma vez (mais rápido)
            generator = pipeline(text, voice=voice)
        else:
            # Texto longo - divide em sentenças
            generator = pipeline(text, voice=voice, split_pattern=r'(?<=[.!?])\s+')
        
        # Coletar todos os segmentos de áudio
        audios = []
        for gs, ps, audio in generator:
            audios.append(audio)
            print(f"Generated segment: {len(audio)} samples", file=sys.stderr)
        
        # Concatenar todos os segmentos
        if audios:
            audio_concat = np.concatenate(audios)
            print(f"Total audio length: {len(audio_concat)} samples ({len(audio_concat)/24000:.2f}s)", file=sys.stderr)
            
            # Salvar arquivo WAV (24kHz sample rate, 16-bit PCM para melhor qualidade)
            sf.write(output_path, audio_concat, 24000, subtype='PCM_16')
            print(f"Audio saved successfully: {output_path}", file=sys.stderr)
            return True
        else:
            print("No audio generated", file=sys.stderr)
            return False
            
    except Exception as e:
        print(f"Error generating audio: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False

def main():
    if len(sys.argv) != 5:
        print("Usage: kokoro_api.py <text> <voice_id> <lang_code> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    voice = sys.argv[2]
    lang_code = sys.argv[3]
    output_path = sys.argv[4]
    
    success = generate_audio(text, voice, lang_code, output_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
