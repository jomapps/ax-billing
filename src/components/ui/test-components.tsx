'use client'

import React, { useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Progress } from './progress'

export function TestComponents() {
  const [progress, setProgress] = useState(33)

  return (
    <div className="p-8 space-y-8 bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-8">shadcn/ui Gaming Components Test</h1>

      {/* Buttons */}
      <Card variant="gaming" className="p-6">
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Gaming-themed button variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="neon">Neon</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="default" glow="subtle">
              Subtle Glow
            </Button>
            <Button variant="neon" glow="strong">
              Strong Glow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card variant="neon" className="p-6">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>Gaming-themed badge variants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Badge variant="default">Default</Badge>
            <Badge variant="neon">Neon</Badge>
            <Badge variant="gaming">Gaming</Badge>
            <Badge variant="glass">Glass</Badge>
            <Badge variant="success">Success</Badge>
          </div>
          <div className="flex flex-wrap gap-4">
            <Badge variant="neon" glow="strong">
              Glowing Neon
            </Badge>
            <Badge variant="gaming" glow="subtle">
              Gaming Glow
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card variant="glass" className="p-6">
        <CardHeader>
          <CardTitle>Progress Bars</CardTitle>
          <CardDescription>Gaming-themed progress indicators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-white">Default Progress</label>
            <Progress value={progress} />
          </div>
          <div className="space-y-2">
            <label className="text-white">Gaming Progress</label>
            <Progress value={progress} variant="gaming" />
          </div>
          <div className="space-y-2">
            <label className="text-white">Neon Progress</label>
            <Progress value={progress} variant="neon" />
          </div>
          <Button onClick={() => setProgress(Math.random() * 100)}>Randomize Progress</Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card variant="default" className="p-6">
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
          <CardDescription>Gaming-themed tab navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">Gaming</TabsTrigger>
              <TabsTrigger value="tab2">Neon</TabsTrigger>
              <TabsTrigger value="tab3">Cyber</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="text-white">
              <h3 className="text-lg font-semibold mb-2">Gaming Tab</h3>
              <p>This is the gaming-themed tab content with dark backgrounds and neon accents.</p>
            </TabsContent>
            <TabsContent value="tab2" className="text-white">
              <h3 className="text-lg font-semibold mb-2">Neon Tab</h3>
              <p>Neon-styled content with glowing effects and cyberpunk aesthetics.</p>
            </TabsContent>
            <TabsContent value="tab3" className="text-white">
              <h3 className="text-lg font-semibold mb-2">Cyber Tab</h3>
              <p>Futuristic cyber-themed content with advanced styling.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog and Sheet */}
      <Card variant="gaming" className="p-6">
        <CardHeader>
          <CardTitle>Modals & Sheets</CardTitle>
          <CardDescription>Gaming-themed dialog and sheet components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="neon">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gaming Dialog</DialogTitle>
                  <DialogDescription>
                    This is a gaming-themed dialog with dark backgrounds and neon accents.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-slate-300">
                    The dialog uses Radix UI primitives with custom gaming styling.
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="neon">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Gaming Sheet</SheetTitle>
                  <SheetDescription>
                    This is a gaming-themed sheet panel with slide animations.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-slate-300">
                    The sheet component is perfect for mobile navigation and side panels.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
