import { reactive } from 'vue'

interface Song {
  id: number
  name: string
  artist: string
  url: string
  coverUrl?: string
  lyrics?: string
}

const audioContext = uni.createInnerAudioContext()
const retryMap: Record<number, number> = {}
let playbackCheckInterval: number | null = null
let stalledCount = 0
let lastCheckTime = -1
let isManualPause = false
let isSwitching = false

const stopPlaybackCheck = () => {
  if (playbackCheckInterval) {
    clearInterval(playbackCheckInterval)
    playbackCheckInterval = null
  }
  // Don't reset stalledCount here to preserve it across transient pauses/stops
  // stalledCount = 0 
  lastCheckTime = -1
}

const startPlaybackCheck = () => {
  if (playbackCheckInterval) {
    // Already running, don't restart to preserve state
    return
  }
  
  stopPlaybackCheck()
  console.log('Starting playback check...')
  lastCheckTime = audioContext.currentTime
  
  playbackCheckInterval = setInterval(() => {
    const currentTime = audioContext.currentTime
    const timeDiff = Math.abs(currentTime - lastCheckTime)
    
    console.log(`Playback check tick | Time: ${currentTime.toFixed(3)} | Diff: ${timeDiff.toFixed(3)} | Stalled: ${stalledCount} | Paused: ${audioContext.paused} | Playing: ${state.isPlaying}`)

    // 如果不在播放状态（或者正在重试中），不检测
    if (!state.isPlaying && !audioContext.paused) {
       // 修正状态：Audio 说在播，但 Store 没更正（理论上 onPlay 会更正）
    }
    
    if (state.isRetrying) return

    // 检查进度是否卡住
    // 如果1秒内进度变化小于 0.1秒，视为卡顿
    if (timeDiff < 0.1) {
       stalledCount++
       console.log(`Playback check: stalled ${stalledCount}/3 (time: ${currentTime})`)
       
       // 连续 3 次（3秒）检测到卡顿，触发重试
       if (stalledCount >= 3) {
          console.warn('Playback stalled, triggering refresh')
          stopPlaybackCheck()
          refreshCurrentSongUrl()
       }
    } else {
       // 正常播放中，重置计数
       stalledCount = 0
       // 如果进度已经走远了，可以停止监控以节省资源
       // 只有当进度大于 5 秒且持续正常播放才停止，防止开头卡死
       if (currentTime > 5) {
          stopPlaybackCheck()
       }
    }
    
    lastCheckTime = currentTime
  }, 1000) as unknown as number
}

// Internal reactive state
const state = reactive({
  currentSong: null as Song | null,
  isPlaying: false,
  playList: [] as Song[],
  playMode: 'sequence' as 'sequence' | 'single' | 'random' | 'order',
  duration: 0,
  currentTime: 0,
  showFullScreen: false,
  isRetrying: false,
  // Timer related
  timerDuration: 0, // minutes
  timerRemaining: 0, // seconds
  timerId: null as number | null
})

// Timer Interval
let intervalId: number | null = null

// Actions
const startTimer = (minutes: number) => {
  stopTimer()
  state.timerDuration = minutes
  state.timerRemaining = minutes * 60
  
  // Create countdown interval
  intervalId = setInterval(() => {
    state.timerRemaining--
    if (state.timerRemaining <= 0) {
      // Time's up
      stopTimer()
      isManualPause = true
      audioContext.pause()
      state.isPlaying = false
      uni.showToast({
        title: '定时播放已结束',
        icon: 'none'
      })
    }
  }, 1000) as unknown as number
}

const stopTimer = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  state.timerDuration = 0
  state.timerRemaining = 0
  state.timerId = null
}

const setPlayList = (list: Song[]) => {
  state.playList = list
}

