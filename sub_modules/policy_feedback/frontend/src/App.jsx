import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    PieChart as PieChartIcon,
    Layers,
    Zap,
    Activity,
    Send,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_URL = 'http://localhost:8000';

const App = () => {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleAnalyze = async () => {
        if (!comments.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const commentList = comments.split('\n').filter(c => c.trim().length > 0);
            const response = await axios.post(`${API_URL}/analyze`, {
                comments: commentList
            });
            setData(response.data);
        } catch (err) {
            console.error(err);
            setError("Analysis failed. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 15 }
        }
    };

    const sentimentChartData = data ? [
        { name: 'Support', value: data.vibe_check.support, color: '#22c55e' },
        { name: 'Neutral', value: data.vibe_check.neutral, color: '#94a3b8' },
        { name: 'Oppose', value: data.vibe_check.oppose, color: '#ef4444' },
    ] : [];

    return (
        <div className="dashboard-container">
            <header className="header">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="subtitle">Operational Insights</span>
                    <h1>Mayor's Dashboard</h1>
                </motion.div>
            </header>

            <motion.section
                className="input-section"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="section-title">
                    <MessageSquare size={24} /> <span>Community Comments</span>
                </div>
                <textarea
                    className="comment-input"
                    placeholder="Paste or type community comments here (one per line)..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                />
                <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={loading || !comments.trim()}
                >
                    {loading ? <Loader2 className="spinner" style={{ width: '24px', height: '24px' }} /> : <Send size={20} />}
                    {loading ? 'Analyzing Voice...' : 'Generate AI Report'}
                </button>
            </motion.section>

            {error && (
                <motion.div
                    className="glass-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ borderColor: '#ef4444', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}
                >
                    <AlertCircle color="#ef4444" size={24} />
                    <span style={{ color: '#ef4444' }}>{error}</span>
                </motion.div>
            )}

            {loading && !data && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="subtitle">Running Deep Analysis Models...</p>
                </div>
            )}

            <AnimatePresence>
                {data && !loading && (
                    <motion.div
                        className="dashboard-grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* 1. Vibe Check */}
                        <motion.div className="glass-card vibe-check-card" variants={itemVariants}>
                            <div className="section-title">
                                <PieChartIcon size={24} /> <span>The Vibe Check</span>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sentimentChartData}
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {sentimentChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="vibe-stats">
                                {sentimentChartData.map((item) => (
                                    <div key={item.name} className="stat-item">
                                        <span className="stat-label">{item.name}</span>
                                        <div className="stat-bar-bg">
                                            <motion.div
                                                className="stat-bar-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.value}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                style={{ backgroundColor: item.color }}
                                            ></motion.div>
                                        </div>
                                        <span className="stat-value">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 2. Deep Sentiment */}
                        <motion.div className="glass-card deep-sentiment-card" variants={itemVariants}>
                            <div className="section-title">
                                <Activity size={24} /> <span>Deep Sentiment <span className="status-tag">Live Insight</span></span>
                            </div>
                            <div className="insight-box">
                                <p className="insight-text">"{data.deep_sentiment.insight}"</p>
                                <p className="reasoning-text">{data.deep_sentiment.reasoning}</p>
                            </div>
                        </motion.div>

                        {/* 3. Theme Map */}
                        <motion.div className="glass-card theme-map-card" variants={itemVariants}>
                            <div className="section-title">
                                <Layers size={24} /> <span>The Theme Map</span>
                            </div>
                            <div className="theme-grid">
                                {data.theme_map.map((pillar, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="theme-item"
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div className="theme-header">
                                            <span className="theme-name">{pillar.theme}</span>
                                            <span className="theme-mentions">{pillar.mentions} mentions</span>
                                        </div>
                                        <p className="theme-summary">{pillar.summary}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 4. Innovation Spotter */}
                        <motion.div className="glass-card innovation-card" variants={itemVariants}>
                            <div className="section-title">
                                <Zap size={24} /> <span>Innovation Spotter</span>
                            </div>
                            <div className="innovation-list">
                                {data.innovation_spotter.map((idea, idx) => (
                                    <motion.div
                                        key={idx}
                                        className="innovation-item"
                                        whileHover={{ x: 10 }}
                                    >
                                        <div className="innovation-icon" style={{ fontSize: '24px' }}>💡</div>
                                        <div>
                                            <div className="innovation-title">{idea.idea}</div>
                                            <div className="innovation-context">{idea.context}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
