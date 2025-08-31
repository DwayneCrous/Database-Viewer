
import React, { useRef, useState } from 'react';
import './App.css';

function App() {
  const fileInput = useRef();
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [data, setData] = useState({});
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  // For create table
  const [showCreate, setShowCreate] = useState(false);
  const [newTable, setNewTable] = useState('');
  const [columns, setColumns] = useState([{ name: '', type: 'TEXT' }]);
  // For add row
  const [addRow, setAddRow] = useState(null);
  // Store column info for empty tables
  const [tableColumns, setTableColumns] = useState({});

  const COMMON_TYPES = ['TEXT', 'INTEGER', 'REAL', 'BLOB'];


  // Upload and load DB
  const handleUpload = async () => {
    if (!fileInput.current.files.length) {
      setError('Please select a database file.');
      return;
    }
    setError('');
    setLoading(true);
    const formData = new FormData();
    formData.append('db', fileInput.current.files[0]);
    try {
      const res = await fetch('/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to read database.');
      const json = await res.json();
      setTables(json.tables);
      setData(json.data);
      setSelected(json.tables[0] || '');
    } catch (e) {
      setError(e.message);
      setTables([]);
      setData({});
      setSelected('');
    }
    setLoading(false);
  };

  // Fetch tables/data after DB is uploaded
  const fetchTablesAndData = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/tables');
      if (!res.ok) throw new Error('Failed to refresh database.');
      const json = await res.json();
      setTables(json.tables);
      setData(json.data);
      
      // Fetch column info for empty tables
      const columnInfo = {};
      for (const table of json.tables) {
        if (!json.data[table] || json.data[table].length === 0) {
          try {
            const schemaRes = await fetch(`/api/table-schema/${table}`);
            if (schemaRes.ok) {
              const schemaData = await schemaRes.json();
              columnInfo[table] = schemaData.columns;
            }
          } catch (e) {
            console.warn(`Failed to fetch schema for ${table}:`, e);
          }
        }
      }
      setTableColumns(columnInfo);
      
      if (json.tables.length > 0) setSelected(s => json.tables.includes(s) ? s : json.tables[0]);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Create table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.trim() || columns.some(c => !c.name.trim())) {
      setError('Table name and all column names are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTable, columns })
      });
      if (!res.ok) throw new Error('Failed to create table.');
      setShowCreate(false);
      setNewTable('');
      setColumns([{ name: '', type: 'TEXT' }]);
      // Refresh tables
  await fetchTablesAndData();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Add row
  const handleAddRow = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/insert-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: selected, row: addRow })
      });
      if (!res.ok) throw new Error('Failed to add row.');
      // Refresh data
  await fetchTablesAndData();
      setAddRow(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Delete row
  const handleDeleteRow = async (pk, value) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/delete-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: selected, pk, value })
      });
      if (!res.ok) throw new Error('Failed to delete row.');
  await fetchTablesAndData();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Delete table
  const handleDeleteTable = async () => {
    if (!selected) return;
    if (!window.confirm(`Are you sure you want to delete table "${selected}"?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/delete-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName: selected })
      });
      if (!res.ok) throw new Error('Failed to delete table');
      
      // Refresh tables and data
      await fetchTablesAndData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download');
      if (!response.ok) throw new Error('Failed to download database');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modified_database.db';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    }
  };  return (
    <div className="dbv-root">
      <header className="dbv-header">
        <span className="dbv-logo">Dwayne's Database Viewer</span>
      </header>
      <main className="dbv-main">
        {tables.length === 0 && (
          <div className="dbv-upload-box">
            <input
              ref={fileInput}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              className="dbv-file"
              id="dbv-file-input"
              onChange={() => setError('')}
            />
            <label htmlFor="dbv-file-input" className="dbv-upload-label">
              Choose Database
            </label>
            <button className="dbv-btn" onClick={handleUpload} disabled={loading}>
              {loading ? 'Loading...' : 'Upload & View'}
            </button>
          </div>
        )}
        {error && <div className="dbv-error">{error}</div>}
        {tables.length > 0 && (
          <div className="dbv-table-section util-table-section">
            <div className="util-table-chooser">
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <label htmlFor="table-select" className="util-table-label">Table:</label>
                <select
                  id="table-select"
                  className="util-table-select"
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                >
                  {tables.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button className="util-btn" style={{marginLeft:8}} onClick={() => setShowCreate(true)} disabled={loading}>+ New Table</button>
                <button className="util-btn util-btn-danger" style={{marginLeft:8}} onClick={handleDeleteTable} disabled={loading || !selected}>Delete Table</button>
                <button className="util-btn util-btn-primary" style={{marginLeft:8}} onClick={handleDownload} disabled={loading}>Download DB</button>
              </div>
              {selected && (data[selected]?.length > 0 || tableColumns[selected]) && (
                <button className="util-btn util-btn-primary" style={{marginLeft: 'auto'}} onClick={()=>{
                  if (data[selected] && data[selected].length > 0) {
                    setAddRow(Object.fromEntries(Object.keys(data[selected][0]).map(k=>[k,''])));
                  } else if (tableColumns[selected]) {
                    setAddRow(Object.fromEntries(tableColumns[selected].map(k=>[k,''])));
                  }
                }} disabled={loading}>+ Add Entry</button>
              )}
            </div>
            {showCreate && (
              <form className="util-create-table" onSubmit={handleCreateTable}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                  <input className="util-input" placeholder="Table name" value={newTable} onChange={e=>setNewTable(e.target.value)} required />
                  <button className="util-btn" type="button" onClick={()=>setColumns([...columns,{name:'',type:'TEXT'}])}>+ Column</button>
                  <button className="util-btn util-btn-cancel" type="button" onClick={()=>setShowCreate(false)}>Cancel</button>
                </div>
                {columns.map((col,i)=>(
                  <div key={i} style={{display:'flex',gap:8,marginBottom:4}}>
                    <input className="util-input" placeholder="Column name" value={col.name} onChange={e=>{
                      const arr=[...columns]; arr[i].name=e.target.value; setColumns(arr);
                    }} required />
                    <select className="util-input" value={col.type} onChange={e=>{
                      const arr=[...columns]; arr[i].type=e.target.value; setColumns(arr);
                    }}>
                      {COMMON_TYPES.map(t=>(<option key={t} value={t}>{t}</option>))}
                    </select>
                    {columns.length>1 && <button className="util-btn util-btn-cancel" type="button" onClick={()=>{
                      setColumns(columns.filter((_,j)=>j!==i));
                    }}>Remove</button>}
                  </div>
                ))}
                <button className="util-btn util-btn-primary" type="submit" disabled={loading}>Create Table</button>
              </form>
            )}
            <div className="dbv-table-view util-table-view">
              {data[selected] && data[selected].length > 0 ? (
                <>
                  {addRow && (
                    <form className="util-add-row" onSubmit={handleAddRow} style={{marginBottom:12}}>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {Object.keys(addRow).map((k,i)=>(
                          <input key={i} className="util-input" placeholder={k} value={addRow[k]} onChange={e=>{
                            setAddRow({...addRow,[k]:e.target.value});
                          }} />
                        ))}
                      </div>
                      <button className="util-btn util-btn-primary" type="submit" disabled={loading}>Add</button>
                      <button className="util-btn util-btn-cancel" type="button" onClick={()=>setAddRow(null)}>Cancel</button>
                    </form>
                  )}
                  <div className="dbv-table-scroll">
                    <table className="util-table">
                      <thead>
                        <tr>
                          {Object.keys(data[selected][0]).map((k) => (
                            <th key={k}>{k}</th>
                          ))}
                          <th style={{width:60}}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {data[selected].map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((v, j) => (
                              <td key={j}>{String(v)}</td>
                            ))}
                            <td>
                              <button className="util-btn util-btn-danger" style={{fontSize:'0.95em',padding:'0.2em 0.7em'}} onClick={()=>{
                                // Try to use first column as PK
                                handleDeleteRow(Object.keys(row)[0], row[Object.keys(row)[0]]);
                              }} disabled={loading}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : selected && tableColumns[selected] ? (
                <>
                  {addRow && (
                    <form className="util-add-row" onSubmit={handleAddRow} style={{marginBottom:12}}>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {Object.keys(addRow).map((k,i)=>(
                          <input key={i} className="util-input" placeholder={k} value={addRow[k]} onChange={e=>{
                            setAddRow({...addRow,[k]:e.target.value});
                          }} />
                        ))}
                      </div>
                      <button className="util-btn util-btn-primary" type="submit" disabled={loading}>Add</button>
                      <button className="util-btn util-btn-cancel" type="button" onClick={()=>setAddRow(null)}>Cancel</button>
                    </form>
                  )}
                  <div className="dbv-no-data">No data in this table. Use the + Add Entry button to add the first row.</div>
                </>
              ) : (
                <div className="dbv-no-data">No data in this table.</div>
              )}
            </div>
          </div>
        )}
      </main>
      <footer className="dbv-footer">
        <span>Developed by Dwayne Rheeder 2025</span>
      </footer>
    </div>
  );
}

export default App;
