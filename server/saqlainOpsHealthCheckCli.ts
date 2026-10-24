import { checkSaqlainOpsHealth } from './saqlainOpsHealthCheck.ts';

const auditFilePath = process.env.SAQLAIN_BACKUP_AUDIT_FILE?.trim() ?? '';
const configuredMaxAge = process.env.SAQLAIN_OPS_HEALTH_MAX_AGE_MINUTES?.trim();
const maxAgeMinutes = configuredMaxAge ? Number(configuredMaxAge) : undefined;
const report = await checkSaqlainOpsHealth(auditFilePath, {
  ...(maxAgeMinutes === undefined ? {} : { maxAgeMinutes }),
});

process.stdout.write(JSON.stringify(report) + '\n');
if (!report.healthy) process.exitCode = report.code === 'AUDIT_PATH_NOT_CONFIGURED' ? 2 : 1;
