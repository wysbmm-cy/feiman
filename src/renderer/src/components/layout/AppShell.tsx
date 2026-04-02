import React from 'react'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { useStore } from '../../store'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useStore()

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && <Sidebar />}
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      <StatusBar />
    </div>
  )
}
