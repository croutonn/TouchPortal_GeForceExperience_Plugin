import TouchPortalAPI from 'touchportal-api'
import config from './config'
import NvNodeClient from './nvnode'
import StateManager from './state-manager'
import logIt from './logger'

const tp = new TouchPortalAPI.Client()
const nv = new NvNodeClient()
let stateManager: InstanceType<typeof StateManager>

tp.once('connected', async () => {
  await nv.ready()
  stateManager = new StateManager(tp, nv)
})
tp.once('Close', () => {
  stateManager.dispose()
  nv.dispose()
})

type ActionId =
  | 'gfe_capture_screenshot_action'
  | 'gfe_save_instant_replay_action'
  | 'gfe_overlay_action'
  | 'gfe_record_action'
  | 'gfe_instant_replay_action'
  | 'gfe_broadcast_action'
  | 'gfe_pause_broadcast_action'
  | 'gfe_webcam_action'
  | 'gfe_shown_webcam_action'
  | 'gfe_microphone_action'
  | 'gfe_microphone_ptt_action'
  | 'gfe_record'
  | 'gfe_instant_replay'
  | 'gfe_broadcast'

type InlineActionId =
  | 'gfeOverlayAction'
  | 'gfeRecordAction'
  | 'gfeInstantReplayAction'
  | 'gfeBroadcastAction'
  | 'gfePauseBroadcastAction'
  | 'gfeWebcamAction'
  | 'gfeShownWebcamAction'
  | 'gfeMicrophoneAction'

type SwitchValue = 'Off' | 'On' | 'Toggle'
type MicrophoneMode = 'PTT' | 'AlwaysOn' | 'Off'

interface ActionMessage {
  actionId: ActionId
  data?: InlineActionMessage[]
}

interface InlineActionMessage {
  id: InlineActionId
  value?: SwitchValue | MicrophoneMode
}

function togglableInlineActionProc(
  name: keyof InstanceType<typeof StateManager>['state'],
  value: SwitchValue,
  fn: (value: boolean) => Promise<void>,
  inverse: boolean = false
): Promise<void> {
  const newState =
    value === 'Toggle'
      ? !stateManager.state[name]
      : value === 'On'
      ? true
      : false
  return fn.call(stateManager, newState)
}

tp.on('Action', async (message: ActionMessage, hold?: boolean) => {
  if (message.data && message.data.length) {
    const jobs = message.data.map(async (inlineAction) => {
      switch (inlineAction.id) {
        case 'gfeBroadcastAction':
          await togglableInlineActionProc(
            'broadcast',
            inlineAction.value as SwitchValue,
            stateManager.setBroadcast
          )
          break
        case 'gfeInstantReplayAction':
          await togglableInlineActionProc(
            'instant_replay',
            inlineAction.value as SwitchValue,
            stateManager.setInstantReplay
          )
          break
        case 'gfeMicrophoneAction':
          await stateManager.setMicrophone(inlineAction.value as MicrophoneMode)
          break
        case 'gfeOverlayAction':
          await togglableInlineActionProc(
            'overlay',
            inlineAction.value as SwitchValue,
            stateManager.openOverlay
          )
          break
        case 'gfePauseBroadcastAction':
          await togglableInlineActionProc(
            'pause_broadcast',
            inlineAction.value as SwitchValue,
            stateManager.pauseBroadcast
          )
          break
        case 'gfeRecordAction':
          await togglableInlineActionProc(
            'record',
            inlineAction.value as SwitchValue,
            stateManager.setRecord
          )
          break
        case 'gfeShownWebcamAction':
          await togglableInlineActionProc(
            'shown_webcam',
            inlineAction.value as SwitchValue,
            stateManager.setShownWebcam
          )
          break
        case 'gfeWebcamAction':
          await togglableInlineActionProc(
            'webcam',
            inlineAction.value as SwitchValue,
            stateManager.setWebcam
          )
          break
      }
    })
    return Promise.all(jobs)
  } else {
    switch (message.actionId) {
      case 'gfe_capture_screenshot_action':
        await nv.captureScreenshot()
        break
      case 'gfe_save_instant_replay_action':
        await nv.saveInstantReplay()
        break
      case 'gfe_microphone_ptt_action':
        await stateManager.setMicrophonePTT(hold || false)
        break
    }
  }
})

tp.on('Update', (curVersion: string, newVersion: string) => {
  logIt('DEBUG', curVersion, newVersion)
})

tp.connect({ pluginId: config.pluginId, updateUrl: config.updateUrl })
