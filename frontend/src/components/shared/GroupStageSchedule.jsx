import React, { useState, useEffect } from 'react';
import { roundTabStyles } from './TournamentStyles';

const GroupStageSchedule = ({ matches, onScoreUpdate, isTournamentCompleted, hasAdminRights, MatchCardComponent }) => {
  const [groupedMatches, setGroupedMatches] = useState({});
  const [activeRound, setActiveRound] = useState(null);

  useEffect(() => {
    const groups = {};
    matches.forEach(match => {
      if (!groups[match.round]) {
        groups[match.round] = {};
      }
      if (!groups[match.round][match.group]) {
        groups[match.round][match.group] = [];
      }
      groups[match.round][match.group].push(match);
    });
    setGroupedMatches(groups);
    // Set initial active round
    if (Object.keys(groups).length > 0 && !activeRound) {
      setActiveRound(Object.keys(groups)[0]);
    }
  }, [matches, activeRound]);

  const handleRoundChange = (roundName) => {
    setActiveRound(roundName);
  };

  const calculatePointsTable = (groupMatches) => {
    const points = {};
    groupMatches.forEach(match => {
      const teamAId = match.teams[0]?._id.toString();
      const teamBId = match.teams[1]?._id.toString();

      if (!points[teamAId]) points[teamAId] = { name: match.teams[0]?.name, wins: 0, draws: 0, losses: 0, points: 0, played: 0 };
      if (!points[teamBId]) points[teamBId] = { name: match.teams[1]?.name, wins: 0, draws: 0, losses: 0, points: 0, played: 0 };

      if (match.status === 'completed' && match.scores) {
        points[teamAId].played++;
        points[teamBId].played++;
        if (match.scores.teamA > match.scores.teamB) {
          points[teamAId].wins++;
          points[teamAId].points += 3;
          points[teamBId].losses++;
        } else if (match.scores.teamB > match.scores.teamA) {
          points[teamBId].wins++;
          points[teamBId].points += 3;
          points[teamAId].losses++;
        } else {
          points[teamAId].draws++;
          points[teamAId].points += 1;
          points[teamBId].draws++;
          points[teamBId].points += 1;
        }
      }
    });
    return Object.values(points).sort((a, b) => b.points - a.points);
  };

  const currentRoundGroups = groupedMatches[activeRound] || {};

  return (
    <div>
      <h3>Group Stage Schedule</h3>
      {Object.keys(groupedMatches).length === 0 ? (
        <p>No matches scheduled for the group stage yet.</p>
      ) : (
        <div>
          {/* Round Tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
            {Object.keys(groupedMatches).sort().map(roundName => (
              <button 
                key={roundName} 
                style={roundTabStyles(activeRound === roundName)} 
                onClick={() => handleRoundChange(roundName)}
              >
                {roundName}
              </button>
            ))}
          </div>

          {activeRound && (
            <div>
              {Object.keys(currentRoundGroups).sort().map(groupName => (
                <div key={groupName} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#222' }}>
                  <h4 style={{ color: '#00ffaa', marginBottom: '15px' }}>{groupName}</h4>
                  
                  {/* Point Table for the Group */}
                  <h5 style={{ color: '#e0e0e0', marginBottom: '10px' }}>Points Table</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#333' }}>
                        <th style={{ padding: '8px', border: '1px solid #444', textAlign: 'left', color: '#00ffaa' }}>Team</th>
                        <th style={{ padding: '8px', border: '1px solid #444', color: '#00ffaa' }}>Played</th>
                        <th style={{ padding: '8px', border: '1px solid #444', color: '#00ffaa' }}>Wins</th>
                        <th style={{ padding: '8px', border: '1px solid #444', color: '#00ffaa' }}>Draws</th>
                        <th style={{ padding: '8px', border: '1px solid #444', color: '#00ffaa' }}>Losses</th>
                        <th style={{ padding: '8px', border: '1px solid #444', color: '#00ffaa' }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatePointsTable(currentRoundGroups[groupName]).map(team => (
                        <tr key={team.name} style={{ backgroundColor: '#2c2c2c' }}>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'left', color: '#e0e0e0' }}>{team.name}</td>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', color: '#e0e0e0' }}>{team.played}</td>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', color: '#e0e0e0' }}>{team.wins}</td>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', color: '#e0e0e0' }}>{team.draws}</td>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', color: '#e0e0e0' }}>{team.losses}</td>
                          <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center', fontWeight: 'bold', color: '#00ffaa' }}>{team.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Matches for the Group */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {currentRoundGroups[groupName].map(match => (
                      <MatchCardComponent 
                        key={match._id} 
                        match={match} 
                        onScoreUpdate={onScoreUpdate} 
                        isTournamentCompleted={isTournamentCompleted} 
                        hasAdminRights={hasAdminRights} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupStageSchedule;
