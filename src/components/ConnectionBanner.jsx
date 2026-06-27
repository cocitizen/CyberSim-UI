import React from 'react';
import { view } from '@risingstack/react-easy-state';
import { FiWifiOff } from 'react-icons/fi';

import { gameStore } from './GameStore';

// Ambient alert shown whenever the live backend connection drops (socket
// disconnect or connect error). Clears itself when the socket reconnects.
const ConnectionBanner = view(() => {
  if (!gameStore.connectionLost) return null;

  return (
    <div className="cs-connection-banner" role="alert">
      <FiWifiOff aria-hidden="true" />
      <span>
        Lost connection to the server — trying to reconnect. Probably
        not a hack… and no, this isn&rsquo;t part of the game.
      </span>
    </div>
  );
});

export default ConnectionBanner;
