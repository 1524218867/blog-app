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

// Internal reactive state
const state = reactive({
  currentSong: null as Song | null,
  isPlaying: false,
  playList: [] as Song[],
  playMode: 'sequence' as 'sequence' | 'single' | 'random' | 'order',
  duration: 0,
  currentTime: 0,
  showFullScreen: false
})

// Actions
const setPlayList = (list: Song[]) => {
  state.playList = list
}

const play = (song: Song) => {
  // If playing the same song, just toggle or ensure playing
  if (state.currentSong?.id === song.id) {
    if (!state.isPlaying) {
      audioContext.play()
    }
    return
  }

  state.currentSong = song
  audioContext.src = song.url
  audioContext.play()
}

const togglePlay = () => {
  if (!state.currentSong) return
  if (state.isPlaying) {
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
  }
}

// Event listeners
audioContext.onPlay(() => {
  state.isPlaying = true
})
  audioContext.onPause(() => {
    state.isPlaying = false
  })
  audioContext.onStop(() => {
    state.isPlaying = false
  })
  audioContext.onEnded(() => {
    state.isPlaying = false
    playNext(true)
  })
  audioContext.onError((res) => {
    console.error('Audio error:', res)
    state.isPlaying = false
    refreshCurrentSongUrl()
  })
  audioContext.onTimeUpdate(() => {
    state.currentTime = audioContext.currentTime
    state.duration = audioContext.duration
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

  setPlayList,
  play,
  togglePlay,
  playNext,
  playPrev,
  togglePlayMode,
  seek,
  removeSong
})

