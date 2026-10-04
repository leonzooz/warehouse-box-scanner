# Warehouse Box Scanner

Multi-tenant LoginAI customer portal. Each customer uses one company subdomain and feature paths.

Tenant settings live in `tenants.js`. The hostname `anling.loginai.space` resolves to tenant `anling`; during development use `?tenant=anling`.

Routes:

- `/warehouse/` - warehouse label camera
- `/warehouse/stats.html` - warehouse carton statistics
- `/taobao/` - reserved for the Taobao intake tool
- `/admin/` - reserved for the company administration tool

Each tenant needs a matching entry in the Apps Script `PACKING_TENANTS` map. Give every customer its own Google Sheet ID and Drive folder ID to keep data separated.
