-- WRI Tip Pool Calculator Schema

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_email text NOT NULL,
  plan text DEFAULT 'free',
  subscription_status text DEFAULT 'trial',
  subscription_tier text DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Pool configs (one per org)
CREATE TABLE IF NOT EXISTS public.pool_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  roles jsonb NOT NULL DEFAULT '[]',
  weight_by_hours boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shift logs
CREATE TABLE IF NOT EXISTS public.shift_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  cc_tips numeric(10,2) DEFAULT 0,
  cash_tips numeric(10,2) DEFAULT 0,
  total_tips numeric(10,2) DEFAULT 0,
  payouts jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_logs ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own org data
CREATE POLICY "org_isolation_users" ON public.users
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_pool_configs" ON public.pool_configs
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_shift_logs" ON public.shift_logs
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "org_isolation_organizations" ON public.organizations
  USING (id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

-- Allow insert for auth callback (service role bypasses RLS anyway)
CREATE POLICY "allow_own_user_insert" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
