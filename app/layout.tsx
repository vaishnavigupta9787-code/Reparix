import type { Metadata } from 'next'
import Link from 'next/link'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reparix',
  description: 'Never lose your warranty again. Store invoices, track expiry dates, and manage repairs.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClerkProvider>
          <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Reparix
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/my-reports" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                My Warranties
              </Link>
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton>
                  <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
