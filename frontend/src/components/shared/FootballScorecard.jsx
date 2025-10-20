import React, { useState, useEffect } from 'react';
import { updateButtonStyles, scoreFieldStyles, rrScoreInputStyles } from './TournamentStyles';

const FootballScorecard = ({ match, onScoreUpdate, isTournamentCompleted, hasAdminRights }) => {
  const [teamAscore, setTeamAscore] = useState(match.scores?.teamA || 0);
  const [teamBscore, setTeamBscore] = useState(match.scores?.teamB || 0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTeamAscore(match.scores?.teamA || 0);
    setTeamBscore(match.scores?.teamB || 0);
    setIsEditing(false); // Reset editing state when match data changes
  }, [match]);

  const handleSaveScore = async () => {
    if (isTournamentCompleted || !hasAdminRights) return;

    let winnerId = null;
    if (teamAscore > teamBscore) {
        winnerId = match.teams[0]?._id; 
    } else if (teamBscore > teamAscore) {
        winnerId = match.teams[1]?._id; 
    }
    // If scores are tied, winnerId remains null, requiring manual tie-breaking in TournamentViewPage

    const scoreData = {
      scoreA: teamAscore,
      scoreB: teamBscore,
      status: 'completed', // Football matches are typically completed once scores are entered
      winner: winnerId,
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
          <input 
            type="number" 
            value={teamAscore} 
            onChange={(e) => setTeamAscore(Number(e.target.value))}
            style={rrScoreInputStyles}
            min="0"
          />
        ) : (
          <p style={scoreFieldStyles}>{teamAscore}</p>
        )}

        <span style={{ color: '#e0e0e0', margin: '0 10px' }}>-</span>

        {isEditing ? (
          <input 
            type="number" 
            value={teamBscore} 
            onChange={(e) => setTeamBscore(Number(e.target.value))}
            style={rrScoreInputStyles}
            min="0"
          />
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
