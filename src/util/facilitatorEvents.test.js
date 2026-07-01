import { partitionFacilitatorEvents } from './facilitatorEvents';

describe('partitionFacilitatorEvents', () => {
  it('keeps delivery unlocking independent for each location lane', () => {
    const injections = [
      { id: 'hq-1', location: 'hq', trigger_time: 100 },
      { id: 'local-1', location: 'local', trigger_time: 110 },
      { id: 'shared-1', location: null, trigger_time: 120 },
      { id: 'hq-2', location: 'hq', trigger_time: 130 },
      { id: 'local-2', location: 'local', trigger_time: 140 },
      { id: 'shared-2', location: null, trigger_time: 150 },
    ];

    const { injectionsToResponse } = partitionFacilitatorEvents({
      injections,
      gameInjections: {},
      timeTaken: 200,
    });
    const deliverableIds = injectionsToResponse
      .filter(({ canDeliver }) => canDeliver)
      .map(({ injection }) => injection.id);

    expect(deliverableIds).toEqual(['hq-1', 'local-1', 'shared-1']);
  });
});
