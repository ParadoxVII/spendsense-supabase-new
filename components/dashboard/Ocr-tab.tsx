import React, { useEffect, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'

const OcrTab: React.FC = () => {
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [ocrText, setOcrText] = useState<string>('')
    const [progress, setProgress] = useState<number | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const workerRef = useRef<any>(null)

    useEffect(() => {
        return () => {
            // cleanup preview URL
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            // terminate worker if running
            if (workerRef.current) {
                workerRef.current.terminate()
                workerRef.current = null
            }
        }
    }, [previewUrl])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null)
        setOcrText('')
        setProgress(null)
        const f = e.target.files?.[0] ?? null
        setFile(f)
        if (f) {
            const url = URL.createObjectURL(f)
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return url
            })
        } else {
            setPreviewUrl(null)
        }
    }

    const runOcr = async () => {
        if (!file) return
        setIsProcessing(true)
        setError(null)
        setOcrText('')
        setProgress(0)

        // createWorker's types in this project resolve to a broader signature; cast to any
        // createWorker may return a Promise in this environment; await it so we get the worker instance
        // pass logger as the 3rd parameter (options) so it's handled as options, not as `langs`
        const worker: any = await (createWorker as any)('eng', undefined, {
            logger: (m: any) => {
                if (m?.progress != null) {
                    setProgress(Math.round(m.progress * 100))
                }
            },
        })

        workerRef.current = worker

        try {
            // createWorker('eng', ...) resolves to a worker that's already loaded and initialized for 'eng'
            const { data } = await worker.recognize(file)
            setOcrText(data?.text ?? '')
        } catch (err: any) {
            console.error('OCR error', err)
            setError(err?.message ?? 'OCR failed')
        } finally {
            setIsProcessing(false)
            setProgress(null)
            if (workerRef.current) {
                await workerRef.current.terminate()
                workerRef.current = null
            }
        }
    }

    const cancelProcessing = async () => {
        if (workerRef.current) {
            try {
                await workerRef.current.terminate()
            } catch (e) {
                // ignore
            }
            workerRef.current = null
        }
        setIsProcessing(false)
        setProgress(null)
        setError('Processing canceled')
    }

    const clearAll = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setFile(null)
        setPreviewUrl(null)
        setOcrText('')
        setProgress(null)
        setError(null)
        setIsProcessing(false)
    }

    return (
        <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-white mb-4">OCR POC</h2>
            <p className="text-gray-400 mb-4">Upload an image and run OCR (tesseract.js)</p>

            <div className="mb-4">
                <input id="ocr-file" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <label htmlFor="ocr-file" className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
                    Choose Image
                </label>
            </div>

            {previewUrl && (
                <div className="mb-4">
                    <img src={previewUrl} alt="preview" className="mx-auto max-h-64 object-contain" />
                </div>
            )}

            <div className="flex justify-center gap-2 mb-4">
                <button onClick={runOcr} disabled={!file || isProcessing} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
                    {isProcessing ? 'Processing...' : 'Run OCR'}
                </button>

                <button onClick={cancelProcessing} disabled={!isProcessing} className="bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50">
                    Cancel
                </button>

                <button onClick={clearAll} className="bg-gray-700 text-white px-4 py-2 rounded">
                    Clear
                </button>
            </div>

            {progress != null && (
                <div className="mb-2">
                    <div className="text-sm text-gray-300">Progress: {progress}%</div>
                </div>
            )}

            {error && <div className="text-red-400 mb-2">{error}</div>}

            <div className="text-left max-w-3xl mx-auto bg-gray-900 p-4 rounded">
                <h3 className="text-white font-semibold mb-2">OCR Result</h3>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap">{ocrText || 'No result yet'}</pre>
            </div>
        </div>
    )
}

export default OcrTab