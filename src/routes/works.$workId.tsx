import { workService } from '@/api/services/work.service';
import { queryClient } from '@/lib/query-client';
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';

export const Route = createFileRoute('/works/$workId')({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="display-lg">Couldn't load this work</h1>
        <p className="mt-2 text-foreground/60">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 underline"
        >
          Try again
        </button>
      </div>
    );
  },
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      queryKey: ['work', params.workId],
      queryFn: () => workService.getById(params.workId),
    }),
});
