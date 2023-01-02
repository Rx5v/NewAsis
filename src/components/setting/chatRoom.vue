<template>
  <q-page>
    <div class="row">
      <div class="col-8">
        <q-card>
          <q-toolbar>
            <q-space/>
            <q-toolbar-title>Pembicara</q-toolbar-title>
            <q-space/>
            <q-icon name="fas fa-video" class="pr-3 kill-video text-teal-13">
              <q-tooltip content-class="bg-purple-13">
                Video
              </q-tooltip>
            </q-icon>
            <q-icon name="fas fa-microphone" class="pr-3 mute-remote-mic q-ml-md text-teal-13">
              <q-tooltip content-class="bg-purple-13">
                Mute
              </q-tooltip>
            </q-icon>
            <q-icon name="fas fa-expand" class="expand-remote-video q-ml-md text-teal-13">
              <q-tooltip content-class="bg-purple-13">
                Layar Penuh
              </q-tooltip>
            </q-icon>
          </q-toolbar>
          <q-card-section id="video-grid" class="text-center">
          </q-card-section>
        </q-card>
      </div>
      <div class="col-4">
        <q-scroll-area
          style="height: 100%;"
        >
          <q-card >
            <q-toolbar>
              <q-toolbar-title>Peserta Meetting</q-toolbar-title>
              <q-space/>
              <q-icon name="fas fa-video" class="pr-3 kill-video text-red-13" title="Video ON/OFF"></q-icon>
              <q-icon name="fas fa-desktop" class="expand-remote-video text-teal-13 q-ml-md" @click="sharingScreen">
                <q-tooltip content-class="bg-purple-13">
                  Share Screen
                </q-tooltip>
              </q-icon>
              <q-icon name="fas fa-microphone" class="pr-3 mute-remote-mic q-ml-md text-teal-13" title="Mute"></q-icon>
              <q-icon name="fas fa-expand" class="expand-remote-video q-ml-md text-teal-13" title="Layar Penuh"></q-icon>
            </q-toolbar>
            <q-card-section>
              <video class="local-video mirror-mode" id='local' volume='0' autoplay muted></video>
            </q-card-section>
            <q-card-section id="video-audience"></q-card-section>
            <!-- <q-card-section
              v-for="a in userChat" :key="a.id" :id="a.userID">
              <video :id="`video--${a.userID}`" :srcObject="a.srcObject" autoplay></video>
              <div class="text-h5 absolute-bottom text-center">
                <q-icon name="fas fa-user-times" class="pr-3 kill-video text-red-13" title="Keluarkan" :id="`${a.userID}--kill`"></q-icon>
                <q-icon name="fas fa-microphone" class="pr-3 mute-remote-mic q-ml-md text-red-13" title="Mute"></q-icon>
                <q-icon name="fas fa-expand" class="expand-remote-video q-ml-md text-teal-13" title="Layar Penuh" :id="`${a.userID}--nama`"></q-icon>
              </div>
            </q-card-section> -->
          </q-card>
        </q-scroll-area>
      </div>
    </div>
  </q-page>
</template>

<script>
import Peer from 'peerjs'
import io from 'socket.io-client'

