
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('atendente', 'produtor', 'ceo');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Demand status enum
CREATE TYPE public.demand_status AS ENUM ('aguardando', 'em_producao', 'concluido');

-- Demands table
CREATE TABLE public.demands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    producer_name TEXT NOT NULL CHECK (producer_name IN ('Mhad', 'Felipe 1x')),
    status demand_status NOT NULL DEFAULT 'aguardando',
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get producer name
CREATE OR REPLACE FUNCTION public.get_producer_name(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles
  WHERE user_id = _user_id
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Demands RLS policies
-- Atendente: can view all, can insert
CREATE POLICY "Atendente can view all demands" ON public.demands
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Atendente can create demands" ON public.demands
FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'atendente') AND created_by = auth.uid()
);

-- Produtor: can view own demands, can update status
CREATE POLICY "Produtor can view own demands" ON public.demands
FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'produtor') AND producer_name = public.get_producer_name(auth.uid())
);

CREATE POLICY "Produtor can update own demands status" ON public.demands
FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'produtor') AND producer_name = public.get_producer_name(auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(), 'produtor') AND producer_name = public.get_producer_name(auth.uid())
);

-- CEO: can view all
CREATE POLICY "CEO can view all demands" ON public.demands
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'ceo'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_demands_updated_at
BEFORE UPDATE ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
