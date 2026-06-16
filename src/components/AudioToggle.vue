<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isPlaying = ref(false)
const hasBGM = ref(false)

let audioCtx = null
let bgmAudio = null
let synthInterval = null
let autoStarted = false

// ── BGM mode ──
onMounted(() => {
  fetch('/bgm/home.mp3', { method: 'HEAD' })
    .then(r => {
      if (r.ok) {
        hasBGM.value = true
        bgmAudio = new Audio('/bgm/home.mp3')
        bgmAudio.loop = true
        bgmAudio.volume = 0.18
      }
    })
    .catch(() => { hasBGM.value = false })

  // Auto-start on first user interaction
  const startOnTouch = () => {
    if (autoStarted) return
    autoStarted = true
    if (bgmAudio) {
      bgmAudio.play().then(() => { isPlaying.value = true })
    } else if (audioCtx) {
      audioCtx.resume()
      isPlaying.value = true
    }
    // Cleanup listeners after first interaction
    document.removeEventListener('click', startOnTouch)
    document.removeEventListener('keydown', startOnTouch)
  }
  document.addEventListener('click', startOnTouch)
  document.addEventListener('keydown', startOnTouch)
})

// ── Synth fallback ──
const progressions = [
  [261.6, 329.6, 392.0], [293.7, 370.0, 440.0],
  [349.2, 440.0, 523.3], [392.0, 493.9, 587.3],
  [329.6, 392.0, 493.9], [220.0, 277.2, 349.2],
]
let chordIndex = 0

function playTone(ctx, freq, time, dur, vel = 0.05) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const flt = ctx.createBiquadFilter()
  osc.type = 'triangle'; osc.frequency.value = freq
  flt.type = 'lowpass'; flt.frequency.value = 800; flt.Q.value = 0.7
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(vel, time + 0.02)
  env.gain.exponentialRampToValueAtTime(0.001, time + dur)
  osc.connect(flt); flt.connect(env); env.connect(ctx.destination)
  osc.start(time); osc.stop(time + dur)
}

function playChord(ctx, time) {
  const ch = progressions[chordIndex]
  chordIndex = (chordIndex + 1) % progressions.length
  ch.forEach((f, i) => playTone(ctx, f, time + i * 0.08, 3.5 + i * 0.5, 0.05))
}

function playChirp(ctx, time, base = 2000) {
  const c = ctx.createOscillator(); const m = ctx.createOscillator()
  const mg = ctx.createGain(); const env = ctx.createGain()
  c.type = 'sine'; c.frequency.value = base
  m.type = 'sine'; m.frequency.value = base * 1.5
  mg.gain.value = base * 2; m.connect(mg); mg.connect(c.frequency)
  env.gain.setValueAtTime(0, time)
  env.gain.linearRampToValueAtTime(0.04, time + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, time + 0.12)
  c.frequency.setValueAtTime(base, time)
  c.frequency.linearRampToValueAtTime(base * 1.3, time + 0.05)
  c.frequency.linearRampToValueAtTime(base * 0.8, time + 0.1)
  c.connect(env); env.connect(ctx.destination)
  c.start(time); c.stop(time + 0.15)
  m.start(time); m.stop(time + 0.15)
}

function startSynth() {
  const now = audioCtx.currentTime
  playChord(audioCtx, now)
  synthInterval = setInterval(() => {
    if (audioCtx.state === 'running') playChord(audioCtx, audioCtx.currentTime)
  }, 4000)
  function sched() {
    if (!isPlaying.value) return
    setTimeout(() => {
      if (isPlaying.value && audioCtx.state === 'running') {
        const f = 1800 + Math.random() * 2500
        playChirp(audioCtx, audioCtx.currentTime, f)
        if (Math.random() > 0.5) playChirp(audioCtx, audioCtx.currentTime + 0.15, f * 0.85)
      }
      sched()
    }, 3000 + Math.random() * 7000)
  }
  sched()
}

// ── Toggle ──
function toggle() {
  if (hasBGM.value && bgmAudio) {
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) bgmAudio.play()
    else bgmAudio.pause()
    return
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    startSynth()
  }
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) audioCtx.resume()
  else audioCtx.suspend()
}

onUnmounted(() => {
  if (bgmAudio) { bgmAudio.pause(); bgmAudio = null }
  if (synthInterval) clearInterval(synthInterval)
  if (audioCtx) audioCtx.close()
})
</script>

<template>
  <button
    class="audio-toggle"
    :class="{ on: isPlaying }"
    @click.stop="toggle"
    :title="isPlaying ? '关闭音乐' : '开启音乐'"
  >
    <svg v-if="isPlaying" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
    <svg v-else width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  </button>
</template>

<style scoped>
.audio-toggle {
  position: fixed; bottom: 88px; right: 28px; z-index: 100;
  width: 60px; height: 60px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.4); backdrop-filter: blur(10px);
  color: rgba(255,255,255,0.5); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.audio-toggle:hover { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.8); }
.audio-toggle.on { border-color: rgba(255,255,255,0.35); color: rgba(255,255,255,0.8); }
@media (max-width: 768px) { .audio-toggle { bottom: 70px; right: 16px; width: 50px; height: 50px; } .audio-toggle svg { width: 22px; height: 22px; } }
</style>
