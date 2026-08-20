-- Add payment_receipt to document types (remote applied via MCP as well)
alter type document_type_enum add value if not exists 'payment_receipt';
