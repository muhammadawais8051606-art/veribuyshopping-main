-- Extend seller_profiles
DO $$ BEGIN
  CREATE TYPE public.seller_type AS ENUM ('individual','business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS seller_type public.seller_type NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS professional_email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS warehouse_address_line1 text,
  ADD COLUMN IF NOT EXISTS warehouse_address_line2 text,
  ADD COLUMN IF NOT EXISTS warehouse_city text,
  ADD COLUMN IF NOT EXISTS warehouse_state text,
  ADD COLUMN IF NOT EXISTS warehouse_postal_code text,
  ADD COLUMN IF NOT EXISTS warehouse_country text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS account_holder text,
  ADD COLUMN IF NOT EXISTS iban text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

-- Documents table
DO $$ BEGIN
  CREATE TYPE public.seller_doc_type AS ENUM ('cnic_front','cnic_back','trade_license','selfie_with_id');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.seller_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_user_id uuid NOT NULL,
  doc_type public.seller_doc_type NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seller_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage own documents select"
  ON public.seller_documents FOR SELECT
  USING (auth.uid() = seller_user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Sellers insert own documents"
  ON public.seller_documents FOR INSERT
  WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Sellers delete own documents"
  ON public.seller_documents FOR DELETE
  USING (auth.uid() = seller_user_id OR public.has_role(auth.uid(),'admin'));

-- Sub-user team
DO $$ BEGIN
  CREATE TYPE public.seller_team_role AS ENUM ('owner','operations');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.seller_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_owner_id uuid NOT NULL,
  member_user_id uuid,
  invited_email text NOT NULL,
  team_role public.seller_team_role NOT NULL DEFAULT 'operations',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_owner_id, invited_email)
);
ALTER TABLE public.seller_team_members ENABLE ROW LEVEL SECURITY;

-- Helper function: is the caller a member of given seller's team (any role)?
CREATE OR REPLACE FUNCTION public.is_seller_team_member(_owner uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.seller_team_members
    WHERE seller_owner_id = _owner AND member_user_id = _user
  )
$$;

CREATE OR REPLACE FUNCTION public.get_seller_team_role(_owner uuid, _user uuid)
RETURNS public.seller_team_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT team_role FROM public.seller_team_members
  WHERE seller_owner_id = _owner AND member_user_id = _user
  LIMIT 1
$$;

CREATE POLICY "Owner views own team"
  ON public.seller_team_members FOR SELECT
  USING (auth.uid() = seller_owner_id OR auth.uid() = member_user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owner inserts team members"
  ON public.seller_team_members FOR INSERT
  WITH CHECK (auth.uid() = seller_owner_id);

CREATE POLICY "Owner deletes team members"
  ON public.seller_team_members FOR DELETE
  USING (auth.uid() = seller_owner_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Owner updates team members"
  ON public.seller_team_members FOR UPDATE
  USING (auth.uid() = seller_owner_id);

-- Private storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-documents','seller-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sellers read own docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'seller-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'))
  );

CREATE POLICY "Sellers upload own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'seller-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Sellers delete own docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'seller-documents'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin'))
  );
