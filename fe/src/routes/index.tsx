import type { FormEvent } from 'react'
import { useRef, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const idleMessage = 'Paste an Icecast stream endpoint to start listening.'

function Home() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [draftUrl, setDraftUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [status, setStatus] = useState(idleMessage)

  async function startStream(url: string) {
    const nextUrl = url.trim()
    const audio = audioRef.current

    if (!audio || !nextUrl) {
      setStatus('Enter a valid Icecast stream URL.')
      return
    }

    setIsConnecting(true)
    setStatus('Connecting to stream...')

    try {
      if (currentUrl !== nextUrl) {
        audio.pause()
        audio.src = nextUrl
        audio.load()
        setCurrentUrl(nextUrl)
      }

      audio.muted = isMuted
      await audio.play()
    } catch {
      setIsPlaying(false)
      setStatus('Playback failed. Check the stream URL and CORS settings.')
    } finally {
      setIsConnecting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void startStream(draftUrl || currentUrl)
  }

  function handleToggleMute() {
    const nextMuted = !isMuted

    setIsMuted(nextMuted)

    if (audioRef.current) {
      audioRef.current.muted = nextMuted
    }

    setStatus(nextMuted ? 'Stream muted.' : isPlaying ? 'Stream unmuted.' : 'Audio ready.')
  }

  async function handleTogglePlay() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (isPlaying) {
      audio.pause()
      return
    }

    await startStream(draftUrl || currentUrl)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="grid gap-8 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-amber-200/70">
              Icecast Listener
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-tight font-semibold text-stone-50 md:text-5xl">
              Drop in a live stream endpoint and listen instantly.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-stone-300">
              This player connects directly to an Icecast audio stream in the browser,
              with quick playback and a dedicated mute toggle.
            </p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-stone-200" htmlFor="stream-url">
                Stream endpoint
              </label>
              <input
                id="stream-url"
                type="url"
                inputMode="url"
                placeholder="https://radio.example.com/live"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-base text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60 focus:bg-white/12"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
                >
                  {isConnecting ? 'Connecting...' : 'Connect & play'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleTogglePlay()}
                  disabled={isConnecting || (!draftUrl.trim() && !currentUrl)}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:text-stone-500"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-white/8"
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-sm text-stone-400">
              Note: the Icecast server must allow cross-origin requests for browser playback.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6">
            <div className="flex items-center justify-between text-sm text-stone-300">
              <span>Now listening</span>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
                {isPlaying ? 'Live' : 'Idle'}
              </span>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Source</p>
              <p className="mt-3 min-h-16 break-all text-base leading-7 text-stone-100">
                {currentUrl || 'No stream connected yet.'}
              </p>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Status</p>
              <p className="mt-3 text-base leading-7 text-stone-200">{status}</p>
            </div>

            <audio
              ref={audioRef}
              className="mt-6 w-full opacity-90"
              controls
              onPlay={() => {
                setIsPlaying(true)
                setStatus('Playing live stream.')
              }}
              onPause={() => {
                setIsPlaying(false)
                setStatus(currentUrl ? 'Stream paused.' : idleMessage)
              }}
              onVolumeChange={() => {
                setIsMuted(Boolean(audioRef.current?.muted))
              }}
              onError={() => {
                setIsConnecting(false)
                setIsPlaying(false)
                setStatus('The stream could not be loaded by the browser.')
              }}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
