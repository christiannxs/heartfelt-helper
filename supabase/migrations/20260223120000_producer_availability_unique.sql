-- Evita slots duplicados para o mesmo usuário/data/início/fim.
ALTER TABLE public.producer_availability
ADD CONSTRAINT producer_availability_user_date_slot_unique
UNIQUE (user_id, date, slot_start, slot_end);
