DevLog - Database Backup & Restoration Guide
=============================================

This directory contains the complete database schema, constraints, migrations history,
and seed data for the DevLog application.

File: devlog_schema_and_seed.sql
Generated with: PostgreSQL pg_dump (schema + data)
Default Database Name: Devlog

PREREQUISITES
-------------
1. PostgreSQL server running locally or on a remote host (default port: 5432).
2. The `psql` command-line utility (installed as part of PostgreSQL command line tools).

HOW TO RESTORE THE DATABASE
---------------------------

Step 1: Create the target database (if it does not already exist)
Using psql or pgAdmin:

    psql -U <username> -h <host> -p <port> -c "CREATE DATABASE \"Devlog\";"

Example (default local setup):
    psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE \"Devlog\";"

Step 2: Restore the schema and data from the SQL dump file
From the project root:

    psql -U <username> -h <host> -p <port> -d Devlog -f database/devlog_schema_and_seed.sql

Example (default local setup):
    psql -U postgres -h localhost -p 5432 -d Devlog -f database/devlog_schema_and_seed.sql

You will be prompted to enter your PostgreSQL user password securely via the terminal.
Never write or commit passwords into configuration files or command scripts.

Step 3: Update your backend/.env
Make sure your backend/.env DATABASE_URL matches your local PostgreSQL credentials:

    DATABASE_URL="postgresql://<username>:<password>@localhost:5432/Devlog?schema=public"

Step 4: Verify the restored data
You can query the restored tables with psql:

    psql -U postgres -d Devlog -c "SELECT id, name, environment FROM \"Service\";"
    psql -U postgres -d Devlog -c "SELECT id, title, severity, status FROM \"Incident\";"

Expected baseline data:
- 3 Services: User Auth (PRODUCTION), Billing Engine (PRODUCTION), Notification API (STAGING)
- 3 Incidents: 2 OPEN, 1 RESOLVED with associated PostMortem record (90 minutes)
