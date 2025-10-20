import React from 'react';
import MatchCard from './MatchCard'; // Assuming MatchCard is a generic component

const HockeyScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  // Hockey scoring logic can be implemented here. For now, using a generic MatchCard.
  return (
    <MatchCard 
      match={match} 
      onScoreUpdate={onScoreUpdate}
      isTournamentCompleted={isTournamentCompleted}
      hasAdminRights={hasAdminRights}
    />
  );
};

export default HockeyScorecard;
