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
          <header className="rp-nav-wrap">
            <div className="rp-nav">
              <Link href="/" className="rp-brand">
                Reparix
              </Link>
              <div className="rp-nav-links">
                <Link href="/" className="rp-nav-link">
                  Dashboard
                </Link>
                <Link href="/my-reports" className="rp-nav-link">
                  My Warranties
                </Link>
              </div>
              <div className="rp-auth">
                <Link href="/my-reports" className="rp-nav-link mobile-only">
                My Warranties
                </Link>
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton>
                    <button className="rp-signup-btn">Sign Up</button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
