import React, { useState, useEffect, useRef } from 'react';

// 1. DEFINIÇÃO DE TIPOS E INTERFACES
type Modo = 'SIMPLES' | 'TREINO';
type Fase = 'SERIE' | 'DESCANSO' | 'FINALIZADO';

const TimerFBM: React.FC = () => {
  // Estados de Configuração
  const [modo, setModo] = useState<Modo>('SIMPLES');
  const [tempoInput, setTempoInput] = useState<number>(1);
  const [unidade, setUnidade] = useState<'segundos' | 'minutos'>('segundos');
  
  // Estados para Modo Treino
  const [seriesTotais, setSeriesTotais] = useState<number>(3);
  const [tempoDescanso, setTempoDescanso] = useState<number>(30);

  // Estados de Execução
  const [isActive, setIsActive] = useState<boolean>(false);
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [serieAtual, setSerieAtual] = useState<number>(1);
  const [fase, setFase] = useState<Fase>('SERIE');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 2. CONTROLE DE ÁUDIO REATIVO (FIX IOS)
  const gerenciarAudio = (action: 'play' | 'stop') => {
    if (!audioRef.current) return;
    if (action === 'play') {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 3. LOGICA DO TIMER (USEEFFECT CENTRAL)
  useEffect(() => {
    if (isActive && tempoRestante >= 0) {
      timerRef.current = setInterval(() => {
        
        // LOGICA DO BIPE (FALTANDO 5 SEGUNDOS)
        if (tempoRestante <= 5 && tempoRestante > 0) {
          gerenciarAudio('play');
        }

        if (tempoRestante === 0) {
          gerenciarAudio('stop');
          
          if (modo === 'SIMPLES') {
            // MODO ANTERIOR: REINICIA O LOOP INFINITO
            const novoTempo = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
            setTempoRestante(novoTempo);
          } else {
            // MODO TREINO: TRANSIÇÃO DE FASES
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
  }, [isActive, tempoRestante, modo, unidade, tempoInput]);

  // 4. TRANSIÇÃO DE FASES DO TREINO
  const handleProximaFase = () => {
    if (fase === 'SERIE') {
      if (serieAtual < seriesTotais) {
        setFase('DESCANSO');
        setTempoRestante(tempoDescanso);
      } else {
        setFase('FINALIZADO');
        setIsActive(false);
      }
    } else if (fase === 'DESCANSO') {
      setFase('SERIE');
      setSerieAtual((prev) => prev + 1);
      const tSerie = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
      setTempoRestante(tSerie);
    }
  };

  // 5. FUNÇÃO TOGGLE (PLAY / PAUSE / UNLOCK)
  const toggleTimer = () => {
    if (!isActive) {
      // Unlock Audio iOS
      gerenciarAudio('play');
      setTimeout(() => { if (!isActive) gerenciarAudio('stop'); }, 50);

      if (tempoRestante === 0 && fase !== 'FINALIZADO') {
        const tInicial = unidade === 'minutos' ? tempoInput * 60 : tempoInput;
        setTempoRestante(tInicial);
      }
    } else {
      gerenciarAudio('stop'); // Para o bipe no pause imediatamente
    }
    setIsActive(!isActive);
  };

  const resetar = () => {
    setIsActive(false);
    gerenciarAudio('stop');
    setTempoRestante(0);
    setSerieAtual(1);
    setFase('SERIE');
  };

    return (
    <div className={`min-h-[500px] flex flex-col items-center p-6 bg-white rounded-3xl shadow-2xl max-w-md mx-auto border transition-all ${fase === 'DESCANSO' && isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>
      
      {/* 1. BOTÃO VOLTAR PARA HOME - POSICIONADO NO TOPO ESQUERDO */}
      <div className="w-full flex justify-start mb-4">
        <button 
          onClick={() => window.location.href = '/'} // Ou use sua função goHome se estiver usando Router
          style={{ 
            background: 'white', 
            border: '1px solid #cbd5e1', 
            padding: '0.5rem 1rem', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#475569'
          }}
        >
          {/* Se não tiver o MdArrowBack instalado, pode usar um caractere: ← */}
          <span>←</span> Voltar
        </button>
      </div>
      
      {/* SWITCH DE MODO - UX SAAS PROFISSIONAL */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-8 w-full">
        <button 
          onClick={() => { resetar(); setModo('SIMPLES'); }}
          className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${modo === 'SIMPLES' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
        >
          TIMER SIMPLES
        </button>
        <button 
          onClick={() => { resetar(); setModo('TREINO'); }}
          className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${modo === 'TREINO' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
        >
          MODO TREINO (SÉRIES)
        </button>
      </div>

      {/* INPUTS DINÂMICOS CONFORME O MODO */}
      {!isActive && tempoRestante === 0 && (
        <div className="w-full space-y-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{modo === 'TREINO' ? 'Tempo Série' : 'Tempo'}</label>
              <input type="number" value={tempoInput} onChange={e => setTempoInput(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="w-1/3">
              <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Unid.</label>
              <select value={unidade} onChange={e => setUnidade(e.target.value as any)} className="w-full p-3 rounded-xl border border-gray-200 font-bold bg-white">
                <option value="segundos">SEG</option>
                <option value="minutos">MIN</option>
              </select>
            </div>
          </div>

          {modo === 'TREINO' && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Séries</label>
                <input type="number" value={seriesTotais} onChange={e => setSeriesTotais(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-400 ml-1 uppercase">Descanso (Seg)</label>
                <input type="number" value={tempoDescanso} onChange={e => setTempoDescanso(Number(e.target.value))} className="w-full p-3 rounded-xl border border-gray-200 font-bold" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATUS DISPLAY */}
      {isActive || tempoRestante > 0 ? (
        <div className="mb-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black text-white uppercase ${fase === 'SERIE' ? 'bg-indigo-600' : 'bg-blue-500'}`}>
            {modo === 'SIMPLES' ? 'MODO LOOP' : (fase === 'SERIE' ? `Série ${serieAtual}/${seriesTotais}` : 'Descanso')}
          </span>
        </div>
      ) : null}

      {/* TIMER DISPLAY */}
      <div className={`text-8xl font-mono font-black mb-10 tabular-nums tracking-tighter transition-all ${tempoRestante <= 5 && isActive ? 'text-red-500 animate-pulse scale-110' : 'text-slate-800'}`}>
        {String(Math.floor(tempoRestante / 60)).padStart(2, '0')}:{String(tempoRestante % 60).padStart(2, '0')}
      </div>

      {/* CONTROLES PRINCIPAIS */}
      <div className="w-full space-y-3">
        <button 
          onClick={toggleTimer}
          className={`w-full py-5 rounded-2xl font-black text-xl transition-all shadow-lg active:scale-95 ${isActive ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}
        >
          {isActive ? 'PAUSAR' : (tempoRestante > 0 ? 'RETOMAR' : 'INICIAR')}
        </button>

        {(isActive || tempoRestante > 0) && (
          <button onClick={resetar} className="w-full text-gray-400 font-bold text-sm hover:text-red-500 transition-colors">
            {fase === 'FINALIZADO' ? 'NOVO TREINO' : 'CANCELAR'}
          </button>
        )}
      </div>

      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" playsInline />
    </div>
  );
};

export default TimerFBM;