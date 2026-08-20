-- Add vendor roles to user_role (must commit before tables use them)
alter type user_role add value if not exists 'vendor';
alter type user_role add value if not exists 'vendor_employee';
