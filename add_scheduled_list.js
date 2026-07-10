const fs = require('fs');
const path = './app/admin-panel/email/page.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add state
const stateReplacement = `  const [showClearAfterSend, setShowClearAfterSend] = useState(false);

  const [scheduledList, setScheduledList] = useState([
    { id: 1, title: 'Black Friday VIP Invite', subject: 'Your Exclusive Access', body: 'The VIP access starts now...', templateType: 'invitation', isBroadcast: true, specificEmail: '', scheduledAt: new Date(Date.now() + 86400000).toISOString() },
    { id: 2, title: 'New Creator Growth Guide', subject: '3 secrets to beat the algorithm', body: 'Here is how you grow...', templateType: 'newsletter', isBroadcast: true, specificEmail: '', scheduledAt: new Date(Date.now() + 172800000).toISOString() },
  ]);`;

content = content.replace(
  /  const \[showClearAfterSend, setShowClearAfterSend\] = useState\(false\);/,
  stateReplacement
);

// 2. Add to handleSend
const handleSendCode = `      setStatus({ type: 'success', msg: data.message });
      setShowClearAfterSend(true);
      
      if (isScheduled && scheduleTime) {
        setScheduledList(prev => [...prev, {
          id: Date.now(),
          title, subject, body, templateType, isBroadcast, specificEmail,
          scheduledAt: new Date(scheduleTime).toISOString()
        }]);
      }`;

content = content.replace(
  /      setStatus\(\{ type: 'success', msg: data.message \}\);\n      setShowClearAfterSend\(true\);/,
  handleSendCode
);

// 3. Add icons for the list
content = content.replace(
  /import \{ Mail, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles, LayoutTemplate, PenTool, RefreshCw, Clock \} from 'lucide-react';/,
  "import { Mail, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles, LayoutTemplate, PenTool, RefreshCw, Clock, Calendar, Edit2, Trash2 } from 'lucide-react';"
);

// 4. Add the section below AI Info
const scheduledSection = `
          {/* Scheduled Emails List */}
          <div className={styles.interactiveCard} style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#ebd73f" /> Scheduled Campaigns
            </h4>
            
            {scheduledList.length === 0 ? (
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>No campaigns currently scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheduledList.map(item => (
                  <div key={item.id} style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#ebd73f' }}>{new Date(item.scheduledAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          setTitle(item.title);
                          setSubject(item.subject);
                          setBody(item.body);
                          setTemplateType(item.templateType);
                          setIsBroadcast(item.isBroadcast);
                          setSpecificEmail(item.specificEmail || '');
                          setIsScheduled(true);
                          setScheduleTime(new Date(item.scheduledAt).toISOString().slice(0, 16));
                          setScheduledList(prev => prev.filter(i => i.id !== item.id));
                        }}
                        style={{ background: 'rgba(235, 215, 63, 0.1)', border: 'none', color: '#ebd73f', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Campaign"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setScheduledList(prev => prev.filter(i => i.id !== item.id))}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Cancel Campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
`;

content = content.replace(
  /          <\/div>\n        <\/div>\n      <\/div>\n    <\/div>\n  \);\n}/,
  `          </div>\n${scheduledSection}\n        </div>\n      </div>\n    </div>\n  );\n}`
);

fs.writeFileSync(path, content);
