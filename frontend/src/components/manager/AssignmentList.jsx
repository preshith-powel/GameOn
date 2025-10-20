// frontend/src/components/manager/AssignmentList.jsx

import React from 'react';

// NOTE: Styles are imported/copied from the main dashboard file
const cardStyles = { backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' };
const buttonStyles = { padding: '10px 15px', backgroundColor: '#00ffaa', color: '#1a1a1a', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const assignmentCardStyles = { 
    backgroundColor: '#2c2c2c',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};
const readyMessageStyles = { 
    marginLeft: '20px', 
    color: '#39ff14', 
    fontWeight: 'bold', 
    fontSize: '0.8em',
    padding: '3px 8px',
    border: '1px solid #39ff14',
    borderRadius: '4px'
};


const AssignmentList = ({ assignments, setView, setActiveTeam }) => {
    
    const flattenedAssignments = assignments.flatMap(team => 
        team.tournaments.map(assignment => {
            const rosterCount = team.roster.length;
            const isReady = team.tournaments[0]?.tournamentId?.sport === 'multi-sport' ? team.isMultiSportReady : team.isReady; 

            return {
                teamName: team.name,
                teamId: team._id,
                rosterCount: rosterCount, 
                tournamentName: assignment.tournamentId?.name || 'Tournament Details Missing',
                tournamentId: assignment.tournamentId?._id, 
                tournamentStatus: (assignment.tournamentId?.status || 'N/A').toUpperCase(),
                fullTeamObject: team, 
                maxPlayersPerTeam: assignment.tournamentId?.sport === 'multi-sport' ? rosterCount : (assignment.tournamentId?.playersPerTeam || 0),
                isReady: isReady
            };
        })
    );

    return (
        <div style={cardStyles}>
            <h2 style={{ marginBottom: '20px' }}>Your Tournament Assignments ({flattenedAssignments.length})</h2>

            {flattenedAssignments.length === 0 ? (
                <p>You have no active team assignments yet.</p>
            ) : (
                flattenedAssignments.map(assignment => (
                    <div key={`${assignment.teamId}-${assignment.tournamentName}`} style={assignmentCardStyles}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div>
                                <strong>Tournament: {assignment.tournamentName}</strong> 
                                <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#a0a0a0' }}>
                                    (Team: {assignment.teamName})
                                </span>
                                <p style={{ fontSize: '0.8em', color: '#ff6b6b', margin: 0 }}>
                                    Status: {assignment.tournamentStatus}
                                </p>
                            </div>
                            
                            {/* TEAM READY MESSAGE */}
                            {assignment.isReady && (
                                <span style={readyMessageStyles}>
                                    TEAM READY FOR TOURNAMENT!
                                </span>
                            )}
                        </div>
                        
                        {/* MANAGE BUTTON */}
                        <button 
                            style={{...buttonStyles, width: 'auto'}}
                            onClick={() => {
                                setActiveTeam({ ...assignment.fullTeamObject, sport: assignment.tournamentId?.sport }); 
                                setView('roster-management'); 
                            }}
                        >
                            Manage Roster
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default AssignmentList;