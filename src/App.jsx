import React, { useState, useEffect, useRef } from 'react';
import { Mic, Plus, Check, Clock, AlertTriangle, Calendar, Trash2, Zap, BarChart3, Archive, RefreshCcw, Layout, ArrowRight, X, Play, FileText, Award, Hash, List, Cloud, Wifi, WifiOff, AlertCircle, Save, Edit2, Info, HelpCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc, query, orderBy, runTransaction } from 'firebase/firestore';

// --- APP VERSION & CHANGELOG ---
const APP_VERSION = "6.1";

const VERSION_HISTORY = [
    {
        version: "6.1",
        changes: [
            "Fix: Kritische Fehler (ReferenceError/RenderObject) behoben",
            "Update: Stabilere Grafik-Engine",
            "Update: Deutsche Datumsformate optimiert"
        ]
    },
    {
        version: "6.0",
        changes: [
            "GRAPHIK REVOLUTION: High-Fidelity Vektoren",
            "Neu: Kafka 2.0 & neue Belohnungseffekte",
            "Neu: 'Sleep'-Animation Physik korrigiert"
        ]
    }
];

// --- FIREBASE CONFIGURATION ---
let firebaseConfig;
try {
    if (typeof __firebase_config !== 'undefined') {
        firebaseConfig = JSON.parse(__firebase_config);
    }
} catch (e) { /* Local mode */ }

