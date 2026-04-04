'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    is_google_sync_enabled: true,
    frica_shared_url: '',
  })

  useEffect(() => {
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setSettings({
          is_google_sync_enabled: data.is_google_sync_enabled,
          frica_shared_url: data.frica_shared_url || '',
        })
      }
      setLoading(false)
    }

    loadSettings()
  }, [supabase, router])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        is_google_sync_enabled: settings.is_google_sync_enabled,
        frica_shared_url: settings.frica_shared_url,
      })
      .eq('id', user.id)

    if (error) {
      toast.error('設定の保存に失敗しましたわ。')
    } else {
      toast.success('設定を保存いたしましたわ。')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">読み込み中...</div>
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4 rounded-full p-2 hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Googleカレンダー連携</CardTitle>
            <CardDescription>
              あなた自身のGoogleカレンダーの予定をマージ画面に表示するかどうかを設定します。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Label htmlFor="google-sync" className="text-base">
              Googleカレンダーの同期を有効にする
            </Label>
            <Switch
              id="google-sync"
              checked={settings.is_google_sync_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, is_google_sync_enabled: checked })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>フリカレ連携</CardTitle>
            <CardDescription>
              フリカレの「共有URL」を登録してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frica-url">フリカレ共有URL</Label>
              <Input
                id="frica-url"
                placeholder="https://fricare.com/share/..."
                value={settings.frica_shared_url}
                onChange={(e) => setSettings({ ...settings, frica_shared_url: e.target.value })}
              />
              <p className="text-sm text-gray-500">
                ※フリカレアプリ内で発行される共有用のURLを入力してください。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-8">
            <Save className="mr-2 h-4 w-4" />
            {saving ? '保存中...' : '設定を保存する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
