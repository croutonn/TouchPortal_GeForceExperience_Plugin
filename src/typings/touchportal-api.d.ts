declare module 'touchportal-api' {
  import EventEmitter from 'events'

  interface State {
    id: string
    desc: string
    value: number | string
  }

  class TouchPortalClient extends EventEmitter {
    createState: (
      id: State['id'],
      desc: State['desc'],
      defaultValue: State['value']
    ) => void
    choiceUpdate: (id: State['id'], value: State['value']) => void
    choiceUpdateSpecific: (
      id: State['id'],
      value: State['value'],
      instanceId: string
    ) => void
    settingUpdate: (name: string, value: string | number | boolean) => void
    stateUpdate: (id: State['id'], value: State['value']) => void
    stateUpdateMany: (states: State[]) => void
    sendArray: (dataArray: unknown[]) => void
    send: (data: unknown) => void
    pair: () => void
    checkForUpdate: () => void
    connect: (options?: { pluginId?: string; updateUrl?: string }) => void
    logIt: () => void
  }

  const TouchPortalAPI = {
    Client: TouchPortalClient,
  }

  export default TouchPortalAPI
}
