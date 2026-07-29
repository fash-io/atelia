//jobs.$jobId.tsx

import { jobService } from '@/api/services/job.service';
import { queryClient } from '@/lib/query-client';
import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router';

export const Route = createFileRoute('/jobs/$jobId')({
  component: () => <Outlet />,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="display-lg">Couldn't load this job</h1>
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
      queryKey: ['job', params.jobId],
      queryFn: () => jobService.getById(params.jobId),
    }),
});
