REVOKE ALL ON FUNCTION public.consume_essay_credit() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refund_essay_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_essay_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_essay_credit() TO authenticated;