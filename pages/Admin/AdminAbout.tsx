import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Save, ArrowLeft, Activity, Users, MessageSquare, Building,
  Plus, Trash2, Target, Eye, Quote, Award, ShieldCheck, Headset, Leaf,
  Handshake, TrendingUp, Timer, Globe,
  Settings, Database, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Define the content structure
interface AboutContent {
  stats: {
    est_year: string;
    on_time_dispatch: number;
    order_accuracy: number;
    repeat_customers: number;
    avg_response_time: number;
    rejection_rate: number;
    total_customers: number;
    yearly_capacity: number;
    cities_served: number;
  };
  mission: string;
  vision: string;
  values: Array<{ title: string; description: string; metric: string; icon: string }>;
  leadership: Array<{
    name: string;
    role: string;
    image: string;
    description: string;
    stats: Array<{ icon: string; label: string }>;
  }>;
  team: Array<{ name: string; role: string; image: string }>;
  testimonials: Array<{ quote: string; author: string; role: string }>;
  commitment: {
    commitment_text: string;
    accuracy_stats: { accountability: number; compromise: number };
    global_trust_text: string;
    quality_text: string;
    support_text: string;
    sustainability_text: string;
  };
  founder_quote: { quote: string; author: string; role: string };
}

const defaultContent: AboutContent = {
  stats: {
    est_year: '2018',
    on_time_dispatch: 95,
    order_accuracy: 99,
    repeat_customers: 92,
    avg_response_time: 30,
    rejection_rate: 1.2,
    total_customers: 1000,
    yearly_capacity: 300,
    cities_served: 450,
  },
  mission: '',
  vision: '',
  values: [],
  leadership: [],
  team: [],
  testimonials: [],
  commitment: {
    commitment_text: '',
    accuracy_stats: { accountability: 100, compromise: 0 },
    global_trust_text: '',
    quality_text: '',
    support_text: '',
    sustainability_text: '',
  },
  founder_quote: { quote: '', author: '', role: '' },
};