if (!firebaseConfig) {
    firebaseConfig = {
        apiKey: "AIzaSyBkYNXC78fzhzPw-EhXGY1F-l_cRjJLnik",
        authDomain: "anti-ass-app.firebaseapp.com",
        projectId: "anti-ass-app",
        storageBucket: "anti-ass-app.firebasestorage.app",
        messagingSenderId: "823733729828",
        appId: "1:823733729828:web:e6d9d9f92f85a4811ff6b1"
    };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'anti-ass-app';

// --- HELPER CONSTANTS ---
const LEVEL_TITLES = [
    "Büroklammer-Sortierer", "Kaffee-Logistiker", "Tacker-Nachfüller", "E-Mail-Beantwortet", "Notizblock-Wache", 
    "Stempel-Träger", "Ablage-Assistent", "Formular-Bändiger", "Telefon-Joker", "Pausenraum-Manager", 
    "Meeting-Überlebender", "Protokoll-Führer", "Deadline-Jäger", "Aufgaben-Terminator", "Task-Manager", 
    "Projekt-Junior", "Zeitplan-Optimierer", "Fokus-Phantom", "Effizienz-Agent", "Workflow-Ninja", 
    "ToDo-Listen-Meister", "Prioritäten-Setzer", "Chaos-Beseitiger", "Struktur-Schaffer", "Zeit-Detektiv", 
    "Anti-Prokrastinator", "Schweinehund-Zähmer", "Motivations-Trainer", "Disziplin-Wächter", "Routine-Ritter", 
    "Feldagent", "Spezial-Operative", "Taktischer Planer", "Strategie-Experte", "Mission-Control", 
    "Einsatzleiter", "Kommando-Einheit", "Elite-Agent", "Sektor-Wache", "Basis-Verteidiger", 
    "Daten-Analyst", "System-Operator", "Code-Knacker", "Bug-Jäger", "Feature-Bauer", 
    "Logik-Lord", "Algorithmus-Architekt", "Netzwerk-Navigator", "Server-Hüter", "Cyber-Sentinel", 
    "Zeit-Reisender", "Zukunfts-Planer", "Visions-Träger", "Orakel der Orga", "Schicksals-Schmied", 
    "Realitäts-Verwalter", "Dimensions-Wanderer", "Universum-Ordner", "Galaktischer Gärtner", "Sternen-Staubsauger", 
    "Meister der Zeit", "Hüter der Fristen", "Wächter des Fokus", "Lord der Listen", "König der Kacheln", 
    "Imperator des Inputs", "Zar der Ziele", "Pharao der Planung", "Sultan der Struktur", "Baron der Balance", 
    "Herzog der Haken", "Graf der Genauigkeit", "Prinz der Produktivität", "Erzmagier der Effizienz", "Großmeister der Geduld", 
    "Legende der Leistung", "Mythos der Macher", "Titan der Tatkraft", "Koloss der Kontrolle", "Gigant der Gewohnheit", 
    "Zen-Meister", "Erleuchteter der Erledigung", "Nirvana-Navigator", "Karma-Kollektor", "Geist der Getan-Liste", 
    "Phantom der Pflicht", "Schatten der Schaffenskraft", "Licht der Leistung", "Flamme des Fleißes", "Funke der Funktion", 
    "Singularität", "Alpha & Omega", "Der Unaufhaltsame", "Der Vollender", "Der Bezwinger", 
    "Task-Gott", "Produktivitäts-Primus", "Anti-ASS Legende", "System-Overlord", "Gottkönig der Produktivität"
];

// --- HELPER FUNCTIONS ---
const calculateLevel = (totalXP) => {
    let level = 1; 
    let xpNeeded = 350; 
    while (totalXP >= xpNeeded) { 
        totalXP -= xpNeeded; 
        level++; 
        xpNeeded = level * 350; 
    }
    return { level, currentXP: totalXP, xpNeeded };
};

const getLevelTitle = (level) => {
    if (level <= 0) return "Praktikant";
    if (level > 100) return "Transcendent Being";
    return LEVEL_TITLES[level - 1] || `Operator Level ${level}`;
};

const getTargetDate = (deadlineStr) => {
    if (!deadlineStr || deadlineStr === 'Langfristig') return null;
    const germanDateTimeMatch = deadlineStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (germanDateTimeMatch) {
        const d = new Date(germanDateTimeMatch[3], germanDateTimeMatch[2] - 1, germanDateTimeMatch[1]);
        if (germanDateTimeMatch[4] && germanDateTimeMatch[5]) {
            d.setHours(germanDateTimeMatch[4], germanDateTimeMatch[5]);
        } else {
            d.setHours(23, 59, 0, 0); 
        }
        return d;
    }
    if (deadlineStr.includes('-')) return new Date(deadlineStr);
    if (deadlineStr.match(/^\d{1,2}:\d{2}$/)) {
        const [hours, minutes] = deadlineStr.split(':').map(Number);
        const date = new Date(); date.setHours(hours, minutes, 0, 0); return date;
    } 
    if (deadlineStr === 'Heute') { const date = new Date(); date.setHours(23, 59, 59, 999); return date; }
    const date = new Date(deadlineStr); if (!isNaN(date.getTime())) return date;
    return null;
};

const isWithinDays = (dateStr, days) => {
    const target = getTargetDate(dateStr); if (!target) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffTime = target - today; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days; 
};

const isToday = (dateStr) => {
    const target = getTargetDate(dateStr); if (!target) return false;
    const today = new Date(); return target.toDateString() === today.toDateString();
};

const formatDeadlineDisplay = (deadlineStr) => {
    if (!deadlineStr || deadlineStr === 'Langfristig') return deadlineStr;
    const target = getTargetDate(deadlineStr);
    if (!target) return deadlineStr;

    const now = new Date();
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (target.toDateString() === today.toDateString()) {
        return target.getHours() === 23 && target.getMinutes() === 59 ? 'Heute' : timeStr;
    }
    if (target.toDateString() === tomorrow.toDateString()) {
        return `Morgen ${timeStr}`.trim();
    }

    const dayName = target.toLocaleDateString('de-DE', { weekday: 'short' });
    const dateStr = target.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    return `${dayName} ${dateStr} ${timeStr}`.trim();
};

const getTaskProgress = (task) => {
    if (!task.createdAt || task.deadline === 'Langfristig') return 0;
    const target = getTargetDate(task.deadline); if (!target) return 0;
    const now = new Date().getTime(); const start = task.createdAt; const end = target.getTime();
    if (now >= end) return 100; if (now <= start) return 0;
    const totalDuration = end - start; const elapsed = now - start; if (totalDuration <= 0) return 100;
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
};

const getAgingStatus = (createdAt) => {
    if (!createdAt) return { color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500/10', label: 'Frisch', glow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]' };
    const now = Date.now();
    const ageInHours = (now - createdAt) / (1000 * 60 * 60);
    const ageInDays = ageInHours / 24;

    if (ageInDays > 3) return { color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-900/20', label: 'SINGULARITÄT', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' };
    if (ageInDays > 2) return { color: 'text-red-500', border: 'border-red-500', bg: 'bg-red-900/20', label: 'Kritisch', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' };
    if (ageInDays > 1) return { color: 'text-yellow-500', border: 'border-yellow-500', bg: 'bg-yellow-900/20', label: 'Alt', glow: 'shadow-none' };
    return { color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500/10', label: 'Frisch', glow: 'shadow-none' };
};

const calculateTaskXP = (task) => {
    const now = new Date();
    const target = getTargetDate(task.deadline);
    if (target && now > target) {
        return 0;
    }
    const BASE_XP = 100; const MAX_XP = 500;
    if (task.type === 'simple') return 50;
    if (task.deadline === 'Langfristig') return 100;
    
    if (!target) return BASE_XP;
    const created = task.createdAt || Date.now();
    const durationMs = target.getTime() - created;
    const durationDays = Math.max(1, Math.floor(durationMs / (1000 * 60 * 60 * 24)));
    const bonusXP = Math.floor(durationDays * 0.5); 
    return Math.min(BASE_XP + bonusXP, MAX_XP);
};

const parseNaturalLanguage = (input) => {
    let text = input; let targetDate = new Date(Date.now()); let foundDate = false;
    let foundTime = false;
    let hours = 23, minutes = 59;
    
    const timeColonRegex = /(\d{1,2}):(\d{2})/;
    const timeUhrRegex = /(\d{1,2})\s*uhr/i;

    const colonMatch = text.match(timeColonRegex);
    const uhrMatch = text.match(timeUhrRegex);

    if (colonMatch) {
        hours = parseInt(colonMatch[1]);
        minutes = parseInt(colonMatch[2]);
        foundTime = true;
    } else if (uhrMatch) {
        hours = parseInt(uhrMatch[1]);
        minutes = 0;
        foundTime = true;
    }

    const lowerInput = text.toLowerCase();
    
    if (lowerInput.includes('übermorgen')) {
        targetDate.setDate(targetDate.getDate() + 2); 
        foundDate = true;
    } else if (lowerInput.includes('morgen')) {
        targetDate.setDate(targetDate.getDate() + 1); 
        foundDate = true;
    } else if (lowerInput.includes('heute')) {
        foundDate = true;
    } else {
        const weekDayMap = [
            { id: 0, names: ['sonntag', 'so'] }, { id: 1, names: ['montag', 'mo'] }, { id: 2, names: ['dienstag', 'di'] },
            { id: 3, names: ['mittwoch', 'mi'] }, { id: 4, names: ['donnerstag', 'do'] }, { id: 5, names: ['freitag', 'fr'] },
            { id: 6, names: ['samstag', 'sa'] }
        ];

        for (const { id, names } of weekDayMap) {
            const regex = new RegExp(`\\b(${names.join('|')})\\.?\\b`, 'i');
            if (regex.test(lowerInput)) {
                const currentDay = targetDate.getDay();
                let daysUntil = (id - currentDay + 7) % 7;
                if (daysUntil === 0) daysUntil = 7; 
                targetDate.setDate(targetDate.getDate() + daysUntil);
                foundDate = true;
                if (!foundTime) { hours = 12; minutes = 0; foundTime = true; } 
                break;
            }
        }
    }

    if (!foundTime) {
        if (lowerInput.includes('abend')) {
            const now = new Date();
            const isToday = targetDate.toDateString() === now.toDateString();
            
            if (isToday && now.getHours() >= 20) {
                 hours = now.getHours() + 1;
                 minutes = 0;
                 if (hours >= 24) {
                     targetDate.setDate(targetDate.getDate() + 1);
                     hours = 0;
                 }
            } else {
                hours = 20; minutes = 0;
            }
            foundTime = true;
        } else if (lowerInput.includes('nacht')) {
            hours = 23; minutes = 59; foundTime = true;
        } else if (lowerInput.includes('früh') || lowerInput.includes('morgens')) {
            hours = 8; minutes = 0; foundTime = true;
        }
    }

    targetDate.setHours(hours, minutes, 0, 0);
    let displayString = '';
    const today = new Date(); const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const isDateToday = targetDate.toDateString() === today.toDateString();
    const isDateTomorrow = targetDate.toDateString() === tomorrow.toDateString();
    
    const showTimeStr = foundTime || isDateToday ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : '';

    if (isDateToday) { displayString = showTimeStr || 'Heute'; }
    else if (isDateTomorrow) { displayString = `Morgen ${showTimeStr}`.trim(); }
    else {
        const dayName = targetDate.toLocaleDateString('de-DE', { weekday: 'short' });
        const dateStr = targetDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        displayString = `${dayName} ${dateStr} ${showTimeStr}`.trim();
    }
    
    return { text: text.replace(/\s+/g, ' ').trim(), date: targetDate, display: displayString };
};

// --- ANIMATION COMPONENTS ---
const AnimationStyles = () => (
    <style>{`
        @keyframes fall-3d {
            0% { transform: translateY(-20vh) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(var(--scale)); opacity: 1; }
            100% { transform: translateY(120vh) rotateX(var(--rotX)) rotateY(var(--rotY)) rotateZ(var(--rotZ)) scale(var(--scale)); opacity: 0; }
        }
        @keyframes super-burst {
            0% { transform: translate(0, 0) scale(0); opacity: 1; filter: brightness(2); }
            10% { transform: translate(var(--tx-mid), var(--ty-mid)) scale(1.5); opacity: 1; }
            100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; filter: brightness(0.5); }
        }
        @keyframes warp-speed {
            0% { transform: translate3d(0,0,0) scale(0); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translate3d(var(--tx), var(--ty), 500px) scale(3); opacity: 0; }
        }
        @keyframes shake-screen {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-2px, -2px) rotate(-1deg); }
            20%, 40%, 60%, 80% { transform: translate(2px, 2px) rotate(1deg); }
        }
        @keyframes spiral-in {
            0% { transform: rotate(0deg) translateX(50vw) scale(1); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: rotate(1080deg) translateX(0) scale(0); opacity: 0; }
        }
        @keyframes glitch-flash {
            0% { opacity: 1; transform: translate(0); clip-path: inset(0 0 0 0); }
            20% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 2px); }
            40% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -2px); }
            60% { clip-path: inset(40% 0 40% 0); transform: translate(-2px, 2px); }
            100% { opacity: 0.8; transform: translate(0); clip-path: inset(0 0 0 0); }
        }
        @keyframes float-gentle {
            0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
            20% { opacity: 1; transform: translateY(-20px) translateX(5px) scale(1); }
            100% { transform: translateY(-100px) translateX(-5px) scale(1.2); opacity: 0; }
        }
    `}</style>
);

const AnimationBackground = ({ type }) => {
    const [particles, setParticles] = useState([]);
    const [shake, setShake] = useState(false);

    useEffect(() => {
        if (['supernova', 'godmode', 'gold-storm'].includes(type)) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }

        const newParticles = [];
        const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#06b6d4', '#ffffff', '#f59e0b'];
        
        if (type === 'confetti' || type === 'super-confetti') {
            const count = type === 'super-confetti' ? 400 : 150;
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    left: Math.random() * 100,
                    width: Math.random() * 12 + 4 + 'px',
                    height: Math.random() * 8 + 4 + 'px',
                    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                    style: {
                        '--rotX': (Math.random() * 720) + 'deg',
                        '--rotY': (Math.random() * 720) + 'deg',
                        '--rotZ': (Math.random() * 720) + 'deg',
                        '--scale': 0.5 + Math.random(),
                        animation: `fall-3d ${2 + Math.random() * 3}s linear forwards infinite`,
                        animationDelay: Math.random() * 3 + 's',
                        perspective: '500px'
                    }
                });
            }
        } else if (type === 'zzz') {
            for (let i = 0; i < 20; i++) {
                newParticles.push({
                    id: i,
                    left: 30 + Math.random() * 40,
                    top: 40 + Math.random() * 20,
                    content: 'zZz',
                    color: '#ffffff',
                    style: {
                        animation: `float-gentle ${3 + Math.random() * 2}s ease-out infinite`,
                        animationDelay: Math.random() * 4 + 's',
                        fontSize: Math.random() * 30 + 20 + 'px',
                        fontWeight: 'bold',
                        opacity: 0,
                        textShadow: '0 0 5px rgba(255,255,255,0.5)'
                    }
                });
            }
        } else if (type === 'fireworks' || type === 'supernova') {
            const bursts = type === 'supernova' ? 120 : 60;
            const particlesPerBurst = type === 'supernova' ? 20 : 12;
            for (let i = 0; i < bursts; i++) {
                const centerX = 10 + Math.random() * 80;
                const centerY = 10 + Math.random() * 80;
                const color = colors[Math.floor(Math.random() * colors.length)];
                for (let j = 0; j < particlesPerBurst; j++) {
                    const angle = (j / particlesPerBurst) * Math.PI * 2;
                    const distance = 150 + Math.random() * 200;
                    newParticles.push({
                        id: `${i}-${j}`,
                        left: centerX,
                        top: centerY,
                        width: type === 'supernova' ? '6px' : '4px',
                        height: type === 'supernova' ? '6px' : '4px',
                        backgroundColor: color,
                        style: {
                            '--tx-mid': Math.cos(angle) * (distance * 0.4) + 'px',
                            '--ty-mid': Math.sin(angle) * (distance * 0.4) + 'px',
                            '--tx': Math.cos(angle) * distance + 'px',
                            '--ty': Math.sin(angle) * distance + 'px',
                            animation: `super-burst ${0.5 + Math.random() * 1}s ease-out forwards infinite`,
                            animationDelay: Math.random() * 3 + 's',
                            borderRadius: '50%',
                            boxShadow: `0 0 15px ${color}`
                        }
                    });
                }
            }
        } else if (type === 'star' || type === 'space' || type === 'warp') {
            const count = type === 'warp' ? 300 : 100;
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    left: 50,
                    top: 50,
                    width: Math.random() * 3 + 1 + 'px',
                    height: Math.random() * 30 + 10 + 'px', 
                    backgroundColor: '#fff',
                    style: {
                        '--tx': (Math.random() * 200 - 100) + 'vw',
                        '--ty': (Math.random() * 200 - 100) + 'vh',
                        animation: `warp-speed ${0.5 + Math.random()}s linear infinite`,
                        animationDelay: Math.random() + 's',
                        borderRadius: '2px',
                        boxShadow: '0 0 8px rgba(255,255,255,0.8)'
                    }
                });
            }
        } else if (type === 'gold-storm' || type === 'money') {
             const count = type === 'gold-storm' ? 150 : 40;
             for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    left: Math.random() * 100,
                    content: Math.random() > 0.5 ? '💰' : '💎',
                    style: {
                        '--rotX': (Math.random() * 360) + 'deg',
                        '--rotY': (Math.random() * 360) + 'deg',
                        '--rotZ': (Math.random() * 360) + 'deg',
                        '--scale': 0.8 + Math.random(),
                        animation: `fall-3d ${1.5 + Math.random()}s linear infinite`,
                        animationDelay: Math.random() * 2 + 's',
                        fontSize: Math.random() * 20 + 20 + 'px',
                        filter: 'drop-shadow(0 0 5px rgba(234, 179, 8, 0.5))'
                    }
                });
            }
        } else if (type === 'glitch') {
            const chars = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";
            for (let i = 0; i < 100; i++) {
                newParticles.push({
                    id: i,
                    left: Math.random() * 100,
                    content: chars[Math.floor(Math.random() * chars.length)],
                    color: '#22c55e',
                    style: {
                        animation: `glitch-flash ${0.2 + Math.random() * 0.5}s steps(5) infinite`,
                        top: Math.random() * 100 + '%',
                        fontSize: Math.random() * 15 + 10 + 'px',
                        fontFamily: 'monospace',
                        textShadow: '2px 0 #ef4444, -2px 0 #3b82f6',
                        opacity: 0.8
                    }
                });
            }
        } else {
             for (let i = 0; i < 50; i++) {
                newParticles.push({
                    id: i,
                    left: Math.random() * 100,
                    content: type === 'heart' ? '♥' : '★',
                    color: type === 'heart' ? '#ef4444' : '#eab308',
                    style: {
                        '--drift': (Math.random() * 100 - 50) + 'px',
                        '--rotation': (Math.random() * 90 - 45) + 'deg',
                        animation: `float-gentle ${1.5 + Math.random() * 2}s ease-out infinite`,
                        animationDelay: Math.random() * 2 + 's',
                        fontSize: Math.random() * 25 + 15 + 'px',
                        filter: `drop-shadow(0 0 5px ${type === 'heart' ? '#ef4444' : '#eab308'})`,
                        top: '100%' 
                    }
                });
            }
        }

        setParticles(newParticles);
    }, [type]);

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden z-[50] ${shake ? 'animate-[shake-screen_0.5s_ease-in-out]' : ''}`}>
            <AnimationStyles />
            {['supernova', 'warp', 'portal', 'blackhole'].includes(type) && (
                <div className="absolute inset-0 bg-black/40 transition-opacity duration-1000"></div>
            )}
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="absolute"
                    style={{
                        left: p.left + '%',
                        top: p.top ? (typeof p.top === 'string' ? p.top : p.top + '%') : undefined,
                        width: p.width,
                        height: p.height,
                        backgroundColor: p.backgroundColor,
                        borderColor: p.borderColor,
                        color: p.color,
                        ...p.style
                    }}
                >
                    {p.content}
                </div>
            ))}
        </div>
    );
};

// --- VECTOR ASSETS & COMPONENTS ---
// VectorBone Component
const VectorBone = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl animate-[spin_3s_linear_infinite]">
        <defs>
            <linearGradient id="boneGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFF8E1" />
                <stop offset="100%" stopColor="#FFECB3" />
            </linearGradient>
        </defs>
        <path d="M20,35 Q10,25 20,15 Q30,5 40,25 L60,25 Q70,5 80,15 Q90,25 80,35 L80,65 Q90,75 80,85 Q70,95 60,75 L40,75 Q30,95 20,85 Q10,75 20,65 Z" fill="url(#boneGrad)" stroke="#d97706" strokeWidth="2" />
        <path d="M25,25 Q30,20 35,30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
);

// VectorBall Component
const VectorBall = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl animate-bounce">
        <defs>
            <radialGradient id="ballGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#a3e635" />
                <stop offset="100%" stopColor="#3f6212" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#ballGrad)" />
        <path d="M15,50 Q50,20 85,50" stroke="white" strokeWidth="4" fill="none" opacity="0.4" />
        <path d="M15,50 Q50,80 85,50" stroke="white" strokeWidth="4" fill="none" opacity="0.4" />
        <ellipse cx="35" cy="35" rx="10" ry="5" fill="white" opacity="0.6" transform="rotate(-45 35 35)" />
    </svg>
);

// VectorKafka Component
const VectorKafka = ({ pose = 'sit' }) => {
    let content;
    switch(pose) {
        case 'happy': 
            content = (
                <g>
                    <path d="M75,70 Q85,60 90,50" stroke="url(#furGrad)" strokeWidth="6" strokeLinecap="round">
                        <animate attributeName="d" values="M75,70 Q85,60 90,50;M75,70 Q85,80 90,90;M75,70 Q85,60 90,50" dur="0.3s" repeatCount="indefinite" />
                    </path>
                    <path d="M25,85 Q20,100 45,100 L65,100 Q85,100 75,85 L70,60 Q55,50 35,60 Z" fill="url(#furGrad)" />
                    <path d="M40,70 Q55,85 70,70 Q55,60 40,70" fill="url(#bellyGrad)" />
                    <g transform="translate(0, -5)">
                        <path d="M25,45 Q20,15 55,15 Q90,15 85,45 Q85,75 55,75 Q25,75 25,45" fill="url(#furGrad)" />
                        <path d="M25,30 Q10,40 15,60 Q25,50 28,35" fill="url(#furGrad)" />
                        <path d="M85,30 Q100,40 95,60 Q85,50 82,35" fill="url(#furGrad)" />
                        <ellipse cx="40" cy="40" rx="5" ry="6" fill="white" />
                        <circle cx="40" cy="40" r="3" fill="black" />
                        <circle cx="38" cy="38" r="1.5" fill="white" opacity="0.8" />
                        <ellipse cx="70" cy="40" rx="5" ry="6" fill="white" />
                        <circle cx="70" cy="40" r="3" fill="black" />
                        <circle cx="68" cy="38" r="1.5" fill="white" opacity="0.8" />
                        <ellipse cx="55" cy="55" rx="12" ry="10" fill="url(#bellyGrad)" />
                        <path d="M50,52 Q55,50 60,52 L58,58 Q55,60 52,58 Z" fill="#1a1a1a" />
                        <path d="M55,60 Q55,68 55,68" stroke="black" strokeWidth="2" strokeLinecap="round" />
                        <path d="M48,62 Q55,75 62,62" fill="#FF5252" /> 
                    </g>
                </g>
            );
            break;
        case 'run':
            content = (
                <g transform="translate(0, 10)">
                    <path d="M20,60 Q50,50 80,60 L75,75 Q50,85 25,75 Z" fill="url(#furGrad)" />
                    <path d="M30,75 Q40,80 35,65" fill="url(#bellyGrad)" />
                    <path d="M25,70 Q15,75 10,65 L5,75" stroke="url(#furGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <path d="M70,75 Q80,70 90,60" stroke="url(#furGrad)" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <path d="M65,75 Q75,80 85,75" stroke="#3E2723" strokeWidth="8" strokeLinecap="round" fill="none" />
                    <g transform="translate(70, 45) rotate(10)">
                        <ellipse cx="0" cy="0" rx="20" ry="18" fill="url(#furGrad)" />
                        <path d="M-5,-10 Q-20,-15 -25,0" fill="url(#furGrad)" />
                        <ellipse cx="5" cy="-5" rx="3" ry="3" fill="white" />
                        <circle cx="6" cy="-5" r="1.5" fill="black" />
                        <path d="M10,5 L15,3" stroke="black" strokeWidth="2" strokeLinecap="round" />
                        <path d="M5,10 Q10,12 15,10" fill="none" stroke="black" strokeWidth="1.5" />
                    </g>
                    <path d="M20,60 Q10,55 5,50" stroke="url(#furGrad)" strokeWidth="5" strokeLinecap="round" fill="none" />
                </g>
            );
            break;
        case 'sleep':
            content = (
                <g transform="translate(0, 15)">
                    <path d="M10,80 Q45,60 85,80 Q90,95 50,100 Q10,95 10,80 Z" fill="url(#furGrad)" />
                    <path d="M15,80 Q10,90 25,92" stroke="#3E2723" strokeWidth="2" fill="none" opacity="0.7" />
                    <path d="M60,95 L80,95 Q85,95 85,98 Q80,102 60,102" fill="url(#furGrad)" />
                    <path d="M50,97 L70,97 Q75,97 75,100 Q70,104 50,104" fill="url(#furGrad)" />
                    <path d="M55,90 Q62,95 68,90" fill="url(#bellyGrad)" />
                    <g transform="translate(62, 82) rotate(8)">
                        <path d="M-15,-10 Q-15,-25 15,-25 Q35,-25 35,-5 Q35,10 15,10 Q-15,10 -15,-10" fill="url(#furGrad)" />
                        <path d="M-5,-20 Q-20,-10 -10,10 L5,-5" fill="url(#furGrad)" />
                        <path d="M5,-15 Q0,-5 5,5" stroke="#3E2723" strokeWidth="2" fill="none" />
                        <path d="M10,-5 Q15,-1 20,-5" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="35" cy="-2" r="3" fill="#1a1a1a" />
                    </g>
                </g>
            );
            break;
        case 'cool':
            content = (
                <g>
                    <path d="M25,85 Q20,100 45,100 L65,100 Q85,100 75,85 L70,60 Q55,50 35,60 Z" fill="url(#furGrad)" />
                    <path d="M40,70 Q55,85 70,70 Q55,60 40,70" fill="url(#bellyGrad)" />
                    <g transform="translate(0, -5)">
                        <path d="M25,45 Q20,15 55,15 Q90,15 85,45 Q85,75 55,75 Q25,75 25,45" fill="url(#furGrad)" />
                        <path d="M25,30 Q10,40 15,60 Q25,50 28,35" fill="url(#furGrad)" />
                        <path d="M85,30 Q100,40 95,60 Q85,50 82,35" fill="url(#furGrad)" />
                        <ellipse cx="55" cy="55" rx="12" ry="10" fill="url(#bellyGrad)" />
                        <path d="M50,52 Q55,50 60,52 L58,58 Q55,60 52,58 Z" fill="#1a1a1a" />
                        <path d="M45,60 Q55,65 65,60" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <path d="M25,38 L85,38 L80,50 L65,50 Q60,45 55,50 L45,50 Q40,45 35,50 L20,50 L25,38 Z" fill="url(#glassesGrad)" stroke="black" strokeWidth="1" />
                        <path d="M28,40 L45,40" stroke="white" strokeWidth="1.5" opacity="0.4" />
                    </g>
                </g>
            );
            break;
        case 'hero':
            content = (
                <g>
                    <path d="M35,60 L20,95 L90,95 L75,60" fill="url(#capeGrad)">
                        <animate attributeName="d" values="M35,60 L20,95 L90,95 L75,60;M35,60 L15,90 L95,100 L75,60;M35,60 L20,95 L90,95 L75,60" dur="2s" repeatCount="indefinite" />
                    </path>
                    <path d="M30,90 Q20,100 40,100 L60,100 Q80,100 70,90 L65,60 Q50,55 35,60 Z" fill="url(#furGrad)" />
                    <path d="M42,70 Q50,85 58,70 Q50,65 42,70" fill="url(#bellyGrad)" />
                    <g transform="translate(0, -5)">
                        <path d="M25,45 Q20,15 55,15 Q90,15 85,45 Q85,75 55,75 Q25,75 25,45" fill="url(#furGrad)" />
                        <path d="M25,30 Q10,40 15,60 Q25,50 28,35" fill="url(#furGrad)" />
                        <path d="M85,30 Q100,40 95,60 Q85,50 82,35" fill="url(#furGrad)" />
                        <ellipse cx="40" cy="40" rx="5" ry="6" fill="white" /> <circle cx="40" cy="40" r="2.5" fill="black" />
                        <ellipse cx="70" cy="40" rx="5" ry="6" fill="white" /> <circle cx="70" cy="40" r="2.5" fill="black" />
                        <ellipse cx="55" cy="55" rx="12" ry="10" fill="url(#bellyGrad)" />
                        <path d="M50,52 Q55,50 60,52 L58,58 Q55,60 52,58 Z" fill="#1a1a1a" />
                        <path d="M45,62 Q55,65 65,62" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    </g>
                </g>
            );
            break;
        case 'love':
            content = (
                <g>
                    <path d="M30,90 Q20,100 40,100 L60,100 Q80,100 70,90 L65,60 Q50,55 35,60 Z" fill="url(#furGrad)" />
                    <path d="M42,70 Q50,85 58,70 Q50,65 42,70" fill="url(#bellyGrad)" />
                    <g transform="translate(0, -5)">
                        <path d="M25,45 Q20,15 55,15 Q90,15 85,45 Q85,75 55,75 Q25,75 25,45" fill="url(#furGrad)" />
                        <path d="M25,30 Q10,40 15,60 Q25,50 28,35" fill="url(#furGrad)" />
                        <path d="M75,30 Q90,40 85,60 Q75,50 72,35" fill="url(#furGrad)" />
                        <path d="M45,50 Q50,48 55,50 L53,56 Q50,58 47,56 Z" fill="black" />
                        <path d="M40,60 Q50,65 60,60" stroke="black" strokeWidth="2" fill="none" />
                        <path d="M32,35 Q35,30 38,35 Q41,30 44,35 L38,42 Z" fill="#ef4444" />
                        <path d="M56,35 Q59,30 62,35 Q65,30 68,35 L62,42 Z" fill="#ef4444" />
                    </g>
                </g>
            );
            break;
        default:
             content = (
                <g>
                    <path d="M30,90 Q20,100 40,100 L60,100 Q80,100 70,90 L65,60 Q50,55 35,60 Z" fill="url(#furGrad)" />
                    <path d="M42,70 Q50,85 58,70 Q50,65 42,70" fill="url(#bellyGrad)" />
                    <g transform="translate(0, -5)">
                        <path d="M25,45 Q20,15 55,15 Q90,15 85,45 Q85,75 55,75 Q25,75 25,45" fill="url(#furGrad)" />
                        <path d="M25,30 Q10,40 15,60 Q25,50 28,35" fill="url(#furGrad)" />
                        <path d="M85,30 Q100,40 95,60 Q85,50 82,35" fill="url(#furGrad)" />
                        <ellipse cx="40" cy="40" rx="5" ry="6" fill="white" /> <circle cx="40" cy="40" r="3" fill="black" /> <circle cx="38" cy="38" r="1" fill="white" opacity="0.8" />
                        <ellipse cx="70" cy="40" rx="5" ry="6" fill="white" /> <circle cx="70" cy="40" r="3" fill="black" /> <circle cx="68" cy="38" r="1" fill="white" opacity="0.8" />
                        <ellipse cx="55" cy="55" rx="12" ry="10" fill="url(#bellyGrad)" />
                        <path d="M50,52 Q55,50 60,52 L58,58 Q55,60 52,58 Z" fill="#1a1a1a" />
                        <path d="M50,62 Q55,65 60,62" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" />
                    </g>
                </g>
            );
    }

    return (
        <div className="w-full h-full relative">
            <svg viewBox="0 0 110 110" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <linearGradient id="furGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8D6E63" />
                        <stop offset="50%" stopColor="#5D4037" />
                        <stop offset="100%" stopColor="#3E2723" />
                    </linearGradient>
                    <linearGradient id="bellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFF8E1" />
                        <stop offset="100%" stopColor="#D7CCC8" />
                    </linearGradient>
                    <radialGradient id="eyeShine" cx="30%" cy="30%" r="50%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                    </radialGradient>
                    <linearGradient id="glassesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4F46E5" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="capeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#991B1B" />
                    </linearGradient>
                </defs>
                {content}
                {pose !== 'sleep' && (
                    <g>
                        <path d="M35,65 Q55,75 75,65" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
                        <circle cx="55" cy="72" r="4" fill="#facc15" stroke="#b45309" strokeWidth="1" />
                    </g>
                )}
            </svg>
        </div>
    );
};

// --- REWARDS CONFIGURATION (Defined after VectorKafka) ---
const REWARDS = [
    { id: 1, title: "Super gemacht!", type: 'super-confetti', Component: () => <VectorKafka pose="happy" /> },
    { id: 2, title: "Zoomies!", type: 'super-confetti', Component: () => <VectorKafka pose="run" /> },
    { id: 3, title: "Verdiente Pause!", type: 'zzz', Component: () => <VectorKafka pose="sleep" /> },
    { id: 4, title: "Cooler Typ!", type: 'warp', Component: () => <VectorKafka pose="cool" /> },
    { id: 5, title: "Held des Tages!", type: 'supernova', Component: () => <VectorKafka pose="hero" /> },
    { id: 6, title: "Ich liebe es!", type: 'heart', Component: () => <VectorKafka pose="love" /> },
    { id: 7, title: "Leckerli Zeit!", type: 'gold-storm', Component: VectorBone },
    { id: 8, title: "Spielzeit!", type: 'bubble', Component: VectorBall },
    { id: 9, title: "Party Hard!", type: 'supernova', Component: () => <VectorKafka pose="happy" /> },
    { id: 10, title: "High Five!", type: 'super-confetti', Component: () => <VectorKafka pose="happy" /> }, 
    { id: 11, title: "Meisterleistung!", type: 'glitch', Component: () => <VectorKafka pose="cool" /> },
    { id: 12, title: "Schnell wie der Wind!", type: 'warp', Component: () => <VectorKafka pose="run" /> },
    { id: 13, title: "Goldener Knochen!", type: 'gold-storm', Component: VectorBone },
    { id: 14, title: "Wow!", type: 'star', Component: () => <VectorKafka pose="love" /> },
    { id: 15, title: "Läuft bei dir!", type: 'bubble', Component: () => <VectorKafka pose="happy" /> },
    { id: 16, title: "Nicht aufzuhalten!", type: 'supernova', Component: () => <VectorKafka pose="hero" /> },
    { id: 17, title: "Ein echter Profi!", type: 'glitch', Component: () => <VectorKafka pose="cool" /> },
    { id: 18, title: "Träum was schönes!", type: 'zzz', Component: () => <VectorKafka pose="sleep" /> },
    { id: 19, title: "Ball gefangen!", type: 'bubble', Component: VectorBall },
    { id: 20, title: "Genial!", type: 'warp', Component: () => <VectorKafka pose="love" /> },
    { id: 21, title: "Task vernichtet!", type: 'supernova', Component: () => <VectorKafka pose="hero" /> },
    { id: 22, title: "Guter Hund!", type: 'heart', Component: () => <VectorKafka pose="happy" /> },
    { id: 23, title: "Maximum Speed!", type: 'super-confetti', Component: () => <VectorKafka pose="run" /> },
    { id: 24, title: "Chill Modus", type: 'zzz', Component: () => <VectorKafka pose="sleep" /> },
    { id: 25, title: "Jackpot!", type: 'gold-storm', Component: VectorBone },
];

const VectorAvatarUI = ({ level }) => {
    const shirtColor = level > 10 ? '#9333ea' : level > 5 ? '#3b82f6' : '#16a34a'; 
    return (
        <div className="w-16 h-16 border-2 border-zinc-600 bg-zinc-800 relative shadow-lg group-hover:border-zinc-400 transition-colors overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#27272a" />
                        <stop offset="100%" stopColor="#18181b" />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" fill="url(#bgGrad)" />
                <path d="M20,60 Q15,90 30,95 L70,95 Q85,90 80,60 Q85,40 75,30 Q50,10 25,30 Q15,40 20,60" fill="#78350f" />
                <path d="M25,100 Q50,85 75,100 L75,85 Q50,75 25,85 Z" fill={shirtColor} />
                <rect x="42" y="65" width="16" height="10" fill="#fde68a" />
                <ellipse cx="50" cy="55" rx="20" ry="22" fill="#fde68a" />
                <path d="M30,35 Q50,25 70,35 Q75,45 70,55 L70,40 Q50,30 30,40 L30,55 Q25,45 30,35" fill="#78350f" />
                <path d="M50,25 L35,15 Q30,12 35,25 Q40,30 50,25 Z" fill="#ef4444" />
                <path d="M50,25 L65,15 Q70,12 65,25 Q60,30 50,25 Z" fill="#ef4444" />
                <circle cx="50" cy="25" r="4" fill="#b91c1c" />
                <circle cx="43" cy="55" r="2.5" fill="#18181b" /> 
                <circle cx="57" cy="55" r="2.5" fill="#18181b" /> 
                <ellipse cx="40" cy="62" rx="3" ry="1.5" fill="#fda4af" opacity="0.6" /> 
                <ellipse cx="60" cy="62" rx="3" ry="1.5" fill="#fda4af" opacity="0.6" /> 
                <path d="M46,67 Q50,69 54,67" fill="none" stroke="#18181b" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );
};

// --- REWARD OVERLAY COMPONENT ---
const RewardOverlay = ({ reward }) => {
    if (!reward.active || !reward.data) return null;
    const { title, type, Component } = reward.data;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm transition-all duration-500">
            <AnimationBackground type={type} />
            <div className="flex flex-col items-center justify-center animate-bounce z-[150]">
                <div className="bg-zinc-900/95 backdrop-blur p-8 border-2 border-green-500/50 shadow-[0_0_50px_-12px_rgba(34,197,94,0.5)]">
                    <div className="w-48 h-48 mx-auto mb-6 relative">
                        <Component />
                    </div>
                    <div className="mt-2 text-center text-white font-bold text-2xl tracking-wide uppercase font-sans">
                        {title}
                    </div>
                    <div className="text-center text-green-400 font-bold text-lg mt-1">
                        +{reward.gainedXP} XP
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CHANGELOG MODAL ---
const ChangelogModal = ({ onClose }) => (
    <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-green-500 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Info size={24} className="text-green-500" />
                CHANGELOG
            </h2>
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                {VERSION_HISTORY.map((ver, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="bg-zinc-800 text-white font-mono text-xs px-2 py-1 rounded border border-zinc-700">v{ver.version}</span>
                            {idx === 0 && <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest animate-pulse">Neu</span>}
                        </div>
                        <ul className="space-y-2 text-zinc-300 text-sm ml-2 border-l border-zinc-800 pl-4">
                            {ver.changes.map((change, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-zinc-600 mt-1">•</span>
                                    {change}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <button 
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-6 shadow-lg transition-all"
            >
                VERSTANDEN
            </button>
        </div>
    </div>
);

// --- APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [userStats, setUserStats] = useState({ xp: 0, lastPenaltyCheck: null });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit Mode State
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const [showChangelog, setShowChangelog] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('simple'); 
  const [projectDate, setProjectDate] = useState('');
  const [view, setView] = useState('dashboard');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [reward, setReward] = useState({ active: false, data: null, gainedXP: 0 });
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [debugTab, setDebugTab] = useState('rewards');

  useEffect(() => {
    const storedVersion = localStorage.getItem('antiass_version');
    if (storedVersion !== APP_VERSION) {
        setShowChangelog(true);
    }
  }, []);

  const closeChangelog = () => {
      localStorage.setItem('antiass_version', APP_VERSION);
      setShowChangelog(false);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
          try {
            await signInAnonymously(auth);
          } catch(err) {
              console.error("Auth failed:", err);
              setLoading(false);
          }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if(!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!user) return;
      
      const tasksQuery = query(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), orderBy('createdAt', 'desc'));
      const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
          const loadedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTasks(loadedTasks);
          setLoading(false);
      }, (err) => console.error("Tasks fetch error", err));

      const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'stats');
      const unsubStats = onSnapshot(statsRef, (docSnap) => {
          if (docSnap.exists()) {
              setUserStats(docSnap.data());
          } else {
              setDoc(statsRef, { xp: 0, serviceId: `AKTE-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}` });
          }
      }, (err) => console.error("Stats fetch error", err));

      return () => { unsubTasks(); unsubStats(); };
  }, [user]);

  useEffect(() => {
      if (!user || !userStats || tasks.length === 0) return;

      const checkPenalties = async () => {
          const todayStr = new Date().toDateString();
          if (userStats.lastPenaltyCheck === todayStr) return;

          let penalty = 0;
          const now = new Date();

          tasks.forEach(task => {
              if (!task.completed) {
                  const target = getTargetDate(task.deadline);
                  if (target && target < now) {
                      penalty += 20; 
                  }
              }
          });

          if (penalty > 0) {
              const newXP = Math.max(0, userStats.xp - penalty);
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'stats'), {
                  xp: newXP,
                  lastPenaltyCheck: todayStr
              });
              alert(`⚠️ ACHTUNG OPERATOR!\n\nAufgrund überfälliger Aufgaben wurden ${penalty} XP vom Konto abgezogen.\nDisziplin wahren!`);
          } else {
              await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'stats'), {
                  lastPenaltyCheck: todayStr
              });
          }
      };

      const timer = setTimeout(checkPenalties, 2000);
      return () => clearTimeout(timer);

  }, [user, tasks, userStats.lastPenaltyCheck]);

  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(interval);
  }, []);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Dein Browser unterstützt keine Spracherkennung.");
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const { level, currentXP, xpNeeded } = calculateLevel(userStats.xp);
  const levelProgress = (currentXP / xpNeeded) * 100;
  const currentTitle = getLevelTitle(level);
  const nextLevelTitle = getLevelTitle(level + 1);

  const handleSimpleSubmit = async () => {
    if (!inputText.trim()) return;
    
    if (!user) {
        alert("Fehler: Nicht angemeldet.");
        return;
    }

    setIsSubmitting(true);
    const parsed = parseNaturalLanguage(inputText);
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    
    if (parsed.date < todayStart) {
        alert("Fehler: Termine in der Vergangenheit sind nicht zulässig!");
        setIsSubmitting(false);
        return;
    }
    
    const d = parsed.date;
    const deadlineToStore = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), {
            text: parsed.text || inputText,
            type: 'simple',
            deadline: deadlineToStore, 
            completed: false,
            createdAt: Date.now(),
            completedAt: null,
            earnedXP: 0
        });
        setInputText('');
    } catch (err) {
        console.error("Error adding document: ", err);
        alert(`Fehler beim Speichern: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async () => {
    if (!inputText.trim()) return;

    if (!user) {
        alert("Fehler: Nicht angemeldet.");
        return;
    }

    if (projectDate) {
        const selected = new Date(projectDate);
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        if (selected < todayStart) {
             alert("Fehler: Projektdatum liegt in der Vergangenheit!");
             return;
        }
    }

    setIsSubmitting(true);
    try {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), {
            text: inputText,
            type: 'project',
            deadline: projectDate || 'Langfristig',
            details: 'Details hinzufügen...',
            completed: false,
            createdAt: Date.now(),
            completedAt: null,
            earnedXP: 0
        });
        setInputText('');
        setProjectDate('');
    } catch (err) {
        console.error("Error adding project: ", err);
        alert(`Fehler beim Speichern: ${err.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleComplete = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !user) return;

    const isCompleting = !task.completed;
    const xpValue = calculateTaskXP(task);
    const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId);
    const statsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'stats');

    try {
        await runTransaction(db, async (transaction) => {
            const statsDoc = await transaction.get(statsRef);
            const currentXP = statsDoc.exists() ? statsDoc.data().xp || 0 : 0;

            transaction.update(taskRef, {
                completed: isCompleting,
                completedAt: isCompleting ? Date.now() : null,
                earnedXP: isCompleting ? xpValue : 0
            });

            const newXP = isCompleting ? currentXP + xpValue : Math.max(0, currentXP - xpValue);
            transaction.update(statsRef, { xp: newXP });
        });

        if (isCompleting && REWARDS && REWARDS.length > 0) {
            const randomReward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
            setReward({ active: true, data: randomReward, gainedXP: xpValue });
            setTimeout(() => setReward(prev => ({ ...prev, active: false })), 3000);
        }
    } catch (err) {
        console.error("Error updating task: ", err);
        alert(`Fehler beim Update: ${err.message}`);
    }
  };

  const deleteTask = async (taskId) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId));
    } catch (err) {
        console.error("Error deleting: ", err);
        alert(`Fehler beim Löschen: ${err.message}`);
    }
  };

  const restoreTask = async (taskId) => {
      if (!user) return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), {
              completed: false,
              completedAt: null,
              earnedXP: 0
          });
      } catch (err) {
          console.error("Error restoring: ", err);
      }
  };

  const setLevelCheat = async (targetLevel) => {
      if (!user) return;
      let totalXP = 0;
      for (let i = 1; i < targetLevel; i++) totalXP += i * 350;
      try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'stats'), { ...userStats, xp: totalXP }); } catch (err) { console.error(err); }
  };
  
  const triggerDebugReward = (rewardData) => {
      setReward({ active: true, data: rewardData, gainedXP: 100 });
      setTimeout(() => setReward(prev => ({ ...prev, active: false })), 3000);
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const dashboardTasks = activeTasks.filter(t => {
      if (t.deadline === 'Langfristig') return false;
      return isWithinDays(t.deadline, 7);
  });

  const futureTasks = activeTasks.filter(t => {
      if (t.deadline === 'Langfristig') return true;
      return !isWithinDays(t.deadline, 7);
  });

  const tasksToday = tasks.filter(t => isToday(t.deadline));
  const tasksTodayCompleted = tasksToday.filter(t => t.completed);
  const dailyProgress = tasksToday.length > 0 ? (tasksTodayCompleted.length / tasksToday.length) * 100 : 0;
  const tasksWeek = tasks.filter(t => t.deadline !== 'Langfristig' && isWithinDays(t.deadline, 7));
  const tasksWeekCompleted = tasksWeek.filter(t => t.completed);
  const weeklyProgress = tasksWeek.length > 0 ? (tasksWeekCompleted.length / tasksWeek.length) * 100 : 0;
  const totalGoalProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const tasksMonth = tasks.filter(t => t.deadline !== 'Langfristig' && isWithinDays(t.deadline, 30));
  const monthlyProgress = tasksMonth.length > 0 ? (tasksMonth.filter(t=>t.completed).length / tasksMonth.length) * 100 : 0;
  const tasksYear = tasks.filter(t => t.deadline !== 'Langfristig' && isWithinDays(t.deadline, 365));
  const yearlyProgress = tasksYear.length > 0 ? (tasksYear.filter(t=>t.completed).length / tasksYear.length) * 100 : 0;
  
  const getEscalationStatus = (deadlineStr) => {
    const target = getTargetDate(deadlineStr);
    if (!target) return { text: "Zeitplan offen", color: "text-gray-500" };
    const diffTime = target - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffTime < 0) return { text: "ÜBERFÄLLIG", color: "text-red-600 font-bold bg-red-950 px-2" };
    if (diffDays < 1) return { text: "HEUTE FÄLLIG", color: "text-red-500 animate-pulse" };
    if (diffDays < 7) return { text: "Dringend: Diese Woche", color: "text-orange-400" };
    if (diffDays < 30) return { text: "Diesen Monat", color: "text-yellow-400" };
    return { text: "Geplant", color: "text-blue-400" };
  };

  if (loading && !user) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500 font-mono">INITIALIZING CLOUD UPLINK...</div>;

  const openEditModal = (task) => {
      if (task.completed) return; 
      setEditingTask(task);
      setEditTitle(task.text);
      const target = getTargetDate(task.deadline);
      if (target) {
          const yyyy = target.getFullYear();
          const mm = String(target.getMonth() + 1).padStart(2, '0');
          const dd = String(target.getDate()).padStart(2, '0');
          const hh = String(target.getHours()).padStart(2, '0');
          const min = String(target.getMinutes()).padStart(2, '0');
          
          setEditDate(`${yyyy}-${mm}-${dd}`);
          setEditTime(`${hh}:${min}`);
      } else {
          setEditDate('');
          setEditTime('23:59');
      }
  };

  const saveEdit = async () => {
      if (!user || !editingTask) return;
      
      let newDeadline = editingTask.deadline;
      if (editDate) {
          // Parse date parts
          const [y, m, d] = editDate.split('-').map(Number);
          
          // Parse time parts
          let h = 23;
          let min = 59;
          
          if (editTime) {
              const [th, tm] = editTime.split(':').map(Number);
              h = th;
              min = tm;
          }

          const dateObj = new Date(y, m - 1, d, h, min);
          const datePart = dateObj.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
          const timePart = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
          
          newDeadline = `${datePart} ${timePart}`;
      }

      try {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', editingTask.id), {
              text: editTitle,
              deadline: newDeadline
          });
          setEditingTask(null);
      } catch (err) {
          alert("Fehler beim Speichern: " + err.message);
      }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-green-500 font-sans p-4 md:p-8 selection:bg-green-900 selection:text-white relative overflow-x-hidden">
      
      <RewardOverlay reward={reward} />

      {showChangelog && <ChangelogModal onClose={closeChangelog} />}

      {showLegendModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in-95">
             <button onClick={() => setShowLegendModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Info size={20} className="text-purple-400" /> TASK STATUS</h3>
             
             <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800 mb-4 text-xs text-zinc-300 leading-relaxed">
                <p className="mb-2"><strong className="text-purple-400">Das Schwarze Loch Prinzip:</strong></p>
                <p>Aufgaben haben eine Schwerkraft. Je länger sie existieren, desto schwerer und dunkler werden sie.</p>
                <p className="mt-2 text-purple-300 italic">"Alte Aufgaben ziehen Energie ab und sollten eliminiert werden."</p>
             </div>

             <div className="space-y-3">
                 <div className="flex items-center gap-3 p-2 rounded bg-zinc-950/50 border border-zinc-800">
                    <span className="w-3 h-3 rounded-full bg-green-500/50"></span>
                    <span className="text-sm text-zinc-300">Frisch (&lt; 24h)</span>
                 </div>
                 <div className="flex items-center gap-3 p-2 rounded bg-zinc-950/50 border border-zinc-800">
                    <span className="w-3 h-3 rounded-full bg-yellow-500/50"></span>
                    <span className="text-sm text-zinc-300">Reifend (&gt; 24h)</span>
                 </div>
                 <div className="flex items-center gap-3 p-2 rounded bg-zinc-950/50 border border-zinc-800">
                    <span className="w-3 h-3 rounded-full bg-red-500/50"></span>
                    <span className="text-sm text-zinc-300">Kritisch (&gt; 48h)</span>
                 </div>
                 <div className="flex items-center gap-3 p-2 rounded bg-purple-900/10 border border-purple-500/30">
                    <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
                    <span className="text-sm text-purple-300 font-bold">Singularität (&gt; 72h)</span>
                 </div>
             </div>
             <p className="text-[10px] text-zinc-500 mt-4 text-center">Erledige Aufgaben bevor sie den Ereignishorizont erreichen!</p>
          </div>
        </div>
      )}

      {editingTask && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-green-500 p-6 rounded-xl w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><Edit2 size={20} /> TASK BEARBEITEN</h2>
                      <button onClick={() => setEditingTask(null)}><X className="text-zinc-500 hover:text-white" /></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-zinc-500 uppercase font-bold">Aufgabe</label>
                          <textarea 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white mt-1 focus:border-green-500 outline-none h-32"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold">Datum</label>
                              <input 
                                type="date" 
                                value={editDate} 
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white mt-1 focus:border-green-500 outline-none"
                                style={{colorScheme: 'dark'}}
                              />
                          </div>
                          <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold">Uhrzeit</label>
                              <input 
                                type="time" 
                                value={editTime} 
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white mt-1 focus:border-green-500 outline-none"
                                style={{colorScheme: 'dark'}}
                              />
                          </div>
                      </div>
                      <button 
                        onClick={saveEdit}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg mt-4 flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> SPEICHERN
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-lg h-[80vh] flex flex-col relative shadow-2xl">
                <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"><X size={24} /></button>
                <div className="p-8 border-b border-zinc-800 flex flex-col items-center bg-zinc-950/50">
                    <div className="mb-4 transform scale-150"><VectorAvatarUI level={level} /></div>
                    <div className="text-2xl font-black text-white tracking-tight text-center leading-none mb-1">{currentTitle}</div>
                    <div className="text-zinc-500 font-mono text-xs mt-1 uppercase tracking-widest">NEXT: {nextLevelTitle}</div>
                    {user && (
                        <div 
                            className="text-[10px] text-zinc-600 mt-2 font-mono select-all cursor-pointer hover:text-zinc-400 transition-colors" 
                            onClick={() => { navigator.clipboard.writeText(user.uid); alert("ID kopiert!"); }} 
                            title="Klicken zum Kopieren für DB-Regeln"
                        >
                            UID: {user.uid}
                        </div>
                    )}
                    <div className="w-full max-w-xs mt-6">
                         <div className="flex justify-between text-xs text-zinc-400 mb-2 font-bold"><span>LEVEL {level}</span><span>{Math.floor(currentXP)} / {xpNeeded} XP</span></div>
                        <div className="h-4 bg-zinc-800 border border-zinc-700 overflow-hidden relative">
                            <div className="h-full bg-yellow-500" style={{ width: `${levelProgress}%` }}></div>
                            <div className="absolute inset-0 w-full h-full" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.1) 5px, rgba(0,0,0,0.1) 10px)'}}></div>
                        </div>
                    </div>
                </div>
                <div className="border-b border-zinc-800 bg-zinc-900/50 p-3 flex justify-center text-xs text-zinc-500 gap-4 font-mono items-center">
                   <div 
                        className={`flex items-center gap-2 ${isOnline ? 'text-green-500' : 'text-red-500'} cursor-pointer hover:text-white transition-colors hover:underline`}
                        onClick={() => { setShowProfileModal(false); setShowChangelog(true); }}
                        title="Klicken für Changelog"
                   >
                        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {isOnline ? 'CLOUD: v' + APP_VERSION : 'OFFLINE'}
                   </div>
                   <div className="h-4 w-[1px] bg-zinc-700"></div>
                   <button onClick={() => { setShowProfileModal(false); setShowDebugMenu(true); }} className="flex items-center gap-2 hover:text-white transition-colors">
                        <Hash size={12} /> DEBUG
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-3 text-xs font-bold text-zinc-500 uppercase tracking-wider flex justify-between px-6"><span>Missionsprotokoll</span><span>Belohnung</span></div>
                    {completedTasks.length === 0 ? <div className="p-12 text-center text-zinc-600 italic">Keine Einträge.</div> : 
                        <div className="divide-y divide-zinc-800">
                            {completedTasks.slice().sort((a,b) => b.completedAt - a.completedAt).map((task) => (
                                <div key={task.id} className="p-4 hover:bg-zinc-800/50 transition-colors flex items-center justify-between px-6 group">
                                    <div>
                                        <div className="text-zinc-300 font-bold text-sm group-hover:text-white transition-colors">{task.text}</div>
                                        <div className="text-zinc-600 text-[10px] mt-0.5 flex items-center gap-1"><Calendar size={10} /> {new Date(task.completedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-500 font-mono font-bold bg-green-500/10 px-2 py-1 rounded text-xs border border-green-500/20">+{task.earnedXP || calculateTaskXP(task)} XP</div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
      )}
      
      {showDebugMenu && (
          <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 overflow-y-auto">
              <div className="bg-zinc-900 border border-green-500/30 p-6 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-zinc-700 pb-2">
                      <h2 className="text-xl font-bold text-white uppercase tracking-widest flex-1">Debug Menu</h2>
                      <button onClick={() => setShowDebugMenu(false)} className="text-zinc-500 hover:text-white"><X /></button>
                  </div>
                  <div className="flex gap-4 border-b border-zinc-800 pb-4 mb-4">
                      <button onClick={() => setDebugTab('rewards')} className={`px-4 py-2 rounded text-sm font-bold ${debugTab === 'rewards' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Animationen</button>
                      <button onClick={() => setDebugTab('levels')} className={`px-4 py-2 rounded text-sm font-bold ${debugTab === 'levels' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Level Liste</button>
                  </div>
                  {debugTab === 'rewards' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
                        {REWARDS.map((r, i) => (
                            <button key={i} onClick={() => triggerDebugReward(r)} className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded text-left text-xs font-mono border border-zinc-700 hover:border-green-500 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-green-900 text-green-400 flex items-center justify-center text-[8px] border border-green-700">{i+1}</span>
                                {r.title}
                            </button>
                        ))}
                    </div>
                  )}
                  {debugTab === 'levels' && (
                    <div className="overflow-y-auto space-y-1 pr-2 custom-scrollbar flex-1">
                        {LEVEL_TITLES.map((title, i) => (
                            <div key={i} className={`flex items-center gap-4 p-2 rounded border ${level === i + 1 ? 'bg-green-900/30 border-green-500/50' : 'border-transparent opacity-50'}`}>
                                <span className={`font-mono w-8 text-right ${level === i + 1 ? 'text-green-400 font-bold' : 'text-zinc-600'}`}>{i+1}</span>
                                <span className={`${level === i + 1 ? 'text-white font-bold' : 'text-zinc-400'}`}>{title}</span>
                                {level === i + 1 && <span className="ml-auto text-[10px] text-green-500 uppercase tracking-widest">Aktuell</span>}
                            </div>
                        ))}
                    </div>
                  )}
              </div>
          </div>
      )}

      {showStatsModal && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-green-800 p-6 max-w-md w-full relative shadow-2xl">
                <button onClick={() => setShowStatsModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                <h2 className="text-xl font-bold text-white mb-6 border-b border-zinc-700 pb-4">ERWEITERTE DATEN</h2>
                 <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-bold"><span className="text-orange-400">MONATSZIEL</span><span>{Math.round(monthlyProgress)}%</span></div>
                        <div className="h-3 bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-orange-600 to-orange-400" style={{width: `${monthlyProgress}%`}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-bold"><span className="text-blue-400">JAHRESZIEL</span><span>{Math.round(yearlyProgress)}%</span></div>
                        <div className="h-3 bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-600 to-blue-400" style={{width: `${yearlyProgress}%`}}></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-zinc-800">
                        <div className="text-center p-4 bg-zinc-800/50"><div className="text-3xl font-bold text-white">{tasks.length}</div><div className="text-xs text-zinc-500 font-bold mt-1">GESAMT</div></div>
                        <div className="text-center p-4 bg-zinc-800/50"><div className="text-3xl font-bold text-green-500">{completedTasks.length}</div><div className="text-xs text-zinc-500 font-bold mt-1">ERLEDIGT</div></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-xl mx-auto">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-end gap-5">
                <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
                    <VectorAvatarUI level={level} />
                </div>
                <div className="flex flex-col cursor-pointer" onClick={() => setShowProfileModal(true)}>
                    <h1 className="text-2xl font-black tracking-tight text-white leading-none">ANTI<span className="text-green-500">ASS</span></h1>
                    <div className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5 group-hover:text-zinc-300 transition-colors">Anti-Aufschiebe-System</div>
                    <div className="w-40 mt-2">
                         <div className="flex justify-between text-[10px] text-zinc-400 mb-1 font-medium"><span>{Math.floor(currentXP)} XP</span><span>{xpNeeded} XP</span></div>
                        <div className="h-2 bg-zinc-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500" style={{ width: `${levelProgress}%` }}></div></div>
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono">Lvl {level}: {currentTitle}</div>
                </div>
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => setShowLegendModal(true)} className="p-3 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-zinc-800 shadow-sm" title="Legende anzeigen"><Info size={20} /></button>
                <button onClick={() => setShowStatsModal(true)} className="p-3 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-zinc-800 shadow-sm"><BarChart3 size={20} /></button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-3 border border-zinc-800/50">
                    <div className="flex justify-between text-[10px] uppercase text-zinc-400 mb-2 font-bold tracking-wider"><span>Tag</span><span>{Math.round(dailyProgress)}%</span></div>
                    <div className="w-full h-2 bg-zinc-800 overflow-hidden"><div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] transition-all duration-500" style={{ width: `${dailyProgress}%` }} /></div>
                </div>
                <div className="bg-zinc-900/50 p-3 border border-zinc-800/50">
                    <div className="flex justify-between text-[10px] uppercase text-zinc-400 mb-2 font-bold tracking-wider"><span>Woche</span><span>{Math.round(weeklyProgress)}%</span></div>
                    <div className="w-full h-2 bg-zinc-800 overflow-hidden"><div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all duration-500" style={{ width: `${weeklyProgress}%` }} /></div>
                </div>
            </div>
             <div className="px-1">
                <div className="flex justify-between text-[10px] uppercase text-zinc-500 mb-1 font-medium"><span>Gesamtstatus</span><span>{Math.round(totalGoalProgress)}%</span></div>
                <div className="w-full h-1 bg-zinc-900 overflow-hidden"><div className="h-full bg-purple-500/60 transition-all duration-500" style={{ width: `${totalGoalProgress}%` }} /></div>
            </div>
          </div>
        </header>

        <div className="flex bg-zinc-900 p-1 mb-8">
            <button onClick={() => setView('dashboard')} className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${view === 'dashboard' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>WOCHE {dashboardTasks.length > 0 && <span className={`text-[9px] px-1.5 py-0.5 ${view === 'dashboard' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>{dashboardTasks.length}</span>}</button>
            <button onClick={() => setView('future')} className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${view === 'future' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>ZUKUNFT {futureTasks.length > 0 && <span className={`text-[9px] px-1.5 py-0.5 ${view === 'future' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-700 text-zinc-400'}`}>{futureTasks.length}</span>}</button>
            <button onClick={() => setView('archive')} className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${view === 'archive' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Archive size={14} /> ARCHIV</button>
        </div>

        {view !== 'archive' && (
        <section className="bg-zinc-900 border border-zinc-800 p-4 mb-8 shadow-xl">
          <div className="flex text-xs font-bold mb-4 bg-zinc-950 p-1">
            <button onClick={() => setMode('simple')} className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all ${mode === 'simple' ? 'bg-green-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}><Zap size={14} /> SCHNELL</button>
            <button onClick={() => setMode('project')} className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all ${mode === 'project' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}><Layout size={14} /> PROJEKT</button>
          </div>
          <div className="relative mb-3">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={mode === 'simple' ? "Bsp: 'Mo 18:00 Sport'..." : "Projektname..."} className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-base text-white placeholder-zinc-600 outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all" onKeyDown={(e) => e.key === 'Enter' && (mode === 'simple' ? handleSimpleSubmit() : handleProjectSubmit())} />
            <button onClick={startListening} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-zinc-400 bg-zinc-800 hover:text-green-500 hover:bg-green-500/20'}`}><Mic size={18} /></button>
          </div>
          {mode === 'project' && (
            <div className="mb-3 animate-in fade-in slide-in-from-top-2">
              <input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} onClick={(e) => { try { e.target.showPicker?.(); } catch (err) {} }} style={{ colorScheme: 'dark' }} className="w-full bg-zinc-950 border border-zinc-800 px-4 py-2 text-sm text-white outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all cursor-pointer" />
            </div>
          )}
          <button onClick={mode === 'simple' ? handleSimpleSubmit : handleProjectSubmit} disabled={isSubmitting} className={`w-full py-3 font-bold text-sm uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${mode === 'simple' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isSubmitting ? <RefreshCcw className="animate-spin" size={16} /> : <Plus size={16} strokeWidth={3} />} {isSubmitting ? 'Speichere...' : 'Bestätigen'}
          </button>
        </section>
        )}

        <div className="space-y-3">
          {view !== 'archive' && (
            <>
                {(view === 'dashboard' ? dashboardTasks : futureTasks).length === 0 && (
                    <div className="text-center py-16 border-2 border-dashed border-zinc-800 bg-zinc-900/30"><div className="text-zinc-600 text-sm font-medium">Alles erledigt! Zeit für Pause.</div></div>
                )}
                {(view === 'dashboard' ? dashboardTasks : futureTasks).map((task) => {
                    const escalation = getEscalationStatus(task.deadline);
                    const progress = getTaskProgress(task);
                    const aging = getAgingStatus(task.createdAt);
                    
                    let progressFillColor = 'bg-green-500/10';
                    if (progress > 70) progressFillColor = 'bg-yellow-500/10';
                    if (progress > 90) progressFillColor = 'bg-red-500/10';
                    if (progress >= 100) progressFillColor = 'bg-red-500/20';
                    const potentialXP = calculateTaskXP(task);
                    
                    return (
                    <div key={task.id} onClick={() => openEditModal(task)} className="group relative cursor-pointer active:scale-[0.99] transition-transform">
                        <div className={`relative overflow-hidden bg-zinc-900 border p-4 shadow-md transition-all hover:border-opacity-100 ${aging.border} ${aging.glow} ${task.type === 'project' ? 'border-l-8' : 'border-l-8'} border-l-current border-opacity-40`}>
                        
                        <div className={`absolute inset-0 ${aging.bg} opacity-20 pointer-events-none`}></div>

                        {task.deadline !== 'Langfristig' && <div className={`absolute left-0 top-0 bottom-0 ${progressFillColor} transition-all duration-1000 ease-out z-0`} style={{ width: `${progress}%` }} />}
                        <div className="relative z-10 flex items-start gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }} 
                                className={`mt-1 w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-all ${aging.color === 'text-purple-400' ? 'border-purple-500 hover:bg-purple-500/20' : 'border-zinc-600 hover:border-green-500 hover:bg-green-500/20'}`}
                            ></button>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-base pr-2 line-clamp-2 ${aging.color === 'text-purple-400' ? 'text-purple-200' : 'text-zinc-100'}`}>{task.text}</h3>
                                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-wide">
                                    {task.type === 'simple' ? (
                                    <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/50 px-2 py-1"><Clock size={12} className={aging.color} /> {formatDeadlineDisplay(task.deadline)}</span>
                                    ) : (
                                    <>
                                        <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/50 px-2 py-1"><Calendar size={12} className="text-indigo-500" /> {formatDeadlineDisplay(task.deadline)}</span>
                                        <span className={`flex items-center gap-1.5 px-2 py-1 bg-zinc-950/50 ${escalation.color}`}><AlertTriangle size={12} /> {escalation.text}</span>
                                    </>
                                    )}
                                    {aging.label !== 'Frisch' && (
                                        <span className={`px-2 py-0.5 rounded ${aging.bg} ${aging.color} border border-current border-opacity-30`}>{aging.label}</span>
                                    )}
                                    <span className="ml-auto text-zinc-500 group-hover:text-yellow-500 transition-colors font-bold text-xs">+{potentialXP} XP</span>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                    );
                })}
            </>
          )}

          {view === 'archive' && (
              <>
                {completedTasks.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm italic">Das Archiv ist leer.</div>}
                {completedTasks.slice().reverse().map((task) => (
                    <div key={task.id} className="bg-zinc-900/30 border border-zinc-800 p-4 opacity-60 hover:opacity-100 transition-all hover:bg-zinc-900">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 bg-green-500/20 flex items-center justify-center text-green-500"><Check size={14} strokeWidth={3} /></div>
                                <div><h3 className="text-zinc-400 line-through text-sm font-medium">{task.text}</h3><div className="text-[10px] text-zinc-600 mt-0.5">Erledigt: {new Date(task.completedAt).toLocaleDateString()}</div></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => restoreTask(task.id)} className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-zinc-800 transition-all" title="Wiederherstellen"><RefreshCcw size={16} /></button>
                                <button onClick={() => deleteTask(task.id)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-all" title="Endgültig löschen"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
              </>
          )}

        </div>
      </div>
    </div>
  );
}