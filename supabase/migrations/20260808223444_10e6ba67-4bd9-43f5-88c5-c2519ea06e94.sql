DO $$ 
BEGIN
    -- Delete all related data from public tables
    DELETE FROM public.essay_attempts;
    DELETE FROM public.essays;
    DELETE FROM public.purchase_tokens;
    DELETE FROM public.payment_events;
    DELETE FROM public.profiles;
    
    -- Delete all users from auth schema (cascades or cleans up auth)
    DELETE FROM auth.users;
END $$;