const play = (song: Song) => {
  // If playing the same song, just toggle or ensure playing
  if (state.currentSong?.id === song.id) {
    if (!state.isPlaying) {
      isManualPause = true // Technically resuming, but using manual flag to handle potential stop-then-play
      audioContext.play()
      // Note: isManualPause will be reset in onPlay or onPause
      // Actually, for play(), we expect it to play.
    }
    return
  }

  // 切换歌曲前，先重置状态和停止旧音频
  // 防止 currentTime 残留导致进度条跳变或检测逻辑误判
  isSwitching = true
  isManualPause = true
  audioContext.stop()
  isManualPause = false // Reset after stop
  
  state.currentTime = 0
  state.duration = 0
  stalledCount = 0 // Reset stalled count for new song
  // Note: stop() triggers onStop -> stopPlaybackCheck, so we don't need to call it manually,
  // but calling it ensures clean state before we set new src.
  stopPlaybackCheck()

  state.currentSong = song
  audioContext.src = song.url
  
  // Optimistically set playing state and start check IMMEDIATELY
  // Don't wait for onPlay because invalid URLs might never trigger it
  state.isPlaying = true
  // Reset switching flag before playing new song
  isSwitching = false
  
  audioContext.play()
  startPlaybackCheck()
}

const togglePlay = () => {
  if (!state.currentSong) return
  if (state.isPlaying) {
    isManualPause = true
    audioContext.pause()
  } else {
    audioContext.play()
  }
}

const togglePlayMode = () => {
  const modes = ['sequence', 'single', 'random', 'order'] as const
  const currentIndex = modes.indexOf(state.playMode)
  const nextIndex = (currentIndex + 1) % modes.length
  state.playMode = modes[nextIndex]
  
  const modeNames = {
    sequence: '列表循环',
    single: '单曲循环',
    random: '随机播放',
    order: '顺序播放'
  }
  
  uni.showToast({
    title: modeNames[state.playMode],
    icon: 'none'
  })
}

const playNext = (auto = false) => {
  if (!state.currentSong || state.playList.length === 0) return
  
  // Handle Single Loop for auto-play (onEnded)
  if (auto && state.playMode === 'single') {
    play(state.currentSong)
    return
  }

  let nextIndex = -1
  const currentIndex = state.playList.findIndex(s => s.id === state.currentSong!.id)

  if (state.playMode === 'random') {
    // Random mode: pick random index
    if (state.playList.length === 1) {
      nextIndex = 0
    } else {
      do {
        nextIndex = Math.floor(Math.random() * state.playList.length)
      } while (nextIndex === currentIndex)
    }
  } else {
    // Sequence, Order, or Manual Single: go to next
    nextIndex = currentIndex + 1
    if (nextIndex >= state.playList.length) {
      if (state.playMode === 'order' && auto) {
        // Stop if order mode and auto-play (end of list)
        state.isPlaying = false
        return
      }
      nextIndex = 0 // Loop to start
    }
  }

  play(state.playList[nextIndex])
}

const playPrev = () => {
  if (!state.currentSong || state.playList.length === 0) return

  let prevIndex = -1
  const currentIndex = state.playList.findIndex(s => s.id === state.currentSong!.id)

  if (state.playMode === 'random') {
    // Random mode: pick random index (same as next)
    if (state.playList.length === 1) {
      prevIndex = 0
    } else {
      do {
        prevIndex = Math.floor(Math.random() * state.playList.length)
      } while (prevIndex === currentIndex)
    }
  } else {
    prevIndex = currentIndex - 1
    if (prevIndex < 0) {
      prevIndex = state.playList.length - 1 // Loop to end
    }
  }

  play(state.playList[prevIndex])
}

const seek = (time: number) => {
  audioContext.seek(time)
}

const removeSong = (id: number) => {
  const index = state.playList.findIndex(s => s.id === id)
  if (index === -1) return

  // If removing current song, play next first
  if (state.currentSong?.id === id) {
    if (state.playList.length > 1) {
      playNext()
    } else {
      // Last song removed
      audioContext.stop()
      state.currentSong = null
      state.isPlaying = false
    }
  }

  state.playList.splice(index, 1)
}

