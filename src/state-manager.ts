import type TouchPortalAPI from 'touchportal-api'
import type NvNodeClient from './nvnode'

type OnOff = 'On' | 'Off'
type MicrophoneMode = 'PTT' | 'AlwaysOn' | 'Off'
type APIReturnType = boolean | MicrophoneMode

function numberToOnOff(value: number): OnOff {
  return value ? 'On' : 'Off'
}

// function OnOffToNumber(value: OnOff): number {
//   return value === 'On' ? 1 : 0
// }

function numberToMicrophoneMode(value: number): MicrophoneMode {
  switch (value) {
    case 1:
      return 'AlwaysOn'
    case 2:
      return 'PTT'
  }
  return 'Off'
}

function microphoneModeToNumber(mode: MicrophoneMode): number {
  switch (mode) {
    case 'AlwaysOn':
      return 1
    case 'PTT':
      return 2
  }
  return 0
}

type State = Record<
  | 'overlay'
  | 'record'
  | 'instant_replay'
  | 'broadcast'
  | 'pause_broadcast'
  | 'microphone'
  | 'microphone_ptt'
  | 'webcam'
  | 'shown_webcam',
  number
>

class StateManager {
  tp: InstanceType<typeof TouchPortalAPI.Client>
  nv: InstanceType<typeof NvNodeClient>
  updateTimer!: NodeJS.Timeout
  updateInterval: number = 10000
  state: State = {
    overlay: 0,
    record: 0,
    instant_replay: 0,
    broadcast: 0,
    pause_broadcast: 0,
    microphone: 0,
    microphone_ptt: 0,
    webcam: 0,
    shown_webcam: 0,
  }

  constructor(
    tp: InstanceType<typeof TouchPortalAPI.Client>,
    nv: InstanceType<typeof NvNodeClient>
  ) {
    this.tp = tp
    this.nv = nv

    this.checkState('record', this.nv.getRecord, true)
    this.checkState('instant_replay', this.nv.getInstantReplay, true)
    this.checkState('broadcast', this.nv.getBroadcast, true)
    this.checkState('pause_broadcast', this.nv.getBroadcast, true)
    this.checkState('microphone', this.nv.getMicrophone, true)
    this.checkState('webcam', this.nv.getWebcam, true)
    this.checkState('shown_webcam', this.nv.isWebcamShown, true)

    this.updateTimer = setInterval(() => {
      this.checkState('record', this.nv.getRecord)
      this.checkState('instant_replay', this.nv.getInstantReplay)
      this.checkState('broadcast', this.nv.getBroadcast)
      this.checkState('pause_broadcast', this.nv.getBroadcast)
      this.checkState('microphone', this.nv.getMicrophone)
      this.checkState('webcam', this.nv.getWebcam)
      this.checkState('shown_webcam', this.nv.isWebcamShown)
    }, this.updateInterval)
  }

  dispose() {
    clearInterval(this.updateTimer)
  }

  async checkState(
    name: keyof State,
    fn: () => Promise<APIReturnType>,
    forceUpdate: boolean = false
  ) {
    const response = await fn.call(this.nv)
    const value =
      typeof response === 'boolean'
        ? Number(response)
        : microphoneModeToNumber(response)
    if (forceUpdate || this.state[name] !== value) {
      this.updateState(name, value)
    }
    this.state[name] = value
  }

  updateState(name: keyof State, value: number) {
    this.tp.stateUpdate(
      `gfe_${name}`,
      name === 'microphone'
        ? numberToMicrophoneMode(value)
        : numberToOnOff(value)
    )
  }

  async openOverlay(open: boolean): Promise<void> {
    await this.nv.openOverlay(open)
    this.updateState('overlay', Number(open))
  }

  async setRecord(status: boolean): Promise<void> {
    await this.nv.setRecord(status)
    this.updateState('record', Number(status))
  }

  async setInstantReplay(status: boolean): Promise<void> {
    await this.nv.setInstantReplay(status)
    this.updateState('instant_replay', Number(status))
  }

  async setBroadcast(status: boolean): Promise<void> {
    await this.nv.setBroadcast(status)
    this.updateState('broadcast', Number(status))
  }

  async pauseBroadcast(pause: boolean): Promise<void> {
    await this.nv.pauseBroadcast(pause)
    this.updateState('pause_broadcast', Number(pause))
  }

  async setWebcam(status: boolean): Promise<void> {
    await this.nv.setWebcam(status)
    this.updateState('webcam', Number(status))
  }

  async setShownWebcam(shown: boolean): Promise<void> {
    await this.nv.setShownWebcam(shown)
    this.updateState('shown_webcam', Number(shown))
  }

  async setMicrophone(mode: MicrophoneMode): Promise<void> {
    await this.nv.setMicrophone(mode)
    this.updateState('microphone', microphoneModeToNumber(mode))
  }

  async setMicrophonePTT(mode: boolean): Promise<void> {
    await this.nv.setMicrophonePTT(mode)
    this.updateState('microphone_ptt', Number(mode))
  }
}

export default StateManager
