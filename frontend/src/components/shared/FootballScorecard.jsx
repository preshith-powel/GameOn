import React, { useState, useEffect } from 'react';
import { updateButtonStyles, scoreFieldStyles, rrScoreInputStyles } from './TournamentStyles';

const FootballScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  // Helper to get score for a team from the scores array
  const getScoreForTeam = (team) => {
    const teamId = team?._id || team;
    const entry = Array.isArray(match.scores)
      ? match.scores.find(s => String(s.teamId) === String(teamId) || String(s.teamId?._id) === String(teamId))
      : null;
    return entry ? entry.score : 0;
  };

  const [teamAscore, setTeamAscore] = useState(getScoreForTeam(match.teams[0]));
  const [teamBscore, setTeamBscore] = useState(getScoreForTeam(match.teams[1]));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTeamAscore(getScoreForTeam(match.teams[0]));
    setTeamBscore(getScoreForTeam(match.teams[1]));
    setIsEditing(false); // Reset editing state when match data changes
  }, [match]);

  const handleSaveScore = async () => {
    if (isTournamentCompleted || !hasAdminRights) return;

    let winnerId = null;
    if (teamAscore > teamBscore) {
        winnerId = match.teams[0]?._id || match.teams[0];
    } else if (teamBscore > teamAscore) {
        winnerId = match.teams[1]?._id || match.teams[1];
    }
    // If scores are tied, winnerId remains null, requiring manual tie-breaking in TournamentViewPage

    const scores = [
      { teamId: match.teams[0]?._id || match.teams[0], score: teamAscore },
      { teamId: match.teams[1]?._id || match.teams[1], score: teamBscore }
    ];
    const scoreData = {
      scores,
      status: 'completed',
      winnerId: winnerId,
    };
    await onScoreUpdate(match._id, scoreData);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  return (
    <div style={{ padding: '15px', border: '1px solid #333', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#222' }}>
      <h3 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Football Match</h3>
      
      {match.group && (
        <p style={{ color: '#00ffaa', marginBottom: '10px', textAlign: 'left', fontWeight: 'bold' }}>{match.group.toUpperCase()}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ color: '#00ffaa' }}>{match.teams[0]?.name || 'Team A'}</h4>
        
        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setTeamAscore(Math.max(0, teamAscore - 1))}
              style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginRight: 2 }}
            >
              -
            </button>
            <input 
              type="number" 
              value={teamAscore} 
              onChange={(e) => setTeamAscore(Number(e.target.value))}
              style={rrScoreInputStyles}
              min="0"
            />
            <button
              type="button"
              onClick={() => setTeamAscore(teamAscore + 1)}
              style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginLeft: 2 }}
            >
              +
            </button>
          </div>
        ) : (
          <p style={scoreFieldStyles}>{teamAscore}</p>
        )}

        <span style={{ color: '#e0e0e0', margin: '0 10px' }}>-</span>

        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setTeamBscore(Math.max(0, teamBscore - 1))}
              style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginRight: 2 }}
            >
              -
            </button>
            <input 
              type="number" 
              value={teamBscore} 
              onChange={(e) => setTeamBscore(Number(e.target.value))}
              style={rrScoreInputStyles}
              min="0"
            />
            <button
              type="button"
              onClick={() => setTeamBscore(teamBscore + 1)}
              style={{ background: '#39ff14', color: '#222', border: 'none', borderRadius: 4, width: 24, height: 24, fontWeight: 'bold', cursor: 'pointer', marginLeft: 2 }}
            >
              +
            </button>
          </div>
        ) : (
          <p style={scoreFieldStyles}>{teamBscore}</p>
        )}

        <h4 style={{ color: '#00ffaa' }}>{match.teams[1]?.name || 'Team B'}</h4>
      </div>
      
      {hasAdminRights && !isTournamentCompleted && (isEditing ? (
        <button onClick={handleSaveScore} style={updateButtonStyles}>Save Score</button>
      ) : (
        <button onClick={handleEditClick} style={{...updateButtonStyles, backgroundColor: '#333', color: '#00ffaa'}}>Edit Score</button>
      ))}

      {isTournamentCompleted && <p style={{ color: '#ff6b6b', textAlign: 'center', fontWeight: 'bold', marginTop: '15px' }}>Tournament Completed - Scoring Disabled</p>}

    </div>
  );
};

export default FootballScorecard;
