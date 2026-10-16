import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AIStatus } from '../../types/interview';
import { CircularEqualizer } from './CircularEqualizer';
import { audioVisualizerService } from '../../services/audioVisualizer';
import { Mic, Volume2, Cpu, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

export interface AIInterviewerAvatarProps {
  status: AIStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusBadge?: boolean;
  showControls?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const AIInterviewerAvatar: React.FC<AIInterviewerAvatarProps> = ({
  status = 'idle',
  size = 'lg',
  showStatusBadge = true,
  showControls = false,
  onRetry,
  className = ''
}) => {
  // Real-time audio reactive level (0.0 to 1.0)
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));

  // Natural facial animation states
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [visemeIndex, setVisemeIndex] = useState<number>(0);
  const [headTilt, setHeadTilt] = useState<{ x: number; y: number; rotate: number }>({ x: 0, y: 0, rotate: 0 });

  // Fallback indicator
  const [hasAvatarError, setHasAvatarError] = useState<boolean>(false);

  // Sizing matrix
  const sizeMap = {
    sm: { container: 180, avatar: 140, badge: 'text-xs py-1 px-3' },
    md: { container: 240, avatar: 190, badge: 'text-xs py-1.5 px-3.5' },
    lg: { container: 320, avatar: 250, badge: 'text-sm py-1.5 px-4' },
    xl: { container: 400, avatar: 320, badge: 'text-base py-2 px-5' }
  };

  const currentSize = sizeMap[size];

  // Subscribe to audio visualizer
  useEffect(() => {
    if (status === 'speaking') {
      audioVisualizerService.startSpeechSimulation();
    } else if (status === 'listening') {
      audioVisualizerService.startMicrophoneCapture();
    } else {
      audioVisualizerService.stop();
    }

    const unsubscribe = audioVisualizerService.subscribe((lvl, freq) => {
      setAudioLevel(lvl);
      setFrequencyData(new Uint8Array(freq));
    });

    return () => {
      unsubscribe();
      audioVisualizerService.stop();
    };
  }, [status]);

  // Periodic natural blinking cycle
  useEffect(() => {
    let blinkTimeout: any;
    let unblinkTimeout: any;

    const scheduleNextBlink = () => {
      // Random blink every 3.2 to 6.0 seconds
      const delay = Math.random() * 2800 + 3200;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        // Eye closed duration 120ms to 160ms
        unblinkTimeout = setTimeout(() => {
          setIsBlinking(false);
          // 20% chance of an authentic double-blink
          if (Math.random() < 0.25) {
            setTimeout(() => {
              setIsBlinking(true);
              setTimeout(() => {
                setIsBlinking(false);
                scheduleNextBlink();
              }, 110);
            }, 140);
          } else {
            scheduleNextBlink();
          }
        }, 130);
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(unblinkTimeout);
    };
  }, []);

  // Procedural lip-sync viseme animation when speaking
  useEffect(() => {
    if (status !== 'speaking') {
      setVisemeIndex(0);
      return;
    }

    // Step through phonetic viseme mouth targets when speaking
    const visemeInterval = setInterval(() => {
      // Pick viseme driven by audio level dynamics
      if (audioLevel > 0.4) {
        setVisemeIndex(prev => (prev + 1) % 5);
      } else if (audioLevel > 0.15) {
        setVisemeIndex(prev => (prev % 2 === 0 ? 1 : 2));
      } else {
        setVisemeIndex(0); // resting/closed
      }
    }, 110);

    return () => clearInterval(visemeInterval);
  }, [status, audioLevel]);

  // Subtle natural head posture based on state
  useEffect(() => {
    switch (status) {
      case 'listening':
        // Attentive lean: slight right tilt (2.2 deg), slightly forward
        setHeadTilt({ x: 1, y: 1, rotate: 2.2 });
        break;
      case 'thinking':
      case 'analyzing':
        // Thoughtful glance: slight upward tilt (-1.5 deg), glance right
        setHeadTilt({ x: 2, y: -2, rotate: -1.8 });
        break;
      case 'speaking':
        // Conversational subtle nod
        setHeadTilt({ x: 0, y: Math.sin(Date.now() * 0.006) * 1.5, rotate: Math.sin(Date.now() * 0.004) * 0.8 });
        break;
      case 'error':
        // Sympathetic concerned tilt
        setHeadTilt({ x: -1, y: 1, rotate: -2.0 });
        break;
      case 'idle':
      default:
        setHeadTilt({ x: 0, y: 0, rotate: 0 });
        break;
    }
  }, [status, audioLevel]);

  // Color badges & labels per state
  const stateMeta = useMemo(() => {
    switch (status) {
      case 'speaking':
        return {
          label: 'Interviewer Speaking',
          icon: Volume2,
          iconClass: 'text-violet-300 animate-pulse',
          badgeClass: 'bg-violet-950/80 border-violet-500/60 text-violet-200 shadow-violet-500/20',
          glow: 'rgba(168, 85, 247, 0.4)'
        };
      case 'listening':
        return {
          label: 'Listening Attentively...',
          icon: Mic,
          iconClass: 'text-cyan-300 animate-bounce',
          badgeClass: 'bg-cyan-950/80 border-cyan-400/60 text-cyan-200 shadow-cyan-500/20',
          glow: 'rgba(6, 182, 212, 0.4)'
        };
      case 'thinking':
      case 'analyzing':
        return {
          label: status === 'analyzing' ? 'Synthesizing Session...' : 'Thinking & Analyzing...',
          icon: Cpu,
          iconClass: 'text-purple-300 animate-spin',
          badgeClass: 'bg-purple-950/80 border-purple-400/60 text-purple-200 shadow-purple-500/20',
          glow: 'rgba(192, 132, 252, 0.4)'
        };
      case 'error':
        return {
          label: 'Audio/Processing Issue',
          icon: AlertTriangle,
          iconClass: 'text-rose-400 animate-pulse',
          badgeClass: 'bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-500/20',
          glow: 'rgba(244, 63, 94, 0.4)'
        };
      case 'idle':
      default:
        return {
          label: 'Interviewer Ready',
          icon: CheckCircle2,
          iconClass: 'text-emerald-400',
          badgeClass: 'bg-slate-900/80 border-slate-700/60 text-slate-200 shadow-slate-900/40',
          glow: 'rgba(56, 189, 248, 0.2)'
        };
    }
  }, [status]);

  const StatusIcon = stateMeta.icon;

  // Render Mouth Path based on viseme index and audio intensity
  const renderMouth = () => {
    // Height opening proportional to audioLevel
    const openSpread = Math.min(14, audioLevel * 16);

    if (status === 'error') {
      // Sympathetic closed mouth
      return <path d="M 88 152 Q 100 148 112 152" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }

    if (status === 'listening') {
      // Attentive slight warm smile
      return <path d="M 88 150 Q 100 156 112 150" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }

    if (status === 'thinking') {
      // Neutral pensive line
      return <path d="M 89 152 L 111 152" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
    }

    if (status === 'speaking') {
      // Procedural visemes
      switch (visemeIndex) {
        case 1: // Slight opening
          return (
            <path
              d={`M 88 150 Q 100 ${153 + openSpread * 0.6} 112 150 Q 100 ${156 + openSpread * 0.8} 88 150`}
              fill="#be185d"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
          );
        case 2: // Vowel Open (Ah / Eh)
          return (
            <path
              d={`M 89 148 Q 100 ${156 + openSpread} 111 148 Q 100 ${162 + openSpread * 1.1} 89 148`}
              fill="#9d174d"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
          );
        case 3: // Wide (Ee / Consonant)
          return (
            <path
              d={`M 86 150 Q 100 ${154 + openSpread * 0.5} 114 150 Q 100 ${159 + openSpread * 0.7} 86 150`}
              fill="#831843"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
          );
        case 4: // Rounded (Oh / Oo)
          return (
            <ellipse
              cx="100"
              cy={152 + openSpread * 0.3}
              rx={6 + openSpread * 0.3}
              ry={5 + openSpread * 0.6}
              fill="#831843"
              stroke="#f472b6"
              strokeWidth="1.5"
            />
          );
        case 0:
        default: // Resting smile
          return (
            <path
              d={`M 88 151 Q 100 ${155 + openSpread * 0.3} 112 151`}
              stroke="#f1f5f9"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          );
      }
    }

    // Default Idle: Friendly professional resting smile
    return <path d="M 88 151 Q 100 156 112 151" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
  };

  // Pupil and eye gaze adjustments
  const eyeGaze = useMemo(() => {
    if (status === 'thinking' || status === 'analyzing') {
      return { pupilX: 2, pupilY: -2.5, browOffset: -3 }; // glancing up thoughtfully
    }
    if (status === 'listening') {
      return { pupilX: 0, pupilY: 0.5, browOffset: 1 }; // attentive focus
    }
    if (status === 'error') {
      return { pupilX: 0, pupilY: 1, browOffset: 2 }; // sympathetic look
    }
    return { pupilX: 0, pupilY: 0, browOffset: 0 };
  }, [status]);

  if (hasAvatarError) {
    // Robust Fallback Illustration
    return (
      <div className={`relative flex flex-col items-center justify-center ${className}`}>
        <div
          className="rounded-full bg-navy-900 border-2 border-cyan-500/40 flex items-center justify-center p-6 shadow-2xl"
          style={{ width: currentSize.avatar, height: currentSize.avatar }}
        >
          <Cpu className="w-16 h-16 text-cyan-400 animate-pulse" />
        </div>
        <p className="text-xs text-slate-400 mt-2 font-semibold">AI Interviewer Core (Fallback Mode)</p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>

      {/* Outer Circular Equalizer / Sound Wave Container */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: currentSize.container, height: currentSize.container }}
      >
        {/* Circular Audio Waveform surrounding avatar */}
        <CircularEqualizer
          status={status}
          audioLevel={audioLevel}
          frequencyData={frequencyData}
          size={currentSize.container}
          barCount={size === 'sm' ? 24 : size === 'md' ? 32 : 40}
        />

        {/* Ambient Backlight Glow behind the avatar capsule */}
        <div
          className="absolute inset-8 rounded-full blur-2xl transition-all duration-700 pointer-events-none opacity-70"
          style={{ background: `radial-gradient(circle, ${stateMeta.glow} 0%, transparent 70%)` }}
        />

        {/* Main Character SVG Vessel */}
        <div
          className="relative rounded-full overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-gradient-to-b from-navy-850 via-navy-900 to-navy-950 flex items-center justify-center transition-transform duration-300"
          style={{
            width: currentSize.avatar,
            height: currentSize.avatar,
            transform: `translate(${headTilt.x}px, ${headTilt.y}px) rotate(${headTilt.rotate}deg)`
          }}
        >

          {/* Studio Interview Backdrop & Subtle Cyber-Grid */}
          <div className="absolute inset-0 bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-900 opacity-95" />
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

          {/* Top Stage Spotlight */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-32 bg-cyan-400/10 rounded-full blur-xl pointer-events-none" />

          {/* Master Vector Character */}
          <svg
            viewBox="0 0 200 220"
            className="w-full h-full relative z-10 overflow-visible transition-transform duration-200"
            role="img"
            aria-label={`Animated AI Placement Interviewer in ${status} state`}
          >
            <defs>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd8c2" />
                <stop offset="60%" stopColor="#f7caa9" />
                <stop offset="100%" stopColor="#eab491" />
              </linearGradient>

              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="70%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>

              <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#111827" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>

              <linearGradient id="cyanLapelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>

              {/* Eye Clip for realistic eyelid blinking */}
              <clipPath id="leftEyeClip">
                <ellipse cx="80" cy="116" rx="9" ry="6.5" />
              </clipPath>
              <clipPath id="rightEyeClip">
                <ellipse cx="120" cy="116" rx="9" ry="6.5" />
              </clipPath>
            </defs>

            {/* --- TORSO & PROFESSIONAL ATTIRE --- */}
            {/* Gentle breathing movement on body */}
            <g className="transition-transform duration-700" style={{ transform: 'translateY(1px)' }}>

              {/* Shoulders & Business Suit Jacket */}
              <path
                d="M 28 220 C 35 186, 56 172, 80 168 L 120 168 C 144 172, 165 186, 172 220 Z"
                fill="url(#blazerGrad)"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1.5"
              />

              {/* Inner White Collared Placement Shirt */}
              <polygon points="84,168 100,195 116,168" fill="#f8fafc" />
              <polygon points="100,178 95,198 105,198" fill="#cbd5e1" />

              {/* Blazer Lapel Accents with Cyan Tech Piping */}
              <path d="M 64 176 L 86 215 L 100 205 L 82 170 Z" fill="#0f172a" stroke="url(#cyanLapelGrad)" strokeWidth="1" />
              <path d="M 136 176 L 114 215 L 100 205 L 118 170 Z" fill="#0f172a" stroke="url(#cyanLapelGrad)" strokeWidth="1" />

              {/* AI Badge / Smart Lapel Pin */}
              <rect x="68" y="190" width="10" height="7" rx="2" fill="#090d16" stroke="#06b6d4" strokeWidth="1" />
              <circle cx="73" cy="193.5" r="1.5" fill="#22d3ee" className={status === 'speaking' || status === 'listening' ? 'animate-ping' : ''} />
            </g>

            {/* --- NECK --- */}
            <rect x="91" y="148" width="18" height="24" rx="3" fill="#eab491" />
            <path d="M 91 156 Q 100 164 109 156" fill="#da9e7b" opacity="0.6" />

            {/* --- HEAD & FACE --- */}
            <g>
              {/* Ears */}
              <ellipse cx="62" cy="120" rx="5" ry="9" fill="#f7caa9" />
              <ellipse cx="138" cy="120" rx="5" ry="9" fill="#f7caa9" />
              {/* Discrete Wireless Smart Comm Earbud */}
              <circle cx="62" cy="122" r="2.5" fill="#06b6d4" opacity="0.9" />
              <circle cx="138" cy="122" r="2.5" fill="#8b5cf6" opacity="0.9" />

              {/* Main Facial Contour */}
              <path
                d="M 66 100 C 66 68, 134 68, 134 100 C 134 135, 118 160, 100 160 C 82 160, 66 135, 66 100 Z"
                fill="url(#skinGrad)"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.3))"
              />

              {/* Soft Cheeks / Warmth */}
              <circle cx="76" cy="132" r="6" fill="#f43f5e" opacity="0.12" />
              <circle cx="124" cy="132" r="6" fill="#f43f5e" opacity="0.12" />

              {/* Hair Base & Bangs */}
              <path
                d="M 64 96 C 64 56, 136 56, 136 96 C 136 98, 133 80, 122 75 C 108 70, 92 70, 78 75 C 67 80, 64 98, 64 96 Z"
                fill="url(#hairGrad)"
              />
              {/* Stylish side fringe / hair tufts */}
              <path d="M 65 92 Q 62 115 67 122 Q 68 105 73 95 Z" fill="#0f172a" />
              <path d="M 135 92 Q 138 115 133 122 Q 132 105 127 95 Z" fill="#0f172a" />
              <path d="M 72 75 Q 85 86 98 84 Q 90 73 80 73 Z" fill="#1e293b" opacity="0.9" />

              {/* Eyebrows (Dynamic angle and expression) */}
              <g className="transition-transform duration-200">
                {/* Left Eyebrow */}
                <path
                  d={`M 71 ${104 + eyeGaze.browOffset} Q 80 ${101 + eyeGaze.browOffset} 89 ${105 + eyeGaze.browOffset}`}
                  stroke="#1e293b"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Right Eyebrow */}
                <path
                  d={`M 111 ${105 + eyeGaze.browOffset} Q 120 ${101 + eyeGaze.browOffset} 129 ${104 + eyeGaze.browOffset}`}
                  stroke="#1e293b"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* EYES CONTAINER */}
              <g>
                {/* Left Eye Sclera (White) */}
                <ellipse cx="80" cy="116" rx="9" ry="6.5" fill="#ffffff" />
                {/* Left Iris & Pupil */}
                <g clipPath="url(#leftEyeClip)">
                  <circle cx={80 + eyeGaze.pupilX} cy={116 + eyeGaze.pupilY} r="4.2" fill="#0284c7" />
                  <circle cx={80 + eyeGaze.pupilX} cy={116 + eyeGaze.pupilY} r="2.2" fill="#090d16" />
                  {/* Catchlight */}
                  <circle cx={78.5 + eyeGaze.pupilX} cy={114.5 + eyeGaze.pupilY} r="1.3" fill="#ffffff" />
                </g>

                {/* Right Eye Sclera (White) */}
                <ellipse cx="120" cy="116" rx="9" ry="6.5" fill="#ffffff" />
                {/* Right Iris & Pupil */}
                <g clipPath="url(#rightEyeClip)">
                  <circle cx={120 + eyeGaze.pupilX} cy={116 + eyeGaze.pupilY} r="4.2" fill="#0284c7" />
                  <circle cx={120 + eyeGaze.pupilX} cy={116 + eyeGaze.pupilY} r="2.2" fill="#090d16" />
                  {/* Catchlight */}
                  <circle cx={118.5 + eyeGaze.pupilX} cy={114.5 + eyeGaze.pupilY} r="1.3" fill="#ffffff" />
                </g>

                {/* Eyelids (Blinking Animation) */}
                <ellipse
                  cx="80"
                  cy="116"
                  rx="9.5"
                  ry="7"
                  fill="#f7caa9"
                  style={{
                    transformOrigin: '80px 116px',
                    transform: isBlinking ? 'scaleY(1)' : 'scaleY(0)',
                    transition: isBlinking ? 'transform 0.08s ease-in' : 'transform 0.12s ease-out'
                  }}
                />
                <ellipse
                  cx="120"
                  cy="116"
                  rx="9.5"
                  ry="7"
                  fill="#f7caa9"
                  style={{
                    transformOrigin: '120px 116px',
                    transform: isBlinking ? 'scaleY(1)' : 'scaleY(0)',
                    transition: isBlinking ? 'transform 0.08s ease-in' : 'transform 0.12s ease-out'
                  }}
                />

                {/* Upper Eyelashes / Contour */}
                <path d="M 70 115 Q 80 110 90 115" stroke="#0f172a" strokeWidth="1.6" fill="none" />
                <path d="M 110 115 Q 120 110 130 115" stroke="#0f172a" strokeWidth="1.6" fill="none" />
              </g>

              {/* Nose */}
              <path d="M 98 123 Q 100 137 96 139 Q 100 141 104 139" stroke="#da9e7b" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* DYNAMIC MOUTH (Real-time phonetic visemes & audio sync) */}
              <g className="transition-all duration-75">
                {renderMouth()}
              </g>

            </g>
          </svg>
        </div>
      </div>

      {/* Floating Status Badge */}
      {showStatusBadge && (
        <div
          className={`mt-4 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-semibold flex items-center gap-2 backdrop-blur-xl shadow-lg transition-all duration-300 ${stateMeta.badgeClass}`}
        >
          <StatusIcon className="w-4 h-4" />
          <span>{stateMeta.label}</span>
          {status === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 px-2 py-0.5 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[10px] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Developer / User State Simulator Pill Controls (Optional) */}
      {showControls && (
        <div className="mt-3 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px]">
          <span className="text-slate-500 font-mono px-1">SIMULATE:</span>
          {(['idle', 'speaking', 'listening', 'thinking', 'error'] as AIStatus[]).map(st => (
            <span
              key={st}
              className={`px-2 py-0.5 rounded capitalize font-medium ${status === st ? 'bg-cyan-500 text-navy-950 font-bold' : 'text-slate-400'
                }`}
            >
              {st}
            </span>
          ))}
        </div>
      )}

    </div>
  );
};
