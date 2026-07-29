import { Outlet, Link, createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { AuthProvider } from '@/lib/auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Toaster } from '@/components/ui/sonner';

import appCss from '../styles.css?url';
import blobCss from '../blob.css?url';
import animationsCss from '../animations.css?url';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="display-lg mt-2">Lost in the gallery</h1>
        <p className="mt-3 text-foreground/60">
          The page you're looking for has been moved or doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Atelier — Where spatial creatives show their work' },
      {
        name: 'description',
        content:
          'A creative platform for architects, interior designers, event organisers, civil engineers, artists and makers. Showcase your work, find clients, post jobs.',
      },
      { name: 'author', content: 'Atelier' },
      { property: 'og:title', content: 'Atelier — Where spatial creatives show their work' },
      {
        property: 'og:description',
        content:
          'A creative platform for architects, interior designers, event organisers, civil engineers, artists and makers. Showcase your work, find clients, post jobs.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Atelier — Where spatial creatives show their work' },
      {
        name: 'twitter:description',
        content:
          'A creative platform for architects, interior designers, event organisers, civil engineers, artists and makers. Showcase your work, find clients, post jobs.',
      },
      {
        property: 'og:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/52e7def2-42c1-4d05-8232-acc37e1a312d/id-preview-c73da440--62ef32f7-f2a6-461f-8d2b-f610d560fe23.lovable.app-1777629483171.png',
      },
      {
        name: 'twitter:image',
        content:
          'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/52e7def2-42c1-4d05-8232-acc37e1a312d/id-preview-c73da440--62ef32f7-f2a6-461f-8d2b-f610d560fe23.lovable.app-1777629483171.png',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: blobCss },
      { rel: 'stylesheet', href: animationsCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <QueryClientProvider client={queryClient}>
            <Outlet />
          </QueryClientProvider>
        </main>
        <SiteFooter />
      </div>
      <Toaster />
    </AuthProvider>
  );
}
