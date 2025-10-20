import React from 'react';
import MatchCard from './MatchCard'; // Assuming MatchCard is a generic component

const ChessScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  // Chess is typically single-player and scored differently. 
  // For simplicity, we can use a generic MatchCard for display/score entry.
  // If specific chess scoring rules are needed, this component can be expanded.

  return (
    <MatchCard 
      match={match} 
      onScoreUpdate={onScoreUpdate}
      isTournamentCompleted={isTournamentCompleted}
      hasAdminRights={hasAdminRights}
    />
  );
};

export default ChessScorecard;
