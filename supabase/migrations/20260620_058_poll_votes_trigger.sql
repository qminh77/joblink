-- Add poll votes trigger for atomicity
CREATE OR REPLACE FUNCTION public.poll_votes_counter_trigger()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_poll_votes_counter ON public.poll_votes;
CREATE TRIGGER trg_poll_votes_counter
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.poll_votes_counter_trigger();

-- Drop the unreliable RPC
DROP FUNCTION IF EXISTS public.increment_poll_vote_count(BIGINT);

-- Recalculate all vote_counts to fix any desynced data
UPDATE public.poll_options po
   SET vote_count = (SELECT COUNT(*) FROM public.poll_votes pv WHERE pv.option_id = po.id);

