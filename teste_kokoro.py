



import gradio as gr
import os
import tempfile
import soundfile as sf
from kokoro import KPipeline

# Lista de vozes reais do Kokoro-TTS
VOICES = [
    # American English
    "af_heart", "af_alloy", "af_aoede", "af_bella", "af_jessica", "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky",
    "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck", "am_santa",
    # British English
    "bf_alice", "bf_emma", "bf_isabella", "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis",
    # Japanese
    "jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo",
    # Mandarin Chinese
    "zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi", "zm_yunjian", "zm_yunxi", "zm_yunxia", "zm_yunyang",
    # Spanish
    "ef_dora", "em_alex", "em_santa",
    # French
    "ff_siwis",
    # Hindi
    "hf_alpha", "hf_beta", "hm_omega", "hm_psi",
    # Italian
    "if_sara", "im_nicola",
    # Brazilian Portuguese
    "pf_dora", "pm_alex", "pm_santa"
]

# Mapeamento de idioma para lang_code do Kokoro
LANG_CODES = {
    "af_heart": "a", "af_alloy": "a", "af_aoede": "a", "af_bella": "a", "af_jessica": "a", "af_kore": "a", "af_nicole": "a", "af_nova": "a", "af_river": "a", "af_sarah": "a", "af_sky": "a",
    "am_adam": "a", "am_echo": "a", "am_eric": "a", "am_fenrir": "a", "am_liam": "a", "am_michael": "a", "am_onyx": "a", "am_puck": "a", "am_santa": "a",
    "bf_alice": "b", "bf_emma": "b", "bf_isabella": "b", "bf_lily": "b", "bm_daniel": "b", "bm_fable": "b", "bm_george": "b", "bm_lewis": "b",
    "jf_alpha": "j", "jf_gongitsune": "j", "jf_nezumi": "j", "jf_tebukuro": "j", "jm_kumo": "j",
    "zf_xiaobei": "z", "zf_xiaoni": "z", "zf_xiaoxiao": "z", "zf_xiaoyi": "z", "zm_yunjian": "z", "zm_yunxi": "z", "zm_yunxia": "z", "zm_yunyang": "z",
    "ef_dora": "e", "em_alex": "e", "em_santa": "e",
    "ff_siwis": "f",
    "hf_alpha": "h", "hf_beta": "h", "hm_omega": "h", "hm_psi": "h",
    "if_sara": "i", "im_nicola": "i",
    "pf_dora": "p", "pm_alex": "p", "pm_santa": "p"
}

pipeline_cache = {}

def responder(texto, voz):
    lang_code = LANG_CODES.get(voz, "a")
    if lang_code not in pipeline_cache:
        pipeline_cache[lang_code] = KPipeline(lang_code=lang_code)
    pipeline = pipeline_cache[lang_code]
    generator = pipeline(texto, voice=voz)
    gs, ps, audio = next(generator)
    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    sf.write(temp_audio.name, audio, 24000)
    return texto, temp_audio.name

def salvar_gravacao(audio_path):
    destino = os.path.join("gravacoes", os.path.basename(audio_path))
    os.makedirs("gravacoes", exist_ok=True)
    with open(audio_path, "rb") as src, open(destino, "wb") as dst:
        dst.write(src.read())
    return f"Gravação salva em: {destino}"


# Mapeamento de vozes por idioma (colocado antes da UI)
VOICES_BY_LANG = {
    "a": ["af_heart", "af_alloy", "af_aoede", "af_bella", "af_jessica", "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky", "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck", "am_santa"],
    "b": ["bf_alice", "bf_emma", "bf_isabella", "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis"],
    "j": ["jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo"],
    "z": ["zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi", "zm_yunjian", "zm_yunxi", "zm_yunxia", "zm_yunyang"],
    "e": ["ef_dora", "em_alex", "em_santa"],
    "f": ["ff_siwis"],
    "h": ["hf_alpha", "hf_beta", "hm_omega", "hm_psi"],
    "i": ["if_sara", "im_nicola"],
    "p": ["pf_dora", "pm_alex", "pm_santa"]
}