const refreshCurrentSongUrl = async () => {
  const song = state.currentSong
  if (!song) return

  // Retry check
  const retryCount = retryMap[song.id] || 0
  if (retryCount > 2) {
    console.error('Max retries reached')
    return
  }
  retryMap[song.id] = retryCount + 1
  
  state.isRetrying = true
  
  try {
     const query = `${song.name} ${song.artist || ''}`.trim()
     const res = await new Promise((resolve, reject) => {
        uni.request({
           url: `https://lpz.chatc.vip/apiqq.php`,
           data: {
              msg: query,
              type: 'json'
           },
           success: (r) => resolve(r.data),
           fail: (e) => reject(e)
        })
     }) as any
     
     if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const bestMatch = res.data[0]
        let newUrl = bestMatch.music_url
        
        if (!newUrl && bestMatch.n) {
           // Fetch detail
           const detailRes = await new Promise((resolve, reject) => {
              uni.request({
                 url: `https://lpz.chatc.vip/apiqq.php`,
                 data: {
                    msg: query,
                    n: bestMatch.n,
                    type: 'json',
                    br: 2
                 },
                 success: (r) => resolve(r.data),
                 fail: (e) => reject(e)
              })
           }) as any
           if (detailRes.code === 200 && detailRes.data) {
              newUrl = detailRes.data.music_url
           }
        }
        
        if (newUrl) {
           song.url = newUrl
           // Update playlist
           const item = state.playList.find(s => s.id === song.id)
           if (item) item.url = newUrl
           
           console.log('Refreshed URL:', newUrl)
           // Replay
           audioContext.src = newUrl
           audioContext.play()
        }
     }
  } catch (e) {
     console.error('Refresh failed', e)
  } finally {
    state.isRetrying = false
  }
}

// Event listeners
audioContext.onPlay(() => {
  state.isPlaying = true
  startPlaybackCheck()
})
  audioContext.onPause(() => {
    // Check for abnormal pause (not manual and expected to be playing)
    if (!isManualPause && state.isPlaying) {
       console.warn('Abnormal pause detected, triggering refresh')
       refreshCurrentSongUrl()
       return
    }

    state.isPlaying = false
    stopPlaybackCheck()
    isManualPause = false
  })
  audioContext.onStop(() => {
    // Ignore if switching songs
    if (isSwitching) return

    // Check for abnormal stop
    if (!isManualPause && state.isPlaying) {
       console.warn('Abnormal stop detected, triggering refresh')
       refreshCurrentSongUrl()
       return
    }

    state.isPlaying = false
    stopPlaybackCheck()
    isManualPause = false
  })
  audioContext.onEnded(() => {
    state.isPlaying = false
    stopPlaybackCheck()
    playNext(true)
  })
  audioContext.onError((res) => {
    console.error('Audio error:', res)
    state.isPlaying = false
    stopPlaybackCheck()
    refreshCurrentSongUrl()
  })
  audioContext.onTimeUpdate(() => {
    state.currentTime = audioContext.currentTime
    state.duration = audioContext.duration
    // 如果播放进度正常前进了，可以提前清除监控（双重保险）
    if (state.currentTime > 1 && playbackCheckInterval) {
      stopPlaybackCheck()
    }
  })
  audioContext.onCanplay(() => {
    state.duration = audioContext.duration
  })

// Export a proxy-like object to maintain compatibility with existing usage
export const audioStore = reactive({
  // State properties (using getters/setters to link to 'state')
  // Note: We can't simply spread state here because primitive values would lose reactivity.
  // We can use `toRefs` but that requires `.value` access which changes API.
  // Or we can just use the state object itself and attach methods?
  // Let's try to make audioStore THE reactive object, but define methods externally that reference it?
  // No, the closure approach is safer.
  
  // Best approach for Vue 3 store pattern without Pinia:
  get currentSong() { return state.currentSong },
  set currentSong(v) { state.currentSong = v },
  
  get isPlaying() { return state.isPlaying },
  set isPlaying(v) { state.isPlaying = v },
  
  get playList() { return state.playList },
  set playList(v) { state.playList = v },

  get playMode() { return state.playMode },
  
  get duration() { return state.duration },
  set duration(v) { state.duration = v },
  
  get currentTime() { return state.currentTime },
  set currentTime(v) { state.currentTime = v },
  
  get showFullScreen() { return state.showFullScreen },
  set showFullScreen(v) { state.showFullScreen = v },

  get isRetrying() { return state.isRetrying },

  get timerDuration() { return state.timerDuration },
  get timerRemaining() { return state.timerRemaining },

  setPlayList,
  play,
  togglePlay,
  playNext,
  playPrev,
  togglePlayMode,
  seek,
  removeSong,
  startTimer,
  stopTimer
})

