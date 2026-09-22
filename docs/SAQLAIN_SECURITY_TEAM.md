# Saqlain AI — Security Team Plan

## Team

Saqlain coordinates 11 supporting agents: Threat Detection, Malware Guard, Network Guard, Code Guardian, Agent Guard, API Guardian, Identity Guard, Data Guardian, Audit Agent, Recovery Agent, and External Intelligence & Communication.

## External-agent boundary

The External Intelligence & Communication agent may communicate with outside AI agents and collect recent threat intelligence. It does not give outside agents direct access to Gouse AI.

Flow: External agent → Communication Agent → sanitize/validate → Saqlain → decision.

## Protected resources

All protected Gouse AI and Saqlain programs, files, data, backups and source code have zero delete permission at the Saqlain policy layer. Production enforcement should also use server, operating-system, repository and database permissions.

## Mutual protection

Gouse AI and Saqlain protect each other. They cannot attack, delete, disable, overwrite protected peer data, destroy peer backups, or change peer security permissions.

Suspected peer compromise uses: **Contain → Preserve → Log → Verify → Recover**.

## Defensive authority

Saqlain can autonomously defend Gouse AI by detecting, blocking, isolating, quarantining, terminating malicious sessions, revoking compromised credentials, rate-limiting abuse and coordinating recovery. It does not perform offensive takeover or destructive retaliation against unrelated external computers.
