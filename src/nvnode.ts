import fetch from 'node-fetch'
import Shell from 'node-powershell'

interface NvNodeConfig {
  port: number
  secret: string
}

interface Headers {
  [key: string]: string
}

type MicrophoneMode = 'PTT' | 'AlwaysOn' | 'Off'

class NvNodeClient {
  ps = new Shell({
    executionPolicy: 'Bypass',
    noProfile: true,
  })
  config!: NvNodeConfig

  async ready() {
    await this.loadConfig()
  }

  dispose(): Promise<string> {
    return this.ps.dispose()
  }

  get endpoint(): string {
    return `http://127.0.0.1:${this.config.port}`
  }

  get headers(): Headers {
    return {
      'content-type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.0 Safari/537.36 NVIDIACEFClient/61.3163.1651.1 NVIDIAOSCClient/3.12.0.84',
      X_LOCAL_SECURITY_COOKIE: this.config.secret,
    }
  }

  private async loadConfig(): Promise<void> {
    this.ps.addCommand(`function GetConfig
{
    $config_handle = [System.IO.MemoryMappedFiles.MemoryMappedFile]::OpenExisting('{8BA1E16C-FC54-4595-9782-E370A5FBE8DA}');
    $stream = $config_handle.CreateViewStream();
    $stream_reader = New-Object System.IO.StreamReader -ArgumentList $stream;
    $config_data = $stream_reader.ReadToEnd().Replace("\`0", "");
    $stream_reader.Dispose();
    $stream.Dispose();
    return $config_data;
}

$config = GetConfig
echo $config`)

    this.config = await this.ps
      .invoke()
      .then((output) => JSON.parse(output) as NvNodeConfig)
  }

  async get<T = unknown>(route: string): Promise<T> {
    const url = `${this.endpoint}${route}`
    const json = (await fetch(url, {
      headers: this.headers,
    }).then((res) => res.json())) as T
    return json
  }

  async post<T = unknown>(route: string, body?: unknown): Promise<T> {
    const url = `${this.endpoint}${route}`
    const json = (await fetch(url, {
      method: 'post',
      body: typeof body !== 'undefined' ? JSON.stringify(body) : body,
      headers: this.headers,
    }).then((res) => res.json())) as T
    return json
  }

  openOverlay(open: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/OpenOsc', { open })
  }

  captureScreenshot(): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Screenshot/Capture')
  }

  getRecord(): Promise<boolean> {
    return this.get<{ status: boolean }>(
      '/ShadowPlay/v.1.0/Record/Enable'
    ).then((response) => response.status)
  }

  setRecord(status: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Record/Enable', { status })
  }

  getInstantReplay(): Promise<boolean> {
    return this.get<{ status: boolean }>(
      '/ShadowPlay/v.1.0/InstantReplay/Enable'
    ).then((response) => response.status)
  }

  setInstantReplay(status: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/InstantReplay/Enable', { status })
  }

  saveInstantReplay(): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/InstantReplay/Save')
  }

  getBroadcast(): Promise<boolean> {
    return this.get<{ status: boolean }>(
      '/ShadowPlay/v.1.0/Broadcast/Enable'
    ).then((response) => response.status)
  }

  setBroadcast(status: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Broadcast/Enable', { status })
  }

  isPauseBroadcast(): Promise<boolean> {
    return this.get<{ pause: boolean }>(
      '/ShadowPlay/v.1.0/Broadcast/Pause'
    ).then((response) => response.pause)
  }

  pauseBroadcast(pause: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Broadcast/Pause', { pause })
  }

  getWebcam(): Promise<boolean> {
    return this.get<{ status: boolean }>(
      '/ShadowPlay/v.1.0/Webcam/Enable'
    ).then((response) => response.status)
  }

  setWebcam(status: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Webcam/Enable', { status })
  }

  isWebcamShown(): Promise<boolean> {
    return this.get<{ shown: boolean }>('/ShadowPlay/v.1.0/Webcam/Shown').then(
      (response) => response.shown
    )
  }

  setShownWebcam(shown: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Webcam/Shown', { shown })
  }

  getMicrophone(): Promise<MicrophoneMode> {
    return this.get<{ mode: MicrophoneMode }>(
      '/ShadowPlay/v.1.0/Microphone'
    ).then((response) => response.mode)
  }

  setMicrophone(mode: MicrophoneMode): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Microphone', { mode })
  }

  setMicrophonePTT(mode: boolean): Promise<unknown> {
    return this.post('/ShadowPlay/v.1.0/Microphone/PTT', {
      mode: mode ? 'on' : 'off',
    })
  }
}

export default NvNodeClient
