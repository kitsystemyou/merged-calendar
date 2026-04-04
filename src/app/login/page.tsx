'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Merged Calendar</CardTitle>
          <CardDescription>
            お二人のための共有カレンダーアプリですわ。
            <br />
            Googleアカウントでログインしてください。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-4">
          <Button onClick={handleLogin} className="w-full py-6 text-lg" variant="outline">
            <LogIn className="mr-2 h-5 w-5" />
            Googleでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
