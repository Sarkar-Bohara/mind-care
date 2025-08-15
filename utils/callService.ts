import { toast } from '@/hooks/use-toast'

export interface CallOptions {
  recipientName: string
  recipientPhone?: string
  callType?: 'voice' | 'video'
  appointmentId?: string | number
  onCallStart?: () => void
  onCallEnd?: () => void
}

export class CallService {
  private static instance: CallService
  private activeCall: boolean = false
  private callStartTime: Date | null = null

  private constructor() {}

  public static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService()
    }
    return CallService.instance
  }

  public async initiateCall(options: CallOptions): Promise<void> {
    if (this.activeCall) {
      toast({
        title: "Call in Progress",
        description: "Please end the current call before starting a new one.",
        variant: "destructive"
      })
      return
    }

    try {
      this.activeCall = true
      this.callStartTime = new Date()
      
      // Show initial toast
      toast({
        title: "Initiating Call",
        description: `Connecting to ${options.recipientName}...`,
      })

      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Show connected toast
      toast({
        title: "Call Connected",
        description: `Connected to ${options.recipientName}. Call in progress...`,
      })

      // Call the onCallStart callback if provided
      if (options.onCallStart) {
        options.onCallStart()
      }

      // In a real implementation, this would integrate with a calling service
      // For now, we'll simulate a call interface
      this.showCallInterface(options)

    } catch (error) {
      this.activeCall = false
      this.callStartTime = null
      
      toast({
        title: "Call Failed",
        description: `Failed to connect to ${options.recipientName}. Please try again.`,
        variant: "destructive"
      })
    }
  }

  public async initiateVideoCall(options: CallOptions): Promise<void> {
    const videoOptions = { ...options, callType: 'video' as const }
    
    if (options.appointmentId) {
      // Redirect to video call page for appointments
      const url = `/video-call?appointment=${options.appointmentId}&patient=${encodeURIComponent(options.recipientName)}`
      window.open(url, '_blank')
      return
    }
    
    await this.initiateCall(videoOptions)
  }

  public endCall(): void {
    if (!this.activeCall) {
      return
    }

    const callDuration = this.callStartTime 
      ? Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000)
      : 0

    this.activeCall = false
    this.callStartTime = null

    toast({
      title: "Call Ended",
      description: `Call duration: ${this.formatDuration(callDuration)}`,
    })

    // Remove call interface
    this.hideCallInterface()
  }

  public isCallActive(): boolean {
    return this.activeCall
  }

  private showCallInterface(options: CallOptions): void {
    // Create a simple call interface overlay
    const callInterface = document.createElement('div')
    callInterface.id = 'call-interface'
    callInterface.className = 'fixed top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 min-w-[300px]'
    
    callInterface.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900">${options.recipientName}</h4>
            <p class="text-sm text-gray-600">${options.callType === 'video' ? 'Video Call' : 'Voice Call'}</p>
          </div>
        </div>
        <div class="text-sm text-gray-500" id="call-timer">00:00</div>
      </div>
      <div class="flex space-x-2">
        <button id="mute-btn" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm">
          🔇 Mute
        </button>
        <button id="end-call-btn" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm">
          📞 End Call
        </button>
      </div>
    `

    document.body.appendChild(callInterface)

    // Add event listeners
    const endCallBtn = document.getElementById('end-call-btn')
    if (endCallBtn) {
      endCallBtn.addEventListener('click', () => this.endCall())
    }

    const muteBtn = document.getElementById('mute-btn')
    let isMuted = false
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        isMuted = !isMuted
        muteBtn.textContent = isMuted ? '🔊 Unmute' : '🔇 Mute'
        muteBtn.className = isMuted 
          ? 'flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm'
          : 'flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm'
      })
    }

    // Start timer
    this.startCallTimer()
  }

  private hideCallInterface(): void {
    const callInterface = document.getElementById('call-interface')
    if (callInterface) {
      callInterface.remove()
    }
  }

  private startCallTimer(): void {
    const timer = setInterval(() => {
      if (!this.activeCall || !this.callStartTime) {
        clearInterval(timer)
        return
      }

      const elapsed = Math.floor((new Date().getTime() - this.callStartTime.getTime()) / 1000)
      const timerElement = document.getElementById('call-timer')
      if (timerElement) {
        timerElement.textContent = this.formatDuration(elapsed)
      }
    }, 1000)
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

// Export convenience functions
export const callService = CallService.getInstance()

export const makeCall = (recipientName: string, recipientPhone?: string, appointmentId?: string | number) => {
  return callService.initiateCall({
    recipientName,
    recipientPhone,
    appointmentId
  })
}

export const makeVideoCall = (recipientName: string, appointmentId?: string | number) => {
  return callService.initiateVideoCall({
    recipientName,
    appointmentId,
    callType: 'video'
  })
}

export const endCall = () => {
  return callService.endCall()
}

export const isCallActive = () => {
  return callService.isCallActive()
}