import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';


const socket = io('http://localhost:3001');

function App() {
  const [networks, setNetworks] = useState([]);
  const [activeSsid, setActiveSsid] = useState(null); // Додано стан для активного Wi-Fi
  const [selectedSsid, setSelectedSsid] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    socket.on('wifi-list', (data) => setNetworks(data));
    
    // Listen for the active Wi-Fi name
    socket.on('active-wifi', (ssid) => {
      setActiveSsid(ssid);
    });

    socket.on('connect-success', (data) => {
      setStatus(`Connected to ${data.ssid}!`);
      setSelectedSsid(''); 
      setPassword('');
    });

    socket.on('error', (msg) => setStatus(msg));

    return () => {
      socket.off('wifi-list');
      socket.off('connect-success');
      socket.off('error');
    };
  }, []);

  const handleConnect = (e) => {
    e.preventDefault();
    setStatus('Connecting...');
    socket.emit('request-connect', { ssid: selectedSsid, password });
  };

  
  // 2 Дизайн всієї сторінки ---------------------------------------------------------------------------------
  const pageStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: 'white',
    fontFamily: 'sans-serif',
    margin: 0,
    boxSizing: 'border-box'
  };

  // Дизайн для віджету з інформацією про Wi-Fi та списком мереж
  const cardStyle = {
    background: '#2a2a2a',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  };

  // Дизайн для блоку з інформацією про активне Wi-Fi
  const activeBoxStyle = {
  marginBottom: '20px',
  padding: '15px',
  borderRadius: '8px',
  background: activeSsid ? '#064e3b' : '#374151',
  border: activeSsid ? '1px solid #10b981' : '1px solid #4b5563',
  textAlign: 'left'
  };

  // 2 -----------------------------------------------------------------------------------------------




  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginBottom: '20px' }}>WiFi Config</h1>
        
        {/* БЛОК АКТИВНОГО WI-FI */}
        <div style={activeBoxStyle}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>Current Connection:</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: activeSsid ? '#34d399' : '#fff' }}>
            {activeSsid ? activeSsid : "Disconnected"}
          </div>
        </div>

        <button 
          onClick={() => socket.emit('request-scan')} 
          style={{ 
            backgroundColor: '#646cff', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '5px', 
            cursor: 'pointer',
            marginBottom: '20px' 
          }}
        >
          Scan Networks
        </button>

        {status && (
          <p style={{ 
            color: status.includes('Connected') ? '#00ff00' : '#ff4444',
            fontSize: '14px',
            marginBottom: '15px' 
          }}>
            {status}
          </p>
        )}

        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
          {networks.map((net, i) => (
            <li 
              key={i} 
              onClick={() => setSelectedSsid(net.ssid)} 
              style={{ 
                cursor: 'pointer', 
                background: selectedSsid === net.ssid ? '#444' : '#333', 
                padding: '12px', 
                margin: '8px 0', 
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
            >
              <span>{net.ssid}</span>
              <span style={{ color: '#888', fontSize: '12px' }}>{net.signal}</span>
            </li>
          ))}
        </ul>

        {selectedSsid && (
          <form onSubmit={handleConnect} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #444', paddingTop: '20px' }}>
            <label>Password for <b>{selectedSsid}</b></label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter password"
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #555', background: '#111', color: 'white' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 2, backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                Connect
              </button>
              <button type="button" onClick={() => setSelectedSsid('')} style={{ flex: 1, backgroundColor: '#555', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;