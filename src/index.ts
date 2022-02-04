import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'

class MyRecorder {
  video: HTMLVideoElement
  mediaRecorder: MediaRecorder | null
  voiceParts: Blob[]
  blob: Blob | null

  constructor() {
    this.video = document.getElementById('video') as HTMLVideoElement
    this.mediaRecorder = null
    this.voiceParts = []
    this.blob = null
  }

  public stopRecord() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive'){
      this.mediaRecorder.stop()
    }
    
    this.video.autoplay = false
    this.video.pause()
    this.video.srcObject = this.blob
    this.video.load()
  }

  public async startRecord() {
    try{
      const videoNode = this.video
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, audio: true 
      })
      
      videoNode.srcObject = stream
      this.voiceParts = []
      this.mediaRecorder = new MediaRecorder(stream)
      this.mediaRecorder.start()
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        this.voiceParts.push(event.data)
        const blob = new Blob(this.voiceParts, { type: 'video/mp4' })
        const reader = new FileReader()
        
        reader.readAsDataURL(blob)
        reader.onloadend = async () => {
          const ffmpeg = createFFmpeg({ 
            log: true,
            corePath: '/dist/ffmpeg-core.js'
          })
          
          await ffmpeg.load()
          ffmpeg.FS('writeFile', 'kek', await fetchFile(blob))
          await ffmpeg.run('-i', 'kek',  'output.mp4')

          const data = ffmpeg.FS('readFile', 'output.mp4')
          const result = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }))
          const downloadHref = document.getElementById('download') as HTMLLinkElement
          const stopButton = document.getElementById('stop')!;

          stopButton.innerText = 'COMPLETED!!'
          videoNode.src = result
          downloadHref.href = result
        }
      })
    } catch(e){
      console.log('catch error:', e)
    }
  }
}

(() => {
  const myRecorder = new MyRecorder()
  const startButton = document.getElementById('start')!;
  const stopButton = document.getElementById('stop')!;

  startButton.onclick = () => {
    myRecorder.startRecord()
  }

  stopButton.onclick = () => {
    myRecorder.stopRecord()
    stopButton.innerText = '...Loading...'
  }
})()
