import { Visit } from './types';
import { store } from './store';

export async function calculateWaitTime(visit: Visit): Promise<number | null> {
  if (visit.status !== 'ready' && visit.status !== 'serving') return null;
  if (visit.token_no === null) return null;

  const visits = await store.getVisits();
  const aheadVisits = visits.filter(
    (v) =>
      v.office_id === visit.office_id &&
      (v.status === 'ready' || v.status === 'serving') &&
      v.token_no !== null &&
      v.token_no < (visit.token_no as number)
  );

  let waitMin = 0;
  for (const v of aheadVisits) {
    const service = await store.getService(v.service_id);
    if (service) {
      waitMin += service.duration_min;
    }
  }

  return waitMin;
}

export async function getAheadCount(visit: Visit): Promise<number> {
  if (visit.token_no === null) return 0;
  
  const visits = await store.getVisits();
  return visits.filter(
    (v) =>
      v.office_id === visit.office_id &&
      (v.status === 'ready' || v.status === 'serving') &&
      v.token_no !== null &&
      v.token_no < (visit.token_no as number)
  ).length;
}
