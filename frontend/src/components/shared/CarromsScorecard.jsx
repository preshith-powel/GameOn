import React from 'react';
import MatchCard from './MatchCard';

const CarromsScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  return (
    <MatchCard
      match={match}
      onScoreUpdate={onScoreUpdate}
      isTournamentCompleted={isTournamentCompleted}
      hasAdminRights={hasAdminRights}
    />
  );
};

export default CarromsScorecard;
