import React from 'react';

const CricketScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  return (
    <div>
      <h3>Cricket Scorecard</h3>
      <p>Match ID: {match._id}</p>
      <p>Team A: {match.teams[0]?.name} - Score: {match.scores?.teamA}</p>
      <p>Team B: {match.teams[1]?.name} - Score: {match.scores?.teamB}</p>
      {/* TODO: Implement cricket-specific score entry and display here */}
    </div>
  );
};

export default CricketScorecard;
