'use server';
import { getPublicStatusSnapshot } from '@/lib/status-source';

export async function getStatusOverview() {
  const snapshot = await getPublicStatusSnapshot();
  return { status: snapshot.status, components: snapshot.resources.map(({ id, name, status }) => ({ id, name, status })), lastUpdated: snapshot.checkedAt };
}
export async function getMaintenanceSchedule() {
  const snapshot = await getPublicStatusSnapshot();
  return { maintenance: snapshot.reports.filter(report => report.kind === 'maintenance') };
}
export async function getStatusHistory() {
  const snapshot = await getPublicStatusSnapshot();
  return { incidents: snapshot.reports.filter(report => report.kind === 'incident') };
}
export async function getBetterstackStatus() {
  const snapshot = await getPublicStatusSnapshot();
  return { status: snapshot.status, label: snapshot.label };
}
export async function getPublicStatus() { return getBetterstackStatus(); }
