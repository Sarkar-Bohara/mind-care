"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings } from "lucide-react"

function VideoCallContent() {
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get('appointment')
  const patientName = searchParams.get('patient')
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [callStatus, setCallStatus] = useState('connecting')

  useEffect(() => {
    // Simulate connection process
    const timer = setTimeout(() => {
      setCallStatus('connected')
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleEndCall = () => {
    setCallStatus('ended')
    // In a real app, this would clean up the video call and redirect
    setTimeout(() => {
      window.close()
    }, 1000)
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-t-lg p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Video Call Session</h1>
            <p className="text-sm text-gray-600">
              Appointment #{appointmentId} with {decodeURIComponent(patientName || 'Patient')}
            </p>
          </div>
          <Badge 
            className={callStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
          >
            {callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
          </Badge>
        </div>

        {/* Video Area */}
        <div className="bg-gray-800 aspect-video rounded-none relative">
          {callStatus === 'connecting' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Connecting to {decodeURIComponent(patientName || 'Patient')}...</p>
              </div>
            </div>
          ) : callStatus === 'ended' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <PhoneOff className="h-16 w-16 mx-auto mb-4 text-red-400" />
                <p className="text-lg">Call Ended</p>
                <p className="text-sm text-gray-400">This window will close automatically</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex">
              {/* Main video (Patient) */}
              <div className="flex-1 bg-gray-700 flex items-center justify-center relative">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold">
                      {decodeURIComponent(patientName || 'P').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-lg">{decodeURIComponent(patientName || 'Patient')}</p>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white">Patient</Badge>
                </div>
              </div>
              
              {/* Picture-in-picture (Doctor) */}
              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-lg font-bold">Dr</span>
                  </div>
                  <p className="text-sm">You</p>
                </div>
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <VideoOff className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-b-lg p-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="lg"
              onClick={toggleAudio}
              className="rounded-full w-12 h-12 p-0"
            >
              {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-12 h-12 p-0"
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-12 h-12 p-0"
            >
              <Settings className="h-5 w-5" />
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full w-12 h-12 p-0"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Session Duration: {callStatus === 'connected' ? '00:00' : '--:--'}
            </p>
          </div>
        </div>
        
        {/* Demo Notice */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Demo Video Call Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              This is a demonstration interface. In a production environment, this would integrate with 
              video conferencing services like Zoom, WebRTC, or similar platforms to provide real video calling functionality.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <VideoCallContent />
    </Suspense>
  )
}