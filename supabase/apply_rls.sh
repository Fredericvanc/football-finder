#!/bin/bash

# Development database
echo "Applying RLS policies to development database..."
PGPASSWORD=OI9yfil1yJg45J9T psql -h db.vhnpfpuktmdrbebzhoxb.supabase.co -U postgres -d postgres -f supabase/migrations/20241124134249_init_rls_policies.sql
PGPASSWORD=OI9yfil1yJg45J9T psql -h db.vhnpfpuktmdrbebzhoxb.supabase.co -U postgres -d postgres -f supabase/migrations/20241124200000_add_profile_insert_policy.sql
PGPASSWORD=OI9yfil1yJg45J9T psql -h db.vhnpfpuktmdrbebzhoxb.supabase.co -U postgres -d postgres -f supabase/migrations/20241124210000_add_profile_trigger.sql

# Production database
echo "Applying RLS policies to production database..."
PGPASSWORD=ZJmbzF2zvyEO3WPV psql -h db.ozeblsrgxywexqdccjed.supabase.co -U postgres -d postgres -f supabase/migrations/20241124134249_init_rls_policies.sql
PGPASSWORD=ZJmbzF2zvyEO3WPV psql -h db.ozeblsrgxywexqdccjed.supabase.co -U postgres -d postgres -f supabase/migrations/20241124200000_add_profile_insert_policy.sql
PGPASSWORD=ZJmbzF2zvyEO3WPV psql -h db.ozeblsrgxywexqdccjed.supabase.co -U postgres -d postgres -f supabase/migrations/20241124210000_add_profile_trigger.sql
