export const partitionFacilitatorEvents = ({
  injections,
  gameInjections,
  timeTaken,
}) => {
  const deliveryLanesFound = new Set();

  return Object.values(injections || {})
    .sort((a, b) => a.trigger_time - b.trigger_time)
    .reduce(
      (acc, injection) => {
        const gameInjection = gameInjections[injection.id] || {};
        const isBackground = injection.type === 'Background';
        const {
          delivered,
          prevented,
          response_made_at: responseMadeAt,
        } = gameInjection;
        const upcoming = timeTaken < injection.trigger_time;
        const resolved =
          timeTaken > injection.trigger_time &&
          (responseMadeAt ||
            prevented ||
            (isBackground && delivered));
        const canMakeResponse =
          !responseMadeAt && delivered && !isBackground;
        const deliveryLane = injection.location || 'shared';
        const canDeliver =
          !upcoming &&
          !delivered &&
          !deliveryLanesFound.has(deliveryLane) &&
          !prevented;

        if (canDeliver) deliveryLanesFound.add(deliveryLane);

        const injectionWithParams = {
          injection,
          upcoming,
          resolved,
          canDeliver,
          canMakeResponse,
          delivered,
          gameInjection,
          prevented,
          isBackground,
          isDanger:
            !canDeliver &&
            !canMakeResponse &&
            injection.trigger_time - timeTaken < 180000,
        };

        if (resolved) {
          acc.resolvedInjections.push(injectionWithParams);
        } else {
          acc.injectionsToResponse.push(injectionWithParams);
        }
        return acc;
      },
      { injectionsToResponse: [], resolvedInjections: [] },
    );
};
