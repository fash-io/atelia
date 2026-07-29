import { Inbox, Mail, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from '@tanstack/react-router';

export function ContactTab({
  userEmail,
  location,
}: {
  userEmail: string;
  location: string | null;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-10 max-w-3xl">
      <div className="mb-6">
        <p className="eyebrow h-9 pt-2">Reach you</p>
        <h3 className="display-md mt-2">Your inbox</h3>
        <p className="mt-3 text-foreground/65">
          Anyone visiting your public profile can send you a message. Replies thread together so you
          can keep the whole conversation in one place.
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-foreground/50" /> {userEmail}
          </div>
          {location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-foreground/50" /> {location}
            </div>
          )}
        </div>
        <Button asChild className="mt-6">
          <Link to="/inbox">
            <Inbox className="h-4 w-4" /> Open inbox
          </Link>
        </Button>
      </div>
      <div className="rounded-2xl border border-foreground/10 p-6 bg-foreground/2">
        <p className="eyebrow">Tip</p>
        <h4 className="font-display text-xl mt-2">Add a clear headline</h4>
        <p className="text-sm text-foreground/65 mt-2">
          Profiles with a sharp one-line description of who they help and how get 3× more inquiries.
          Edit your profile to add yours.
        </p>
      </div>
    </div>
  );
}
