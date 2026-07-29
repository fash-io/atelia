import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Check, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { formatNGN } from '@/lib/format';
import { format } from 'date-fns';
import { randomBlobKey } from '@/lib/random-pill';
import { usePlans } from '@/api/hooks/plan/usePlans';
import { usePlan } from '@/api/hooks/plan/usePlan';
import {
  useChoosePlan,
  useCancelSubscription,
  useResumeSubscription,
} from '@/api/hooks/plan/usePlanMutations';
import { useVerifyPayment } from '@/api/hooks/payment/useVerifyPayment';
import { queryClient } from '@/lib/query-client';
import { planService } from '@/api/services/plan.service';

export const Route = createFileRoute('/pricing')({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || undefined,
    trxref: (s.trxref as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Pricing & Billing — Atelier' },
      {
        name: 'description',
        content: 'Atelier plans in Nigerian Naira. Pay securely with Paystack.',
      },
    ],
  }),
  component: PricingPage,
  loader: () =>
    queryClient.ensureQueryData({
      queryKey: ['plans'],
      queryFn: () => planService.getPlans(),
    }),
});

function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/pricing' });
  const plans = Route.useLoaderData();

  const { data: userPlan } = usePlan();
  const sub = userPlan?.s ?? null;
  const isPro = userPlan?.isPro ?? false;

  const choosePlan = useChoosePlan();
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();
  const verifyPayment = useVerifyPayment();

  useEffect(() => {
    const ref = search.reference ?? search.trxref;
    if (!ref) return;

    verifyPayment.mutate(ref, {
      onSettled: () => {
        navigate({
          to: '/pricing',
          replace: true,
          search: { reference: undefined, trxref: undefined },
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.reference, search.trxref]);

  const busy = choosePlan.isPending
    ? (choosePlan.variables as string)
    : verifyPayment.isPending
      ? 'verify'
      : null;

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="eyebrow">Pricing & billing</p>
        <h1 className="display-lg mt-2">Simple plans. Serious visibility.</h1>
        <p className="mt-4 text-foreground/60 max-lg:text-sm">
          Free forever to publish. Upgrade when you're ready to be found first. Secure payment by
          Paystack.
        </p>
      </div>

      {user && isPro && (
        <div className="mt-12 max-w-3xl mx-auto rounded-3xl border border-foreground/10 p-5 sm:p-8 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Your subscription</p>
              <h2 className="font-display text-3xl mt-2 capitalize">
                {sub?.plan ?? (isPro ? 'pro' : 'free')}
              </h2>
              {sub?.current_period_end && (
                <p className="text-sm text-foreground/60 mt-1">
                  {sub.cancel_at_period_end ? 'Ends' : 'Renews'} on{' '}
                  {format(new Date(sub.current_period_end), 'd MMM yyyy')}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isPro && !sub?.cancel_at_period_end && sub?.id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      !confirm(
                        "Cancel at the end of the current period? You'll keep Pro until then.",
                      )
                    )
                      return;
                    cancelSubscription.mutate(sub.id);
                  }}
                >
                  Cancel subscription
                </Button>
              )}
              {sub?.cancel_at_period_end && (
                <Button onClick={() => resumeSubscription.mutate()}>Resume subscription</Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-4">
        {plans?.map((p, i) => {
          const current = (sub?.plan ?? (isPro ? 'pro' : 'free')) === p.id;
          return (
            <div
              key={p.id}
              style={{ animationDelay: `${i === 0 ? 240 : i === 1 ? 120 : 360}ms` }}
              className={`animate-card-rise rounded-3xl p-6 sm:p-8 flex flex-col duration-200 ease-out-soft ${
                p.highlight
                  ? 'bg-foreground text-background shadow-(--shadow-lift) hover:lg:-translate-y-3'
                  : 'border border-foreground/10 bg-card relative origin-bottom lg:translate-y-5 hover:lg:rotate-0 hover:lg:scale-100 hover:lg:translate-0'
              } ${i === 0 && 'lg:-rotate-3 lg:scale-90'} ${i === 2 && 'lg:rotate-3 lg:scale-90'}`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`font-display text-2xl ${p.highlight ? 'text-background' : ''}`}>
                  {p.name}
                </h3>
                {p.highlight && <span className={`lime-pill ${randomBlobKey()}`}>Most loved</span>}
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className={`font-display text-5xl ${p.highlight ? 'text-background' : ''}`}>
                  {p.price_ngn > 0 ? formatNGN(p.price_ngn) : '₦0'}
                </span>
                <span className={p.highlight ? 'text-background/60' : 'text-foreground/60'}>
                  / {p.period}
                </span>
              </div>
              <p
                className={`mt-3 text-sm ${p.highlight ? 'text-background/70' : 'text-foreground/60'}`}
              >
                {p.blurb}
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {p.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 h-5 w-5 rounded-full grid place-items-center shrink-0 ${p.highlight ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'}`}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className={p.highlight ? 'text-background/90' : ''}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                variant={p.highlight ? 'default' : 'ink'}
                className="mt-8 w-full"
                onClick={() => {
                  if (!user) return navigate({ to: '/auth' });
                  choosePlan.mutate(p.id);
                }}
                disabled={busy === p.id || current || busy === 'verify'}
              >
                {p.highlight && <Sparkles className="h-4 w-4" />}
                {busy === p.id
                  ? 'Starting payment…'
                  : busy === 'verify'
                    ? 'Verifying…'
                    : current
                      ? 'Current plan'
                      : p.price_ngn > 0
                        ? 'Pay with Paystack'
                        : p.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-foreground/40">
        Payments processed securely by Paystack. Prices in Nigerian Naira (NGN).
      </p>

      {!user && (
        <p className="mt-10 text-center text-sm">
          <Link to="/auth" className="underline">
            Sign in
          </Link>{' '}
          to subscribe.
        </p>
      )}
    </div>
  );
}
