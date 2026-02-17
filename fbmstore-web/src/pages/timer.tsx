import React, { useState, useEffect, useRef } from 'react';

// 1. DEFINIÇÃO DE TIPOS
type Modo = 'SIMPLES' | 'TREINO';
type Fase = 'SERIE' | 'DESCANSO' | 'FINALIZADO';

const TimerFBM: React.FC = () => {
  const [modo, setModo] = useState<Modo>('SIMPLES');
  const [tempoInput, setTempoInput] = useState<number>(1);
  const [unidade, setUnidade] = useState<'segundos' | 'minutos'>('segundos');
  const [seriesTotais, setSeriesTotais] = useState<number>(3);
  const [tempoDescanso, setTempoDescanso] = useState<number>(30);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [serieAtual, setSerieAtual] = useState<number>(1);
  const [fase, setFase] = useState<Fase>('SERIE');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. FUNÇÃO PARA SÍNTESE DE VOZ (TEXT-TO-SPEECH)
  const falar = (texto: string) => {
    // Cancela falas anteriores para não encavalar
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(texto);
    msg.lang = 'pt-BR';
    msg.rate = 1.2; // Velocidade levemente acelerada para dinâmica de treino
    window.speechSynthesis.speak(msg);
  };

  const gerenciarAudio = (action: 'play' | 'stop') => {
    if (!audioRef.current) return;
    if (action === 'play') {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 3. LÓGICA PRINCIPAL DO TIMER
  useEffect(() => {
    if (isActive && tempoRestante >= 0) {
      timerRef.current = setInterval(() => {
        
        // BIPE E CONTAGEM REGRESSIVA POR VOZ
        if (tempoRestante <= 5 && tempoRestante > 0) {
          gerenciarAudio('play');
          
          // Se for modo treino e estiver no descanso, faz a contagem por voz
          if (modo === 'TREINO' && fase === 'DESCANSO') {
            falar(String(tempoRestante));
          }
        }

        if (tempoRestante === 0) {
          gerenciarAudio('stop');
          
          if (modo === 'SIMPLES') {
            const novoTempo = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
            setTempoRestante(novoTempo);
          } else {
            handleProximaFase();
          }
        } else {
          setTempoRestante((prev) => prev - 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, tempoRestante, modo, fase]);

  // 4. TRANSIÇÃO DE FASES COM COMANDOS DE VOZ
  const handleProximaFase = () => {
    if (fase === 'SERIE') {
      if (serieAtual < seriesTotais) {
        setFase('DESCANSO');
        setTempoRestante(tempoDescanso);
        falar(`Descansar ${tempoDescanso} segundos`);
      } else {
        setFase('FINALIZADO');
        setIsActive(false);
        falar("Fim de treino, parabéns!");
      }
    } else if (fase === 'DESCANSO') {
      setFase('SERIE');
      setSerieAtual((prev) => prev + 1);
      const tSerie = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
      setTempoRestante(tSerie);
      falar("Agora!");
    }
  };

  // 5. FUNÇÃO INICIAR / PAUSAR
  const toggleTimer = () => {
    if (fase === 'FINALIZADO') {
      setSerieAtual(1);
      setFase('SERIE');
      const tInicial = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
      setTempoRestante(tInicial);
      setIsActive(true);
      return;
    }

    if (!isActive) {
      // Fix para habilitar áudio/voz no iOS
      gerenciarAudio('play');
      falar(""); 
      setTimeout(() => { if (!isActive) gerenciarAudio('stop'); }, 50);

      if (tempoRestante === 0) {
        const tInicial = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
        setTempoRestante(tInicial);
      }
    } else {
      gerenciarAudio('stop');
      window.speechSynthesis.cancel(); // Para a voz no pause
    }
    setIsActive(!isActive);
  };

  const resetar = () => {
    setIsActive(false);
    gerenciarAudio('stop');
    window.speechSynthesis.cancel();
    setTempoRestante(0);
    setSerieAtual(1);
    setFase('SERIE');
  };

  return (
    <div className={`min-h-[550px] flex flex-col items-center p-6 bg-white rounded-3xl shadow-2xl max-w-md mx-auto border transition-all ${fase === 'DESCANSO' && isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
      
      {/* BOTÃO VOLTAR */}
      <div className="w-full flex justify-start mb-6">
        <button 
          onClick={() => { window.speechSynthesis.cancel(); window.location.href = '/'; }} 
          style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}
        >
          <span>←</span> Voltar
        </button>
      </div>

      {/* SWITCH DE MODO */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-full border border-gray-200">
        <button onClick={() => { resetar(); setModo('SIMPLES'); }} className={`flex-1 py-2 rounded-lg font-bold text-[10px] transition-all ${modo === 'SIMPLES' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
          TIMER SIMPLES
        </button>
        <button onClick={() => { resetar(); setModo('TREINO'); }} className={`flex-1 py-2 rounded-lg font-bold text-[10px] transition-all ${modo === 'TREINO' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
          MODO TREINO
        </button>
      </div>

      {/* INPUTS CONFIG */}
      {!isActive && tempoRestante === 0 && (
        <div className="w-full space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Tempo</label>
              <input type="number" value={tempoInput} onChange={e => setTempoInput(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none" />
            </div>
            <div className="w-1/3">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Unid.</label>
              <select value={unidade} onChange={e => setUnidade(e.target.value as any)} className="w-full p-3 rounded-xl border border-gray-200 font-bold bg-white outline-none">
                <option value="segundos">SEG</option>
                <option value="minutos">MIN</option>
              </select>
            </div>
          </div>

          {modo === 'TREINO' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Séries</label>
                <input type="number" value={seriesTotais} onChange={e => setSeriesTotais(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Descanso (s)</label>
                <input type="number" value={tempoDescanso} onChange={e => setTempoDescanso(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATUS DISPLAY */}
      {(isActive || tempoRestante > 0 || fase === 'FINALIZADO') && (
        <div className="mb-2">
          <span className={`px-4 py-1 rounded-full text-[10px] font-black text-white uppercase shadow-sm ${fase === 'SERIE' ? 'bg-indigo-600' : (fase === 'DESCANSO' ? 'bg-blue-500' : 'bg-green-600')}`}>
            {fase === 'FINALIZADO' ? 'TREINO CONCLUÍDO!' : (modo === 'SIMPLES' ? 'MODO LOOP' : (fase === 'SERIE' ? `Série ${serieAtual}/${seriesTotais}` : 'Descanso'))}
          </span>
        </div>
      )}

      {/* TIMER DISPLAY */}
      <div className={`text-8xl font-mono font-black mb-10 tabular-nums tracking-tighter transition-all ${tempoRestante <= 5 && isActive ? 'text-red-500 animate-pulse scale-110' : 'text-slate-800'}`}>
        {String(Math.floor(tempoRestante / 60)).padStart(2, '0')}:{String(tempoRestante % 60).padStart(2, '0')}
      </div>

      {/* BOTÕES */}
      <div className="w-full space-y-3 mt-auto">
        <button 
          onClick={toggleTimer}
          className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 ${isActive ? 'bg-amber-500 text-white' : (fase === 'FINALIZADO' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white')}`}
        >
          {isActive ? 'PAUSAR' : (fase === 'FINALIZADO' ? 'RECOMEÇAR TREINO' : 'INICIAR')}
        </button>

        {(isActive || tempoRestante > 0) && (
          <button onClick={resetar} className="w-full text-gray-400 font-bold text-xs hover:text-red-500 py-2 uppercase tracking-widest">
            Abandonar
          </button>
        )}
      </div>

      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" playsInline />
    </div>
  );
};

export default TimerFBM;