with gr.Blocks(theme=gr.themes.Soft()) as app:
    gr.Markdown("""
    <div style='text-align:center;'>
        <h1 style='color:#4F8A8B;'>Kokoro-82M - Texto para Voz</h1>
        <p>Cole ou digite seu texto, escolha o idioma e a voz, ouça e salve a gravação.</p>
    </div>
    """)
    with gr.Row():
        with gr.Column(scale=2):
            texto = gr.Textbox(label="Texto", placeholder="Cole ou digite aqui...", lines=12)
            idioma = gr.Dropdown(label="Idioma", choices=[
                ("🇺🇸 Inglês Americano", "a"),
                ("🇬🇧 Inglês Britânico", "b"),
                ("🇯🇵 Japonês", "j"),
                ("🇨🇳 Mandarim", "z"),
                ("🇪🇸 Espanhol", "e"),
                ("🇫🇷 Francês", "f"),
                ("🇮🇳 Hindi", "h"),
                ("🇮🇹 Italiano", "i"),
                ("🇧🇷 Português BR", "p")
            ], value="p")
            # inicializa o dropdown de vozes já com as escolhas em português e pf_dora selecionada
            voz = gr.Dropdown(label="Voz", choices=VOICES_BY_LANG.get("p", []), value="pf_dora")
            gerar_btn = gr.Button("Gerar áudio", elem_id="btn-gerar")
        with gr.Column(scale=1):
            audio = gr.Audio(label="Gravação gerada", type="filepath", interactive=False)
            salvar_btn = gr.Button("Salvar gravação", elem_id="btn-salvar")
            salvar_saida = gr.Textbox(label="Status da gravação", interactive=False)

    # Mapeamento de vozes por idioma
    VOICES_BY_LANG = {
        "a": ["af_heart", "af_alloy", "af_aoede", "af_bella", "af_jessica", "af_kore", "af_nicole", "af_nova", "af_river", "af_sarah", "af_sky", "am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam", "am_michael", "am_onyx", "am_puck", "am_santa"],
        "b": ["bf_alice", "bf_emma", "bf_isabella", "bf_lily", "bm_daniel", "bm_fable", "bm_george", "bm_lewis"],
        "j": ["jf_alpha", "jf_gongitsune", "jf_nezumi", "jf_tebukuro", "jm_kumo"],
        "z": ["zf_xiaobei", "zf_xiaoni", "zf_xiaoxiao", "zf_xiaoyi", "zm_yunjian", "zm_yunxi", "zm_yunxia", "zm_yunyang"],
        "e": ["ef_dora", "em_alex", "em_santa"],
        "f": ["ff_siwis"],
        "h": ["hf_alpha", "hf_beta", "hm_omega", "hm_psi"],
        "i": ["if_sara", "im_nicola"],
        "p": ["pf_dora", "pm_alex", "pm_santa"]
    }

    def atualizar_vozes(lang):
        return gr.update(choices=VOICES_BY_LANG.get(lang, []), value=VOICES_BY_LANG.get(lang, [None])[0])

    idioma.change(atualizar_vozes, inputs=[idioma], outputs=[voz])

    def processar(texto, idioma, voz):
        # Processa texto longo em múltiplos segmentos
        if idioma not in pipeline_cache:
            pipeline_cache[idioma] = KPipeline(lang_code=idioma)
        pipeline = pipeline_cache[idioma]
        generator = pipeline(texto, voice=voz, split_pattern=r'(?<=[.!?])\s+')
        # Junta todos os áudios gerados
        audios = []
        for gs, ps, audio in generator:
            audios.append(audio)
        import numpy as np
        if audios:
            audio_concat = np.concatenate(audios)
            temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            sf.write(temp_audio.name, audio_concat, 24000)
            return temp_audio.name
        else:
            return None

    def salvar(audio_path):
        return salvar_gravacao(audio_path)

    gerar_btn.click(processar, inputs=[texto, idioma, voz], outputs=[audio])
    salvar_btn.click(salvar, inputs=[audio], outputs=[salvar_saida])

if __name__ == "__main__":
    app.launch()
