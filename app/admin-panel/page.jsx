'use client';

import Link from 'next/link';
import { FileText, PackagePlus, ShieldCheck, Video, Mail, Settings, Activity, HardDrive, Sparkles } from 'lucide-react';
import styles from './admin.module.css';
import { useGenz } from '../contexts/GenzContext';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    setCurrentDate(date);
  }, []);

  const featureCards = [
    {
      id: 'portfolio',
      title: isGenz ? 'The Showcase' : 'Portfolio Manager',
      desc: isGenz ? 'Upload videos & graphics straight to the cloud. Keep the feed drippy.' : 'Manage videos, graphics, and case studies. Upload directly to Cloudflare R2.',
      icon: Video,
      link: '/admin-panel/portfolio',
      btnText: isGenz ? 'Manage Portfolio' : 'Open Portfolio',
      color: '#ebd73f'
    },
    {
      id: 'quote',
      title: isGenz ? 'Pitch Cooker' : 'Quotes & Packages',
      desc: isGenz ? 'Build proposals and custom quotes with AI. Basically a cheat code for pitching.' : 'Build dynamic project proposals, detailed quotations, and customized premium packages.',
      icon: PackagePlus,
      link: '/admin-panel/quote',
      btnText: isGenz ? 'Drop Quote' : 'Create New Quote',
      color: '#3b82f6'
    },
    {
      id: 'invoice',
      title: isGenz ? 'Bag Securer' : 'Quick Invoice',
      desc: isGenz ? 'Generate a professional invoice in seconds. Drop the PDF and secure the bag.' : 'Generate a professional, branded invoice in seconds. Seamlessly export to PDF.',
      icon: FileText,
      link: '/admin-panel/invoice',
      btnText: isGenz ? 'Drop Invoice' : 'Create Invoice',
      color: '#10b981'
    },
    {
      id: 'package',
      title: isGenz ? 'Masterplan Maker' : 'PMP Maker',
      desc: isGenz ? 'Build masterplans and package generation. Big moves only.' : 'Generate comprehensive masterplans and package offerings for clients.',
      icon: Sparkles,
      link: '/admin-panel/package',
      btnText: isGenz ? 'Build PMP' : 'Open PMP Maker',
      color: '#a855f7'
    },
    {
      id: 'email',
      title: isGenz ? 'Mail Blaster' : 'Email Campaigns',
      desc: isGenz ? 'Blast out the newsletters. Let them know what\'s good.' : 'Administer marketing campaigns and send mass emails to your clients.',
      icon: Mail,
      link: '/admin-panel/email',
      btnText: isGenz ? 'Send Blast' : 'Open Campaigns',
      color: '#f43f5e'
    },
    {
      id: 'system',
      title: isGenz ? 'The Engine' : 'System Settings',
      desc: isGenz ? 'Configure the vibes. Toggle GenZ mode and check storage.' : 'Configure local storage, DB settings, security, and application modes.',
      icon: Settings,
      link: '/admin-panel/system',
      btnText: isGenz ? 'Pop Hood' : 'System Hub',
      color: '#8b5cf6'
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      {/* Hero Header */}
      <div className={styles.header} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '2rem' }}>
        <div>
          <h1 className={styles.title} style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{isGenz ? 'Main Character Energy' : 'Dashboard Overview'}</h1>
          <p className={styles.subtitle} style={{ fontSize: '1.15rem' }}>{isGenz ? `Welcome back, boss. Today is ${currentDate}.` : `Welcome to the Admin Hub. Today is ${currentDate}.`}</p>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(235, 215, 63, 0.1)', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ebd73f', boxShadow: '0 0 10px #ebd73f' }}></div>
          {isGenz ? 'Vibe Check: Passed' : 'Admin Level: Super'}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <ShieldCheck size={32} color="#22c55e" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Security</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Secured</p>
          </div>
        </div>

        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(235, 215, 63, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <HardDrive size={32} color="#ebd73f" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Storage</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Active</p>
          </div>
        </div>

        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <Activity size={32} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Orlo AI</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Online</p>
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)' }}></div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>
          {isGenz ? 'The Toolkit' : 'Core Tools'}
        </h2>
        <div style={{ height: '2px', flex: 1, background: 'linear-gradient(270deg, rgba(255,255,255,0.05), transparent)' }}></div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {featureCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.id} className={styles.interactiveCard} style={{ padding: '2.5rem' }}>
              <div style={{ background: `rgba(255,255,255,0.03)`, width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', border: `1px solid ${card.color}50`, boxShadow: `0 8px 20px ${card.color}15` }}>
                 <Icon size={28} color={card.color} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '700', fontFamily: 'Panchang, sans-serif', letterSpacing: '0.5px' }}>
                 {card.title}
              </h3>
              <p className={styles.subtitle} style={{ marginBottom: '2.5rem', flex: 1, lineHeight: '1.7', fontSize: '1.05rem', color: '#999' }}>
                {card.desc}
              </p>
              <Link href={card.link} className={styles.btnPrimary} style={{ 
                  textDecoration: 'none', 
                  width: '100%', 
                  textAlign: 'center', 
                  padding: '1.1rem', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  background: card.color === '#ebd73f' ? 'linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%)' : 'rgba(255,255,255,0.05)', 
                  color: card.color === '#ebd73f' ? '#000' : '#fff', 
                  border: card.color !== '#ebd73f' ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                  fontWeight: '600', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: card.color === '#ebd73f' ? '0 8px 25px rgba(235, 215, 63, 0.25)' : 'none'
                }} 
                 onMouseOver={(e) => { 
                   if(card.color !== '#ebd73f') {
                     e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                     e.currentTarget.style.borderColor = card.color;
                     e.currentTarget.style.color = card.color;
                     e.currentTarget.style.transform = 'translateY(-3px)';
                     e.currentTarget.style.boxShadow = `0 10px 25px ${card.color}25`;
                   } else {
                     e.currentTarget.style.transform = 'translateY(-3px)';
                     e.currentTarget.style.boxShadow = '0 12px 30px rgba(235, 215, 63, 0.4)';
                   }
                 }}
                 onMouseOut={(e) => { 
                   if(card.color !== '#ebd73f') {
                     e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                     e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                     e.currentTarget.style.color = '#fff';
                     e.currentTarget.style.transform = 'none';
                     e.currentTarget.style.boxShadow = 'none';
                   } else {
                     e.currentTarget.style.transform = 'none';
                     e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 215, 63, 0.25)';
                   }
                 }}
              >
                {card.btnText}
              </Link>
            </div>
          );
        })}
      </div>

    </div>
  );
}
