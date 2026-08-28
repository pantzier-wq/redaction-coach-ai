DROP INDEX IF EXISTS public.idx_essays_attempt_id;

-- PostgreSQL permits multiple NULLs in a regular unique index. Unlike the old
-- partial index, this constraint can be used by ON CONFLICT (attempt_id).
CREATE UNIQUE INDEX idx_essays_attempt_id
  ON public.essays(attempt_id);