const socket = io('http://localhost:3001/')
// const userID = socket.io.engine.id
const myPeer = new Peer(undefined, {
  host: '/',
  port: 3002
})
// const peers = {}
const myVideo = document.createElement('video')
export default {
  name: 'PageIndex',
  data () {
    return {
      // socket: {},
      peerss: {},
      user: this.$store.state.auth.user,
      userChat: [],
      room: 'ASI',
      userX: {},
      contentStyle: {
        backgroundColor: '#ffff23',
        color: '#555'
      },

      contentActiveStyle: {
        backgroundColor: '#eee',
        color: 'black'
      },

      thumbStyle: {
        right: '2px',
        borderRadius: '5px',
        backgroundColor: '#027be3',
        width: '5px',
        opacity: 0.75
      },
      myStream: '',
      pc: [],
      screen: ''
    }
  },
  mounted () {
    const uri = window.location.href.split('?')
    const dta = uri[1] ? uri[1].split('&') : ''
    // let dtKelas
    // dt.user = {}
    if (uri[1]) {
      dta.forEach(s => {
        const b = s.split('=')
        this.userX[b[0]] = b[1]
      })
    }
    // const params = new URLSearchParams(uri)
    // console.log(this.userX)
    // socket.emit('masuk', socket.id)
    /* myPeer.on('open', id => {
      this.user.userID = id
      this.user.room = this.room
      socket.emit('masuk', this.user)
    }) */
    let socketId = socket.io.engine.id
    // this.user.socketId = socketId
    socket.emit('subscribe', {
      room: this.room,
      socketId: socketId,
      user: this.user
    })
    socket.on('login', (data) => {
      console.log(data)
      this.user = { ...this.user, ...data.user }
      /* dtKelas = user
      if (!user.nama) {
        // window.location.replace('https://belajar.salatiga.go.id/auth')
      } else {
        user.id = socketId
        userss = user
        document.getElementById('judul').innerHTML = `${dtKelas.kelas}  ${dtKelas.nama_mapel}`
        document.getElementById('namaSiswa').innerHTML = `${user.tipe}: ${user.nama_lengkap}`
      } */
    })
    socket.on('metu', (data) => {
      console.log('user metu ', data.user)
      let userMetu = data.user
      if (userMetu) {
        // peserta[data.socketId] = {}
        this.closeVideo(data.socketId)
      }
    })
    socket.on('kill', (data) => {
      if (this.userChat.id === data.socketId) {
        this.closeVideo(data.socketId)
        // window.location.replace('https://belajar.salatiga.go.id/auth')
      }
      let userMetu = data.user
      if (userMetu) {
        // peserta[data.socketId] = {}
        this.closeVideo(data.socketId)
      }
    })
    socket.on('videoOFF', () => {
      let tgVideo = document.getElementById('toggle-video')
      if (this.myStream.getVideoTracks()[0].enabled) {
        tgVideo.classList.remove('fa-video')
        tgVideo.classList.add('fa-video-slash')
        // elem.setAttribute( 'title', 'Show Video' );
        this.closeVideo(this.userChat.id)
        this.myStream.getVideoTracks()[0].enabled = false
        // myStream.detach().forEach(element => element.remove())
      }

      /* else {
                  tgVideo.classList.remove( 'fa-video-slash' );
                  tgVideo.classList.add( 'fa-video' );
                  //elem.setAttribute( 'title', 'Hide Video' );

                  myStream.getVideoTracks()[0].enabled = true;
              } */
      this.broadcastNewTracks(this.myStream, 'video')
    })
    socket.on('videoON', () => {
      let tgVideo = document.getElementById('toggle-video')
      if (this.myStream.getVideoTracks()[0].enabled) {
        /* tgVideo.classList.remove( 'fa-video' );
                  tgVideo.classList.add( 'fa-video-slash' );
                  // elem.setAttribute( 'title', 'Show Video' );
                  h.closeVideo(userss.id)
                  myStream.getVideoTracks()[0].enabled = false;
                  // myStream.detach().forEach(element => element.remove()) */
      } else {
        tgVideo.classList.remove('fa-video-slash')
        tgVideo.classList.add('fa-video')
        // elem.setAttribute( 'title', 'Hide Video' );

        this.myStream.getVideoTracks()[0].enabled = true
      }
      this.broadcastNewTracks(this.myStream, 'video')
    })
    socket.on('newUser', (data) => {
      let userb = data.user || {}
      userb.id = data.socketId
      console.log('iki new user ... ', data)
      socket.emit('newUserStart', { to: data.socketId, sender: this.user.socketId, user: this.user })
      // peserta[data.socketId] = userb
      this.pc.push(data.socketId)
      // pc[data.socketId].user = userb
      this.init(true, data.socketId, userb)
    })

    socket.on('newUserStart', (data) => {
      // pc.push( { id: data.sender, user: data.user } );
      this.pc.push(data.sender)
      data.user.id = data.sender
      // peserta[data.sender] = data.user
      console.log('iki newUserStart', data)
      console.log(this.pc)
      this.pc[data.sender].user = data.user
      this.init(false, data.sender, data.user)
    })

    socket.on('iceCandidates', async (data) => {
      if (data.candidate) {
        await this.pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    })

    socket.on('sdp', async (data) => {
      console.log('sdp ', data)
      console.log('iki sdp ', this.pc[data.sender])
      if (data.description.type === 'offer') {
        if (data.description) {
          await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description))
        }
        this.getUserFullMedia().then(async (stream) => {
          if (!document.getElementById('local').srcObject) {
            this.setLocalStream(stream, true, this.userChat)
          }

          // save my stream
          this.myStream = stream

          stream.getTracks().forEach((track) => {
            this.pc[data.sender].addTrack(track, stream)
          })

          let answer = await this.pc[data.sender].createAnswer()

          await this.pc[data.sender].setLocalDescription(answer)

          socket.emit('sdp', { description: this.pc[data.sender].localDescription, to: data.sender, sender: this.user.socketId })
        }).catch((e) => {
          console.error(e)
        })
      } else if (data.description.type === 'answer') {
        await this.pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description))
        // pc[data.sender].user = user
      }
    })
    // this.startConf()
    this.getAndSetUserStream()
  },
  methods: {
    startConf () {
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          this.user.srcObject = stream
          console.log(this.user)
          this.userChat.push(this.user)
          this.addVideoStream(myVideo, stream, this.user)
          myPeer.on('call', call => {
            call.answer(stream)
            const video = document.createElement('video')
            video.muted = true
            // console.log(stream)
            let aa = document.getElementById(`video--${this.user.userID}`)
            aa.srcObject = stream
            call.on('stream', userVideoStream => {
              this.addVideoStream(video, userVideoStream, this.user)
            })
          })
          socket.on('newUser', (data) => {
            console.log('iki gabung ', data)
            this.callNewUser(data.user, stream)
          })
          /* socket.on('user-keluar', userID => {
            console.log('iki metu' + userID)
            socket.emit('disconnect')
            if (this.peerss[userID]) {
              this.peerss[userID].close()
            }
          }) */
        }).catch(err => console.log(err))
    },
    callNewUser (user, stream) {
      let str = stream[0]
      this.userChat.push(user)
      const call = myPeer.call(user.userID, stream)
      const video = document.createElement('video')
      const userCard = document.getElementById('video-audience')
      video.id = `video-${user.userID}`
      video.srcObject = str
      video.autoplay = true
      // video.muted = pc[partnerName].user.tipe === 'Guru' ? false : true;
      video.className = 'remote-video'
      video.muted = true

      // video controls elements
      const controlDiv = document.createElement('div')
      controlDiv.className = 'text-h5 absolute-bottom text-center'
      controlDiv.innerHTML = `<i class="fa fa-user-times text-white pr-3 kill-video" title="Keluarkan" id="${user.userID}--kill"></i>
          <i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
          <i class="fa fa-expand text-white expand-remote-video" title="Layar Penuh" id="${user.userID}--nama"></i>`

      // create a new div for card
      const cardDiv = document.createElement('div')
      cardDiv.id = user.userID
      cardDiv.appendChild(video)
      cardDiv.appendChild(controlDiv)
      userCard.appendChild(video)
      call.on('stream', userVideoStream => {
        this.addVideoStream(video, userVideoStream, user)
      })
      call.on('close', () => {
        document.getElementById(`${user.userID}-video`).remove()
        video.remove()
      })
      this.peerss[user.userID] = call
    },
    addVideoStream (video, stream, user) {
      video.srcObject = stream
      user.srcObject = stream
      video.addEventListener('loadedmetadata', () => {
        video.play()
      })
      let a = document.getElementById(user.userID)
      console.log(user.userID)
      if (a) {
        a.append(video)
      }
      document.getElementById('video-audience').append(video)
      document.getElementById('video-grid').append(video)
    },
    getAndSetUserStream () {
      this.getUserFullMedia().then((stream) => {
        // save my stream
        this.myStream = stream

        this.setLocalStream(stream, true, this.user)
      }).catch((e) => {
        console.error(`stream error: ${e}`)
      })
    },
    setLocalStream (stream, mirrorMode = true, usr) {
      const localVidElem = document.getElementById('local')
      console.log('iki lokal ', usr)
      localVidElem.srcObject = stream
      mirrorMode ? localVidElem.classList.add('mirror-mode') : localVidElem.classList.remove('mirror-mode')
      if (usr.tipe === 'Guru') {
        // const videoID = document.getElementById(`${usr.id}`);
        let newVid = document.createElement('video')
        newVid.id = `${usr.id}-video`
        newVid.srcObject = stream
        newVid.autoplay = true
        newVid.muted = true
        newVid.className = 'remote-video'

        // video controls elements
        let controlDiv = document.createElement('div')
        controlDiv.className = 'text-h5 absolute-bottom text-center'
        controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                <i class="fa fa-expand text-white expand-remote-video" title="Expand" >${usr.nama}</i>`

        // create a new div for card
        let cardDiv = document.createElement('div')
        cardDiv.className = 'card guru card-sm'
        cardDiv.id = usr.id
        cardDiv.appendChild(newVid)
        cardDiv.appendChild(controlDiv)

        // put div in main-section elem
        document.getElementById('video-audience').appendChild(cardDiv)

        // adjustVideoElemSize();
      }
    },
    getIceServer () {
      return {
        iceServers: [
          // { urls: 'stun:stun.services.mozilla.org' },
          // { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: 'stun:103.129.220.158:3478',
            username: 'ndomo',
            password: 'sapigodok'
          },
          {
            urls: 'turn:103.129.220.158:3002',
            username: 'ndomo',
            credential: 'password'
          }
        ]
      }
    },
    getUserFullMedia () {
      if (this.userMediaAvailable()) {
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        })
      } else {
        throw new Error('User media not available')
      }
    },

    getUserAudio () {
      if (this.userMediaAvailable()) {
        return navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        })
      } else {
        throw new Error('User media not available')
      }
    },
    shareScreen () {
      if (this.userMediaAvailable()) {
        return navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        })
      } else {
        throw new Error('User media not available')
      }
    },
    sharingScreen () {
      this.shareScreen().then((stream) => {
        // this.toggleShareIcons(true)

        // disable the video toggle btns while sharing screen. This is to ensure clicking on the btn does not interfere with the screen sharing
        // It will be enabled was user stopped sharing screen
        // this.toggleVideoBtnDisabled(true)

        // save my screen stream
        this.screen = stream

        // share the new stream with all partners
        this.broadcastNewTracks(stream, 'video', false)

        // When the stop sharing button shown by the browser is clicked
        this.screen.getVideoTracks()[0].addEventListener('ended', () => {
          this.stopSharingScreen()
        })
      }).catch((e) => {
        console.error(e)
      })
    },
    stopSharingScreen () {
      // enable video toggle btn
      // this.toggleVideoBtnDisabled(false)

      return new Promise((resolve, reject) => {
        if (this.screen.getTracks().length) {
          this.screen.getTracks().forEach(track => track.stop())
        }
        resolve()
      })
        .then(() => {
          // this.toggleShareIcons(false)
          this.broadcastNewTracks(this.myStream, 'video')
        }).catch((e) => {
          console.error(e)
        })
    },
    userMediaAvailable () {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)
    },
    closeVideo (elemId) {
      if (document.getElementById(elemId)) {
        document.getElementById(elemId).remove()
      }
    },
    replaceTrack (stream, recipientPeer) {
      let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find(s => s.track && s.track.kind === stream.kind) : false
      if (sender) sender.replaceTrack(stream)
    },
    broadcastNewTracks (stream, type, mirrorMode = true) {
      this.setLocalStream(stream, true, this.user)

      let track = type === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]

      for (let p in this.pc) {
        let pName = this.pc[p]

        if (typeof this.pc[pName] === 'object') {
          this.replaceTrack(track, this.pc[pName])
        }
      }
    },
    init (createOffer, partnerName, dta) {
      this.pc[partnerName] = new RTCPeerConnection(this.getIceServer())
      // if (!createOffer) {
      this.pc[partnerName].user = dta
      // }

      if (this.screen && this.screen.getTracks().length) {
        this.screen.getTracks().forEach((track) => {
          this.pc[partnerName].addTrack(track, this.screen)// should trigger negotiationneeded event
        })
      } else if (this.myStream) {
        this.myStream.getTracks().forEach((track) => {
          this.pc[partnerName].addTrack(track, this.myStream)// should trigger negotiationneeded event
        })
      } else {
        this.getUserFullMedia().then((stream) => {
          // save my stream
          this.myStream = stream

          stream.getTracks().forEach((track) => {
            this.pc[partnerName].addTrack(track, stream)// should trigger negotiationneeded event
          })

          // h.setLocalStream( stream, true, userss );
        }).catch((e) => {
          console.error(`stream error: ${e}`)
        })
      }

      // create offer
      if (createOffer) {
        this.pc[partnerName].onnegotiationneeded = async () => {
          let offer = await this.pc[partnerName].createOffer()

          await this.pc[partnerName].setLocalDescription(offer)

          socket.emit('sdp', { description: this.pc[partnerName].localDescription, to: partnerName, sender: this.user.socketId })
        }
      }

      // send ice candidate to partnerNames
      this.pc[partnerName].onicecandidate = ({ candidate }) => {
        socket.emit('iceCandidates', { candidate: candidate, to: partnerName, sender: this.user.socketId })
      }

      // add
      this.pc[partnerName].ontrack = (e) => {
        let str = e.streams[0]
        if (document.getElementById(`${partnerName}-video`)) {
          document.getElementById(`${partnerName}-video`).srcObject = str
          // document.getElementById( `${ partnerName }-nama` ).innerHTML = pc[partnerName].user.nama_lengkap;
        } else {
          // video elem
          let newVid = document.createElement('video')
          newVid.id = `${partnerName}-video`
          newVid.srcObject = str
          newVid.autoplay = true
          newVid.muted = this.pc[partnerName].user.tipe !== 'Guru'
          newVid.className = 'remote-video'

          // video controls elements
          let controlDiv = document.createElement('div')
          controlDiv.className = 'remote-video-controls'
          controlDiv.innerHTML = `<i class="fa fa-user-times text-white pr-3 kill-video" data-toggle="modal" data-target="#exampleModal" title="Keluarkan" id="${partnerName}--kill"></i> <i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                        <i class="fa fa-expand text-white expand-remote-video" title="Layar Penuh" id="${partnerName}--nama">${this.pc[partnerName].user.nama_lengkap}</i>`

          // create a new div for card
          let cardDiv = document.createElement('div')

          cardDiv.id = partnerName
          cardDiv.appendChild(newVid)
          cardDiv.appendChild(controlDiv)

          // put div in main-section elem
          if (dta.tipe === 'Guru') {
            document.getElementById('guru').appendChild(cardDiv)
            let idGuru = document.getElementById(`${partnerName}-video`)
            cardDiv.className = 'card card-sm guru'
            if (idGuru) {
              console.log(idGuru)
            }
          } else {
            cardDiv.className = 'card card-sm siswa'
            document.getElementById('video-grid').appendChild(cardDiv)
          }
          // h.adjustVideoElemSize()
        }
      }

      this.pc[partnerName].onconnectionstatechange = (d) => {
        switch (this.pc[partnerName].iceConnectionState) {
          case 'disconnected':
          case 'failed':
            this.closeVideo(partnerName)
            break

          case 'closed':
            this.closeVideo(partnerName)
            break
        }
      }

      this.pc[partnerName].onsignalingstatechange = (d) => {
        switch (this.pc[partnerName].signalingState) {
          case 'closed':
            console.log("Signalling state is 'closed'")
            this.closeVideo(partnerName)
            break
        }
      }
    }
  }
}
</script>
<style scoped>
.local-video{
    bottom: 0;
    right: 0;
    position: fixed;
    width:15vw;
}

.mirror-mode{
    -ms-transform: scaleX(-1);
    -moz-transform: scaleX(-1);
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
}

</style>
