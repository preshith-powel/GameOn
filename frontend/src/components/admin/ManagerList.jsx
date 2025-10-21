import React, { useEffect, useState } from 'react';
import axios from 'axios';

const statusStyles = {
  ready: { color: '#00ffaa', fontWeight: 'bold' },
  notReady: { color: '#ff6b6b', fontWeight: 'bold' },
};

const cardStyles = {
  background: '#232323',
  borderRadius: '10px',
  padding: '18px 24px',
  marginBottom: '18px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const ManagerList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/manager/allteams', {
          headers: { 'x-auth-token': token },
        });
        setTeams(res.data);
      } catch (err) {
        setError('Failed to fetch managers/teams.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  if (loading) return <div>Loading managers...</div>;
  if (error) return <div style={{ color: '#ff6b6b' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', marginTop: 30 }}>
      <h2 style={{ color: '#00ffaa', textAlign: 'center', marginBottom: 30 }}>All Managers & Team Status</h2>
      {teams.length === 0 ? (
        <div style={{ color: '#a0a0a0', textAlign: 'center' }}>No managers or teams found.</div>
      ) : (
        teams.map((team) => (
          <div key={team._id} style={cardStyles}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#00ffaa' }}>
                Manager: {team.managerId?.username || 'N/A'}
              </div>
              <div style={{ color: '#a0a0a0', fontSize: '1em' }}>
                Team Name: {team.name}
              </div>
            </div>
            <div>
              Status:{' '}
              <span style={team.isReady ? statusStyles.ready : statusStyles.notReady}>
                {team.isReady ? 'TEAM READY' : 'TEAM NOT READY'}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ManagerList;
