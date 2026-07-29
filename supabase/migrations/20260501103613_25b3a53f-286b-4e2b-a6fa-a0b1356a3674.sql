
REVOKE EXECUTE ON FUNCTION public.handle_new_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_booking_event() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_application_event() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_job() FROM anon, authenticated, public;
