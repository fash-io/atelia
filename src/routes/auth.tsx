import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useSignUp, useSignIn, useGoogleSignIn } from '@/api/hooks/auth/useAuthMutations';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Sign in — Atelier' },
      {
        name: 'description',
        content:
          'Join Atelier — the creative platform for architects, interior designers, event organisers and makers.',
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email('Enter a valid email').max(255);
const passwordSchema = z.string().min(8, 'At least 8 characters').max(72);

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('artist');

  const signUp = useSignUp();
  const signIn = useSignIn();
  const googleSignIn = useGoogleSignIn();
  const busy = signUp.isPending || signIn.isPending || googleSignIn.isPending;

  useEffect(() => {
    if (user) navigate({ to: '/profile' });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    const pv = passwordSchema.safeParse(password);
    if (!ev.success) return toast.error(ev.error.issues[0].message);
    if (!pv.success) return toast.error(pv.error.issues[0].message);

    try {
      if (mode === 'signup') {
        await signUp.mutateAsync({
          email: ev.data,
          password: pv.data,
          fullName: name.trim(),
          accountType,
        });
        toast.success('Welcome to Atelier — your profile is ready.');
      } else {
        await signIn.mutateAsync({ email: ev.data, password: pv.data });
        toast.success('Welcome back.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  async function handleGoogle() {
    try {
      const result = await googleSignIn.mutateAsync();
      if (result.redirected) return;
      navigate({ to: '/profile' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  }

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12 lg:py-20 grid lg:grid-cols-2 gap-16 items-start">
      <div className="hidden lg:block">
        <p className="eyebrow">{mode === 'signup' ? 'Join Atelier' : 'Welcome back'}</p>
        <h1 className="display-xl mt-4">
          The home of <span className="italic">spatial</span> creatives.
        </h1>
        <p className="mt-6 text-foreground/65 max-w-md leading-relaxed">
          Architects, interior designers, event organisers, civil engineers, artists & makers — show
          your work, win the brief.
        </p>
      </div>

      <div className="max-w-md w-full mx-auto lg:mx-0 lg:ml-auto bg-card border border-foreground/10 rounded-3xl p-8 lg:p-10 shadow-(--shadow-soft)">
        <div className="flex gap-1 p-1 bg-muted rounded-full mb-8 text-sm">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 h-9 rounded-full transition-colors ${mode === 'signin' ? 'bg-background shadow-sm font-medium' : 'text-foreground/60'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 h-9 rounded-full transition-colors ${mode === 'signup' ? 'bg-background shadow-sm font-medium' : 'text-foreground/60'}`}
          >
            Create account
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGoogle}
          disabled={busy}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-foreground/10" />
          <span className="text-xs text-foreground/40 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-foreground/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs uppercase tracking-widest text-foreground/60">
                  Full name
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40"
                  placeholder="Jane Architect"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-foreground/60">
                  I am a…
                </label>
                <select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                  className="mt-1.5 w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40"
                >
                  <option value="artist">Artist</option>
                  <option value="architect">Architect</option>
                  <option value="builder">Builder</option>
                  <option value="designer">Designer</option>
                  <option value="photographer">Photographer</option>
                  <option value="engineer">Civil engineer</option>
                  <option value="studio">Studio / Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-xs uppercase tracking-widest text-foreground/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1.5 w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40"
              placeholder="you@studio.com"
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-foreground/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1.5 w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40"
              placeholder="At least 8 characters"
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? 'Just a moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-xs text-foreground/50 text-center">
          By continuing you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
