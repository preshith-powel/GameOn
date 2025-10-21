
import React from 'react';
import MatchCard from './MatchCard';

const KabaddiScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  // Kabaddi uses the generic MatchCard for score entry and display
  return (
    <MatchCard
      match={match}
      onScoreUpdate={onScoreUpdate}
      isTournamentCompleted={isTournamentCompleted}
      hasAdminRights={hasAdminRights}
    />
  );
};

export default KabaddiScorecard;
