# 0004: Host-signed deployment records

Deployment and rollback evidence is signed with a per-host asymmetric key and exposed to the application as read-only records plus explicitly trusted public keys. This keeps the signing authority outside the application container and browser, avoids granting Docker-socket or SSH access, and permits approved peer records to be transported without sharing a secret between staging and production; losing or rotating a host key requires redistributing only its public verification key.
