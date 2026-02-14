import React, { useState, useEffect, useRef } from 'react';

// 1. COMPONENTE DE TIMER PROFISSIONAL COM FIX PARA IOS/IPHONE
const TimerFBM: React.FC = () => {
  const [tempo, setTempo] = useState<number>(1);
  const [unidade, setUnidade] = useState<'segundos' | 'minutos'>('segundos');
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. FUNÇÃO PARA FORMATAR O DISPLAY (MM:SS)
  const formatarDisplay = (segundos: number): string => {
    const m = String(Math.floor(segundos / 60)).padStart(2, '0');
    const s = String(segundos % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 3. LOGICA PRINCIPAL DO TIMER E DISPARO DO ALARME NOS 5 SEGUNDOS
  useEffect(() => {
    if (isActive && tempoRestante >= 0) {
      timerRef.current = setInterval(() => {
        
        // DISPARA O SOM QUANDO FALTAM 5 SEGUNDOS OU NO ZERO
        if (tempoRestante <= 5 && tempoRestante > 0) {
          // Tenta tocar o áudio
          const playPromise = audioRef.current?.play();
          
          // Tratamento para evitar erro de console se a promessa falhar
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn("Reprodução automática bloqueada pelo navegador:", error);
            });
          }
        }

        if (tempoRestante === 0) {
          const novoTempo = unidade === 'minutos' ? tempo * 60 : tempo;
          setTempoRestante(novoTempo);
        } else {
          setTempoRestante((prev) => prev - 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, tempoRestante, tempo, unidade]);

  // 4. FUNÇÃO PARA INICIAR O TIMER (COM FIX DE DESBLOQUEIO DE ÁUDIO PARA IOS)
  const handleStart = () => {
    /* FIX PARA IPHONE: Chamamos o .load() e um .play() seguido de .pause() 
       imediatamente no clique do botão. Isso "desbloqueia" o canal de áudio 
       para o navegador entender que o usuário autorizou sons.
    */
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      }).catch(() => {
        // Silencioso se falhar, o próximo play() dentro do timer funcionará
      });
    }

    const totalSegundos = unidade === 'minutos' ? tempo * 60 : tempo;
    setTempoRestante(totalSegundos);
    setIsActive(true);
  };

  // 5. FUNÇÃO PARA PARAR/RESETAR
  const handleStop = () => {
    setIsActive(false);
    setTempoRestante(0);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    /* CONTAINER PRINCIPAL COM ESTILIZAÇÃO SAAS */
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-auto border border-gray-100 font-sans">
      
      {/* TÍTULO E INPUTS */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Timer Pro FBM</h1>
      
      <div className="flex gap-2 mb-6 w-full">
        {/* INPUT DE VALOR AJUSTADO PARA MOBILE */}
        <input 
          type="number" 
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          min="1"
          className="w-full p-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        
        {/* SELECT DE UNIDADE */}
        <select 
          value={unidade}
          onChange={(e) => setUnidade(e.target.value as 'segundos' | 'minutos')}
          className="p-4 border border-gray-300 rounded-lg bg-gray-50 font-medium cursor-pointer"
        >
          <option value="segundos">Seg</option>
          <option value="minutos">Min</option>
        </select>
      </div>

      {/* DISPLAY DO CRONÔMETRO COM FEEDBACK VISUAL */}
      <div className={`text-7xl font-mono font-bold mb-8 tabular-nums ${tempoRestante <= 5 && isActive ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
        {formatarDisplay(tempoRestante)}
      </div>

      {/* AÇÕES COM BOTÕES GRANDES PARA MOBILE */}
      <div className="flex gap-4 w-full">
        <button 
          onClick={handleStart}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-transform active:scale-95"
        >
          INICIAR
        </button>
        <button 
          onClick={handleStop}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl transition-transform active:scale-95"
        >
          PARAR
        </button>
      </div>

      {/* ELEMENTO DE ÁUDIO COM PRELOAD PARA EVITAR DELAY NO IPHONE */}
      <audio 
        ref={audioRef}
        src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" 
        preload="auto" 
        playsInline
      />
    </div>
  );
};

export default TimerFBM;