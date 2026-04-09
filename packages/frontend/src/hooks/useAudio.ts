import { useState, useRef, useCallback } from 'react'

type AudioState = 'idle' | 'recording' | 'recorded' | 'error'

export function useAudio() {
  const [state, setState] = useState<AudioState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [durationMs, setDurationMs] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    setErrorMsg(null)
    setAudioBlob(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      intervalRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current)
      }, 100)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setDurationMs(Date.now() - startTimeRef.current)
        setState('recorded')
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start(250)
      setState('recording')
    } catch {
      setErrorMsg('Não foi possível acessar o microfone. Verifique as permissões.')
      setState('error')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    mediaRecorderRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setErrorMsg(null)
    setDurationMs(0)
    setState('idle')
  }, [])

  return { state, audioBlob, errorMsg, durationMs, startRecording, stopRecording, reset }
}
