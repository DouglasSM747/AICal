import { Mic, Square, RotateCcw } from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { Button } from '@/components/ui/Button'

interface AudioRecorderProps {
  onTranscricaoReady: (blob: Blob) => void
  loading?: boolean
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

export function AudioRecorder({ onTranscricaoReady, loading }: AudioRecorderProps) {
  const { state, audioBlob, errorMsg, durationMs, startRecording, stopRecording, reset } =
    useAudio()

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {state === 'idle' && (
        <>
          <p className="text-sm text-gray-500 text-center">
            Toque no botão e descreva sua refeição em voz alta
          </p>
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg transition-colors"
            aria-label="Iniciar gravação"
          >
            <Mic size={32} />
          </button>
        </>
      )}

      {state === 'recording' && (
        <>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-gray-700">{formatDuration(durationMs)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
            aria-label="Parar gravação"
          >
            <Square size={28} fill="white" />
          </button>
          <p className="text-xs text-gray-400">Toque para parar</p>
        </>
      )}

      {state === 'recorded' && audioBlob && (
        <>
          <div className="w-full bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
            <Mic size={20} className="text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Áudio gravado</p>
              <p className="text-xs text-green-600">{formatDuration(durationMs)}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={reset}
              className="flex-1"
            >
              <RotateCcw size={14} />
              Regravar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              loading={loading}
              onClick={() => onTranscricaoReady(audioBlob)}
            >
              Transcrever
            </Button>
          </div>
        </>
      )}

      {state === 'error' && errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 w-full">
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button
            onClick={reset}
            className="text-xs text-red-600 underline mt-1"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
