import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { ScanLine, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void
  onCancelar: () => void
  loading?: boolean
}

type Estado = 'scanning' | 'error'

export function BarcodeScanner({ onBarcodeScanned, onCancelar, loading }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [estado, setEstado] = useState<Estado>('scanning')
  const [erro, setErro] = useState('')
  const scannedRef = useRef(false)

  function pararScanner() {
    controlsRef.current?.stop()
    controlsRef.current = null
  }

  async function iniciarScanner() {
    setEstado('scanning')
    setErro('')
    scannedRef.current = false
    pararScanner()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromStream(stream, videoRef.current!, (result) => {
        if (result && !scannedRef.current) {
          scannedRef.current = true
          pararScanner()
          onBarcodeScanned(result.getText())
        }
      })
      controlsRef.current = controls
    } catch {
      setErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      setEstado('error')
    }
  }

  useEffect(() => {
    iniciarScanner()
    return () => pararScanner()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {estado === 'scanning' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 text-center">Aponte a câmera para o código de barras do produto</p>
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-1/2 border-2 border-brand-400 rounded-lg relative">
                <ScanLine size={20} className="absolute -top-3 left-1/2 -translate-x-1/2 text-brand-400" />
              </div>
            </div>
          </div>
          {loading && (
            <p className="text-xs text-center text-brand-600 font-medium">Buscando produto...</p>
          )}
        </div>
      )}

      {estado === 'error' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <XCircle size={48} className="text-red-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-800">Câmera indisponível</p>
            <p className="text-xs text-gray-500 mt-1">{erro}</p>
          </div>
          <Button variant="secondary" onClick={iniciarScanner}>
            <RefreshCw size={16} className="mr-1.5" />
            Tentar novamente
          </Button>
        </div>
      )}

      <Button variant="ghost" onClick={onCancelar} disabled={loading}>
        Cancelar
      </Button>
    </div>
  )
}
