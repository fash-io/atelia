import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect } from 'react';
import { CreditCard, Trash2, Plus, Sparkles, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { usePlan } from '@/api/hooks/plan/usePlan';
import { useCancelSubscription, useResumeSubscription } from '@/api/hooks/plan/usePlanMutations';
import { useCards } from '@/api/hooks/billing/useCards';
import {
  useMakeDefaultCard,
  useRemoveCard,
  useAddCard,
  useVerifySaveCard,
} from '@/api/hooks/billing/useCardMutations';

export const Route = createFileRoute('/settings/billing')({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || undefined,
    trxref: (s.trxref as string) || undefined,
  }),
  head: () => ({ meta: [{ title: 'Manage subscription — Atelier' }] }),
  component: ManageBilling,
});

function ManageBilling() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/settings/billing' });

  const { data: userPlan } = usePlan();
  const sub = userPlan?.s ?? null;
  const isPro = userPlan?.isPro ?? false;

  const { data: cards = [] } = useCards(user?.id);
  const cancelSubscription = useCancelSubscription();
  const resumeSubscription = useResumeSubscription();
  const makeDefault = useMakeDefaultCard(user?.id);
  const removeCard = useRemoveCard(user?.id);
  const addCard = useAddCard();
  const verifySaveCard = useVerifySaveCard(user?.id);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  useEffect(() => {
    const ref = search.reference ?? search.trxref;
    if (!ref) return;
    verifySaveCard.mutate(ref, {
      onSuccess: ({ j, res }) => {
        if (res.ok && j.ok) {
          toast.success('Card saved');
        } else {
          toast.error('Could not verify card', { description: j?.status ?? 'Please try again.' });
        }
      },
      onSettled: () => {
        navigate({
          to: '/settings/billing',
          replace: true,
          search: { reference: undefined, trxref: undefined },
        });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.reference, search.trxref]);

  if (!user) return null;

  function handleCancel() {
    if (!sub) return;
    if (!confirm("Cancel at the end of the current period? You'll keep Pro until then.")) return;
    cancelSubscription.mutate(sub.id, {
      onSuccess: () => {
        toast.success(
          'Subscription will end on ' +
            (sub.current_period_end
              ? format(new Date(sub.current_period_end), 'd MMM yyyy')
              : 'the period end'),
        );
      },
      onError: () => toast.error('Could not cancel subscription'),
    });
  }

  function handleResume() {
    resumeSubscription.mutate(undefined, {
      onSuccess: () => toast.success('Subscription resumed'),
      onError: () => toast.error('Could not resume subscription'),
    });
  }

  function handleMakeDefault(cardId: string) {
    makeDefault.mutate(cardId, {
      onSuccess: () => toast.success('Default card updated'),
      onError: () => toast.error('Could not update default card'),
    });
  }

  function handleRemove(card: { id: string; brand: string; last4: string }) {
    if (!confirm(`Remove ${card.brand} •••• ${card.last4}?`)) return;
    removeCard.mutate(card.id, {
      onSuccess: () => toast.success('Card removed'),
      onError: () => toast.error('Could not remove card'),
    });
  }

  function handleAddCard() {
    addCard.mutate(undefined, {
      onError: () => toast.error('Could not start card verification'),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>
      <p className="eyebrow">Billing</p>
      <h1 className="display-lg mt-2">Manage subscription</h1>

      <div className="mt-10 rounded-3xl border border-foreground/10 p-6 sm:p-8 bg-card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="eyebrow">Current plan</p>
            <h2 className="font-display text-3xl mt-2 capitalize">{userPlan?.plan?.name}</h2>
            <p className="text-sm text-foreground/60 mt-1">
              {userPlan?.plan?.price_ngn ? userPlan?.plan?.price_ngn.toLocaleString() : ''}
            </p>
            {sub?.current_period_end && (
              <p className="text-sm text-foreground/60 mt-3">
                {sub.cancel_at_period_end ? 'Ends on ' : 'Renews on '}
                <span className="font-medium text-foreground">
                  {format(new Date(sub.current_period_end), 'd MMM yyyy')}
                </span>
              </p>
            )}
            {sub?.cancel_at_period_end && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-foreground/70 bg-foreground/5 rounded-full px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5" /> Cancellation pending
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {isPro && !sub?.cancel_at_period_end && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelSubscription.isPending}
              >
                Cancel subscription
              </Button>
            )}
            {sub?.cancel_at_period_end && (
              <Button onClick={handleResume} disabled={resumeSubscription.isPending}>
                Resume subscription
              </Button>
            )}
            <Button asChild>
              <Link to="/pricing">
                <Sparkles className="h-4 w-4" /> Change plan
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-foreground/10 p-6 sm:p-8 bg-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="eyebrow">Payment methods</p>
            <p className="text-sm text-foreground/60 mt-1">Cards on file for your subscription.</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddCard} disabled={addCard.isPending}>
            {addCard.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add card
          </Button>
        </div>
        {verifySaveCard.isPending && (
          <p className="text-sm text-foreground/60 py-4 text-center">Verifying your card…</p>
        )}
        {cards.length === 0 ? (
          <p className="text-sm text-foreground/55 py-6 text-center border border-dashed border-foreground/10 rounded-xl">
            No card on file. Add one to keep Pro active.
          </p>
        ) : (
          <ul className="space-y-2">
            {cards.map(c => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CreditCard className="h-5 w-5 text-foreground/50 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.brand} •••• {c.last4}
                      {c.is_default && <span className="ml-2 lime-pill">Default</span>}
                    </div>
                    <div className="text-xs text-foreground/55 truncate">
                      Exp {String(c.exp_month).padStart(2, '0')}/{String(c.exp_year).slice(-2)}
                      {c.cardholder ? ` · ${c.cardholder}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!c.is_default && (
                    <Button size="sm" variant="ghost" onClick={() => handleMakeDefault(c.id)}>
                      Make default
                    </Button>
                  )}
                  <button
                    onClick={() => handleRemove(c)}
                    className="h-9 w-9 grid place-items-center rounded-full text-foreground/40 hover:text-destructive hover:bg-destructive/5"
                    aria-label="Remove card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-foreground/40">
        Cards are verified and stored securely via Paystack — we never see or store your full card
        number.
      </p>
    </div>
  );
}