const AdminAbout: React.FC = () => {
  const [content, setContent] = useState<AboutContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_settings')
        .select('content')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data?.content) {
        setContent({ ...defaultContent, ...data.content });
      } else {
        setContent(defaultContent);
      }
    } catch (err) {
      console.error(err);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('about_settings')
      .upsert({ id: 1, content }, { onConflict: 'id' });

    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      alert('About page updated successfully!');
    }
    setSaving(false);
  };

  // Helper to update nested fields
  const updateStats = (key: string, value: any) => {
    setContent({
      ...content,
      stats: { ...content.stats, [key]: value },
    });
  };

  // Team
  const addTeam = () =>
    setContent({
      ...content,
      team: [...content.team, { name: '', role: '', image: '' }],
    });
  const updateTeam = (idx: number, field: keyof AboutContent['team'][0], value: string) => {
    const newTeam = [...content.team];
    newTeam[idx] = { ...newTeam[idx], [field]: value };
    setContent({ ...content, team: newTeam });
  };
  const removeTeam = (idx: number) => {
    const newTeam = [...content.team];
    newTeam.splice(idx, 1);
    setContent({ ...content, team: newTeam });
  };

  // Testimonials
  const addTestimonial = () =>
    setContent({
      ...content,
      testimonials: [...content.testimonials, { quote: '', author: '', role: '' }],
    });
  const updateTestimonial = (idx: number, field: keyof AboutContent['testimonials'][0], value: string) => {
    const newTestimonials = [...content.testimonials];
    newTestimonials[idx] = { ...newTestimonials[idx], [field]: value };
    setContent({ ...content, testimonials: newTestimonials });
  };
  const removeTestimonial = (idx: number) => {
    const newTestimonials = [...content.testimonials];
    newTestimonials.splice(idx, 1);
    setContent({ ...content, testimonials: newTestimonials });
  };

  // Values
  const addValue = () =>
    setContent({
      ...content,
      values: [...content.values, { title: '', description: '', metric: '', icon: 'Target' }],
    });
  const updateValue = (idx: number, field: keyof AboutContent['values'][0], value: string) => {
    const newValues = [...content.values];
    newValues[idx] = { ...newValues[idx], [field]: value };
    setContent({ ...content, values: newValues });
  };
  const removeValue = (idx: number) => {
    const newValues = [...content.values];
    newValues.splice(idx, 1);
    setContent({ ...content, values: newValues });
  };

  // Leadership
  const addLeader = () =>
    setContent({
      ...content,
      leadership: [
        ...content.leadership,
        { name: '', role: '', image: '', description: '', stats: [{ icon: 'Target', label: '' }] },
      ],
    });
  const updateLeader = (idx: number, field: keyof AboutContent['leadership'][0], value: any) => {
    const newLeadership = [...content.leadership];
    newLeadership[idx] = { ...newLeadership[idx], [field]: value };
    setContent({ ...content, leadership: newLeadership });
  };
  const removeLeader = (idx: number) => {
    const newLeadership = [...content.leadership];
    newLeadership.splice(idx, 1);
    setContent({ ...content, leadership: newLeadership });
  };
  const addLeaderStat = (leaderIdx: number) => {
    const newLeadership = [...content.leadership];
    newLeadership[leaderIdx].stats.push({ icon: 'Target', label: '' });
    setContent({ ...content, leadership: newLeadership });
  };
  const updateLeaderStat = (leaderIdx: number, statIdx: number, field: keyof AboutContent['leadership'][0]['stats'][0], value: string) => {
    const newLeadership = [...content.leadership];
    newLeadership[leaderIdx].stats[statIdx] = { ...newLeadership[leaderIdx].stats[statIdx], [field]: value };
    setContent({ ...content, leadership: newLeadership });
  };
  const removeLeaderStat = (leaderIdx: number, statIdx: number) => {
    const newLeadership = [...content.leadership];
    newLeadership[leaderIdx].stats.splice(statIdx, 1);
    setContent({ ...content, leadership: newLeadership });
  };

  // Commitment
  const updateCommitment = (key: string, value: any) => {
    setContent({
      ...content,
      commitment: { ...content.commitment, [key]: value },
    });
  };
  const updateAccuracyStat = (key: string, value: number) => {
    setContent({
      ...content,
      commitment: {
        ...content.commitment,
        accuracy_stats: { ...content.commitment.accuracy_stats, [key]: value },
      },
    });
  };

  // Founder quote
  const updateFounderQuote = (key: string, value: string) => {
    setContent({
      ...content,
      founder_quote: { ...content.founder_quote, [key]: value },
    });
  };

  if (loading) return <div className="p-10 text-gray-500 font-bold">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <Link to="/dfpladmin access" className="text-gray-500 hover:text-amber-600 flex items-center gap-2 font-semibold">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-amber-500 text-black px-8 py-2.5 rounded-lg font-black flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg"
        >
          <Save size={20} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <h1 className="text-4xl font-black mb-2">About Page Configuration</h1>
      <p className="text-gray-500 mb-8">Manage all dynamic content displayed on the About page.</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b pb-4">
        {[
          { id: 'metrics', label: 'Metrics', icon: Activity },
          { id: 'mission', label: 'Mission & Vision', icon: Target },
          { id: 'values', label: 'Values', icon: Award },
          { id: 'leadership', label: 'Leadership', icon: Users },
          { id: 'team', label: 'Team', icon: Building },
          { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
          { id: 'commitment', label: 'Commitment', icon: Handshake },
          { id: 'founder', label: 'Founder Quote', icon: Quote },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== METRICS TAB ===== */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
          {[
            { key: 'est_year', label: 'Establishment Year' },
            { key: 'on_time_dispatch', label: 'On-Time Dispatch (%)' },
            { key: 'order_accuracy', label: 'Order Accuracy (%)' },
            { key: 'repeat_customers', label: 'Repeat Customers (%)' },
            { key: 'avg_response_time', label: 'Avg Response Time (min)' },
            { key: 'rejection_rate', label: 'Rejection Rate (%)' },
            { key: 'total_customers', label: 'Total Customers' },
            { key: 'yearly_capacity', label: 'Yearly Capacity (Tons)' },
            { key: 'cities_served', label: 'Cities Served' },
          ].map((field) => (
            <div key={field.key} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">{field.label}</label>
              <input
                type="number"
                step="any"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                value={content.stats[field.key as keyof typeof content.stats] ?? ''}
                onChange={(e) => updateStats(field.key, parseFloat(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ===== MISSION & VISION TAB ===== */}
      {activeTab === 'mission' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Mission</label>
            <textarea
              rows={4}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              value={content.mission}
              onChange={(e) => setContent({ ...content, mission: e.target.value })}
            />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Vision</label>
            <textarea
              rows={4}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              value={content.vision}
              onChange={(e) => setContent({ ...content, vision: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ===== VALUES TAB ===== */}
      {activeTab === 'values' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold">Core Values (6 max)</h3>
            <button onClick={addValue} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Plus size={16} /> Add Value
            </button>
          </div>
          {content.values.map((val, idx) => (
            <div key={idx} className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <input
                type="text"
                placeholder="Title"
                className="flex-1 min-w-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={val.title}
                onChange={(e) => updateValue(idx, 'title', e.target.value)}
              />
              <input
                type="text"
                placeholder="Description"
                className="flex-1 min-w-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={val.description}
                onChange={(e) => updateValue(idx, 'description', e.target.value)}
              />
              <input
                type="text"
                placeholder="Metric"
                className="flex-1 min-w-[100px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={val.metric}
                onChange={(e) => updateValue(idx, 'metric', e.target.value)}
              />
              <input
                type="text"
                placeholder="Icon name (e.g., Target)"
                className="flex-1 min-w-[100px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={val.icon}
                onChange={(e) => updateValue(idx, 'icon', e.target.value)}
              />
              <button onClick={() => removeValue(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===== LEADERSHIP TAB ===== */}
      {activeTab === 'leadership' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold">Leadership Team</h3>
            <button onClick={addLeader} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Plus size={16} /> Add Leader
            </button>
          </div>
          {content.leadership.map((leader, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  className="flex-1 min-w-[150px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  value={leader.name}
                  onChange={(e) => updateLeader(idx, 'name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Role"
                  className="flex-1 min-w-[150px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  value={leader.role}
                  onChange={(e) => updateLeader(idx, 'role', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Image URL"
                  className="flex-1 min-w-[150px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  value={leader.image}
                  onChange={(e) => updateLeader(idx, 'image', e.target.value)}
                />
                <button onClick={() => removeLeader(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={20} />
                </button>
              </div>
              <textarea
                placeholder="Description"
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={leader.description}
                onChange={(e) => updateLeader(idx, 'description', e.target.value)}
              />
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Leader Stats (max 3)</span>
                  <button onClick={() => addLeaderStat(idx)} className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-bold">
                    + Add Stat
                  </button>
                </div>
                {leader.stats.map((stat, statIdx) => (
                  <div key={statIdx} className="flex gap-4 items-center mb-2">
                    <input
                      type="text"
                      placeholder="Icon name"
                      className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                      value={stat.icon}
                      onChange={(e) => updateLeaderStat(idx, statIdx, 'icon', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Label"
                      className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                      value={stat.label}
                      onChange={(e) => updateLeaderStat(idx, statIdx, 'label', e.target.value)}
                    />
                    <button onClick={() => removeLeaderStat(idx, statIdx)} className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TEAM TAB ===== */}
      {activeTab === 'team' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold">Team Members</h3>
            <button onClick={addTeam} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Plus size={16} /> Add Member
            </button>
          </div>
          {content.team.map((member, idx) => (
            <div key={idx} className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <input
                type="text"
                placeholder="Name"
                className="flex-1 min-w-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={member.name}
                onChange={(e) => updateTeam(idx, 'name', e.target.value)}
              />
              <input
                type="text"
                placeholder="Role"
                className="flex-1 min-w-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={member.role}
                onChange={(e) => updateTeam(idx, 'role', e.target.value)}
              />
              <input
                type="text"
                placeholder="Image URL"
                className="flex-1 min-w-[120px] p-3 bg-gray-50 border border-gray-200 rounded-lg"
                value={member.image}
                onChange={(e) => updateTeam(idx, 'image', e.target.value)}
              />
              <button onClick={() => removeTeam(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===== TESTIMONIALS TAB ===== */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold">Testimonials</h3>
            <button onClick={addTestimonial} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Plus size={16} /> Add Testimonial
            </button>
          </div>
          {content.testimonials.map((test, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative">
              <button onClick={() => removeTestimonial(idx)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
              <textarea
                placeholder="Quote"
                rows={2}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg mt-4"
                value={test.quote}
                onChange={(e) => updateTestimonial(idx, 'quote', e.target.value)}
              />
              <div className="flex gap-4 mt-3">
                <input
                  type="text"
                  placeholder="Author"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  value={test.author}
                  onChange={(e) => updateTestimonial(idx, 'author', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Role"
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  value={test.role}
                  onChange={(e) => updateTestimonial(idx, 'role', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== COMMITMENT TAB ===== */}
      {activeTab === 'commitment' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Commitment Text</label>
            <textarea
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
              value={content.commitment.commitment_text}
              onChange={(e) => updateCommitment('commitment_text', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Accountability %</label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                value={content.commitment.accuracy_stats.accountability}
                onChange={(e) => updateAccuracyStat('accountability', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Compromise %</label>
              <input
                type="number"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                value={content.commitment.accuracy_stats.compromise}
                onChange={(e) => updateAccuracyStat('compromise', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Global Trust Text</label>
              <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.commitment.global_trust_text} onChange={(e) => updateCommitment('global_trust_text', e.target.value)} />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Quality Text</label>
              <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.commitment.quality_text} onChange={(e) => updateCommitment('quality_text', e.target.value)} />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Support Text</label>
              <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.commitment.support_text} onChange={(e) => updateCommitment('support_text', e.target.value)} />
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">Sustainability Text</label>
              <textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.commitment.sustainability_text} onChange={(e) => updateCommitment('sustainability_text', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* ===== FOUNDER QUOTE TAB ===== */}
      {activeTab === 'founder' && (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Quote</label>
            <textarea rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.founder_quote.quote} onChange={(e) => updateFounderQuote('quote', e.target.value)} />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Author</label>
            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.founder_quote.author} onChange={(e) => updateFounderQuote('author', e.target.value)} />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Role</label>
            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" value={content.founder_quote.role} onChange={(e) => updateFounderQuote('role', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbout;