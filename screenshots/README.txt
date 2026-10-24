DevLog - Application Walkthrough Screenshots
============================================

01-dashboard.png: Main dashboard showing real-time summary cards, incident ledger with severity pills and environment badges, and service analytics table.
02-incident-tabs.png: Incidents table filtered dynamically using the 'Open' tab with zero page reloads.
03-add-incident-modal.png: Accessible 'Log New Incident' modal dialog with client-side form validation and service selection.
04-incident-added.png: Dashboard immediately after logging a new CRITICAL incident, showing real-time query invalidation and updated active cards.
05-resolve-modal.png: 'Resolve & Post-Mortem' modal capturing root cause, resolution remediation steps, and time spent in minutes.
06-resolve-conflict-409.png: Graceful HTTP 409 Conflict error banner displayed inside the modal when an already-resolved incident is submitted concurrently.
07-postmortem-view.png: Post-Mortem detail drawer/modal displaying full root cause analysis, remediation steps, and resolution time budget.
08-services-page.png: Services registry page listing registered microservices, deployment environments, and the 'Register Service' action.
09-service-stats-card.png: Service Downtime & Incident Analytics card ranking services by operational resolution investment using SQL window functions.
10-prisma-studio-tables.png: Prisma Studio visual database browser showing the relational PostgreSQL models (Service, Incident, PostMortem).
