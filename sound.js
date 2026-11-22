// All voices are synthesized locally. Audio starts inside the first user gesture.
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0))
const pitch = midi => 440 * 2 ** ((midi - 69) / 12)
const chords = [[50, 57, 60, 64], [46, 53, 57, 60], [53, 60, 64, 67], [48, 55, 58, 62]]
const melody = [null, 2, null, 1, 3, null, 2, null]
const chimes = {
  pickup: [62, 69], success: [62, 66, 69, 74], fail: [57, 53, 50],
  buy: [69, 74, 78], start: [57, 64, 69], damage: [85, 78]
}

function gain(ctx, destination, level) {
  const node = ctx.createGain()
  node.gain.value = level
  node.connect(destination)
  return node
}

function oscillator(ctx, destination, type, hz) {
  const voice = ctx.createOscillator()
  voice.type = type
  voice.frequency.value = hz
  voice.connect(destination)
  return voice
}

function note(ctx, dest, type, hz, time, duration, strength, endHz = hz) {
  const env = gain(ctx, dest, 0)
  const voice = oscillator(ctx, env, type, hz)
  voice.frequency.setValueAtTime(hz, time)
  voice.frequency.exponentialRampToValueAtTime(endHz, time + duration)
  env.gain.setValueAtTime(0.0001, time)
  env.gain.exponentialRampToValueAtTime(strength, time + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  voice.onended = () => { voice.disconnect(); env.disconnect() }
  voice.start(time)
  voice.stop(time + duration + 0.01)
}

export class Sound {
  constructor() {
    this.sfxVolume = 0.75
    this.musicVolume = 0.35
    this.beat = 0
    this.nextBeat = 0
  }

  unlock() {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!Context) return
    if (!this.ctx) {
      try { this.ctx = new Context() } catch { return }
      const ctx = this.ctx
      this.sfx = gain(ctx, ctx.destination, this.sfxVolume)
      this.music = gain(ctx, ctx.destination, this.musicVolume)
      this.engineGain = gain(ctx, this.sfx, 0)
      this.tireGain = gain(ctx, this.sfx, 0)
      this.engineFilter = ctx.createBiquadFilter()
      this.engineFilter.type = 'lowpass'
      this.engineFilter.frequency.value = 240
      this.engineFilter.connect(this.engineGain)
      this.engine = oscillator(ctx, this.engineFilter, 'sawtooth', 40)
      this.engine.start()
      this.tireFilter = ctx.createBiquadFilter()
      this.tireFilter.type = 'bandpass'
      this.tireFilter.Q.value = 2
      this.tireFilter.frequency.value = 1200
      this.tireFilter.connect(this.tireGain)
      const hiss = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const samples = hiss.getChannelData(0)
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
      this.noise = ctx.createBufferSource()
      this.noise.buffer = hiss
      this.noise.loop = true
      this.noise.connect(this.tireFilter)
      this.noise.start()
    }
    if (this.ctx.state !== 'running') return this.ctx.resume().catch(() => {})
  }

  levels(sfx, music) {
    this.sfxVolume = clamp(sfx)
    this.musicVolume = clamp(music)
    if (!this.ctx) return
    this.sfx.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.025)
    this.music.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.025)
  }

  drive(speedNormalized, throttle, braking, drifting, pitchScale = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return
    const now = this.ctx.currentTime
    const speed = clamp(Math.abs(speedNormalized))
    const gas = clamp(throttle)
    const gear = Math.min(3, Math.floor(speed * 4))
    const revs = 38 + speed * 100 - gear * 15 + gas * 14
    this.engine.frequency.setTargetAtTime(revs * pitchScale, now, 0.09)
    this.engineGain.gain.setTargetAtTime(0.032 + speed * 0.045 + gas * 0.025, now, 0.06)
    this.engineFilter.frequency.setTargetAtTime(190 + speed * 300 + gas * 140, now, 0.09)
    const slip = speed * Math.max(clamp(braking) * 0.45, clamp(drifting))
    this.tireGain.gain.setTargetAtTime(slip * 0.22, now, 0.045)
    this.tireFilter.frequency.setTargetAtTime(850 + slip * 1200, now, 0.08)
    if (this.nextBeat < now) this.nextBeat = now
    if (this.nextBeat < now + 0.10) {
      if (this.musicVolume > 0) this.playBeat(this.nextBeat)
      this.nextBeat += 0.32
      this.beat = (this.beat + 1) % 32
    }
  }

  playBeat(time) {
    const chord = chords[Math.floor(this.beat / 8)]
    const step = this.beat % 8
    if (step % 4 === 0) {
      note(this.ctx, this.music, 'sine', 100, time, 0.16, 0.08, 44)
      note(this.ctx, this.music, 'triangle', pitch(chord[0] - 12), time, 0.49, 0.10)
    }
    const degree = melody[step]
    if (degree !== null) {
      note(this.ctx, this.music, 'sine', pitch(chord[degree] + 12), time, 0.45, 0.065)
    }
  }

  idle() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    this.engineGain.gain.setTargetAtTime(0, now, 0.025)
    this.tireGain.gain.setTargetAtTime(0, now, 0.025)
    this.nextBeat = 0
    this.beat = 0
  }

  fx(name) {
    if (!this.ctx || this.ctx.state === 'closed') return
    const now = this.ctx.currentTime
    if (name === 'hit') {
      note(this.ctx, this.sfx, 'triangle', 140, now, 0.19, 0.33, 32)
      note(this.ctx, this.sfx, 'sawtooth', 190, now, 0.07, 0.10, 46)
    } else if (Object.hasOwn(chimes, name)) {
      const notes = chimes[name]
      notes.forEach((midi, index) => {
        const when = now + index * 0.078
        note(this.ctx, this.sfx, 'triangle', pitch(midi), when, 0.18, 0.13)
      })
    }
  }

  suspend() {
    this.idle()
    if (this.ctx?.state === 'running') return this.ctx.suspend().catch(() => {})
  }
}
