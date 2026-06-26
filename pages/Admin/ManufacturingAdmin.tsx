import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Ensure this points to your supabase client
import { 
  Save, Loader2, LayoutTemplate, FileText, 
  Globe, Video, Image as ImageIcon, Upload, PlayCircle,
  Trash2
} from 'lucide-react';

const ManufacturingAdmin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    hero_title: '', hero_subtitle: '', hero_video_url: '',
    overview_title: '', overview_desc: '',
    video1_title: '', video1_sub: '', video1_img: '',
    video2_title: '', video2_sub: '', video2_img: '',
    video3_title: '', video3_sub: '', video3_img: '',
    raw_title: '', raw_desc: '', raw_img: '',
    heat_title: '', heat_desc: '', heat_points: '',
    coat_title: '', coat_desc: '', coat_points: '',
    qc1_title: '', qc1_desc: '', qc2_title: '', qc2_desc: '',
    cap1_label: '', cap1_val: '', cap2_label: '', cap2_val: '',
    cap3_label: '', cap3_val: '', cap4_label: '', cap4_val: ''
  });

  // --- 1. FETCH DATA DIRECTLY FROM SUPABASE ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from('manufacturing_content').select('*').eq('id', 1).single();
        if (data) setFormData(data);
      } catch (err) { console.error(err); }
      finally { setFetching(false); }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- 2. SAVE DATA DIRECTLY TO SUPABASE ---
const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('manufacturing_content').update(formData).eq('id', 1);
      if (error) throw error;
      alert('✨ Published to Live Website!');
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  

  // --- 3. UPLOAD MEDIA DIRECTLY TO SUPABASE STORAGE ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const filePath = `factory-assets/${Date.now()}-${file.name.replace(/\s/g, '-')}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
      setFormData((prev: any) => ({ ...prev, [fieldName]: publicUrl }));
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (fieldName: string, url: string) => {
    if (!url) return;
    if (!window.confirm("Remove this media? (Click PUBLISH to save changes)")) return;

    try {
      // Extract the path from the Supabase URL
      const pathParts = url.split('/storage/v1/object/public/images/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('images').remove([filePath]);
      }

      setFormData(prev => ({ ...prev, [fieldName]: '' }));
    } catch (err) {
      console.error("Storage delete error:", err);
      setFormData(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov|ogg)$/i);

if (fetching) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  return (
<div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-50 bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-black uppercase flex items-center gap-2"><Globe /> Factory Admin</h1>
        <button onClick={handleSave} disabled={loading || uploading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} PUBLISH CHANGES
        </button>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* --- SECTION 1: HERO --- */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <LayoutTemplate size={20} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Hero Section</h2>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hero Title</label>
              <input 
                name="hero_title" 
                value={formData.hero_title} 
                onChange={handleChange}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Hero Background Media</label>
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={formData.hero_video_url} 
                    className="w-full p-3 bg-white border border-slate-200 rounded text-sm text-slate-400 truncate pr-12"
                    readOnly 
                  />
                  <label className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded cursor-pointer hover:bg-blue-700">
                    {uploading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16} />}
                    <input type="file" hidden accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'hero_video_url')} />
                  </label>
                </div>
                
                <div className="w-32 h-24 bg-slate-900 rounded overflow-hidden border border-slate-300 relative group">
                  {formData.hero_video_url ? (
                    <>
                      {isVideo(formData.hero_video_url) ? (
                        <video src={formData.hero_video_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={formData.hero_video_url} className="w-full h-full object-cover" alt="Hero Preview" />
                      )}
                      <button 
                        onClick={() => handleDeleteFile('hero_video_url', formData.hero_video_url)}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-slate-500 uppercase">No Media</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: OVERVIEW --- */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
             <FileText size={20} className="text-blue-500" />
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Factory Overview</h2>
           </div>
           <div className="space-y-6">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Section Title</label>
                  <input name="overview_title" value={formData.overview_title} onChange={handleChange}
                    className="w-full p-3 border border-slate-300 rounded-lg font-bold text-slate-800"/>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description (HTML Support)</label>
                  <textarea name="overview_desc" value={formData.overview_desc} onChange={handleChange}
                    className="w-full p-4 border border-slate-300 rounded-lg h-32 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
           </div>
        </section>

        {/* --- SECTION 3: PRODUCTION CARDS --- */}
        <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <Video size={20} className="text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Production Cards</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
           {[1, 2, 3].map((num) => {
  // We explicitly cast these as strings to satisfy the function requirements
  const fieldName = `video${num}_img` as string;
  const titleName = `video${num}_title` as string;
  const subName = `video${num}_sub` as string;
  
  // We use 'any' here just for the lookup to prevent the "string | number | symbol" error
  const mediaUrl = (formData as any)[fieldName];

  return (
    <div key={num} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
      <h3 className="font-bold text-slate-900 border-b pb-2">Card {num}</h3>
      
      <input 
        name={titleName} 
        value={(formData as any)[titleName]} 
        onChange={handleChange} 
        placeholder="Title"
        className="w-full p-2 text-sm border rounded"
      />

      <input 
        name={subName} 
        value={(formData as any)[subName]} 
        onChange={handleChange} 
        placeholder="Subtitle"
        className="w-full p-2 text-sm border rounded"
      />
      
      <div className="flex gap-2 items-center">
        <input 
          value={mediaUrl || ''} 
          readOnly 
          className="flex-1 p-2 text-[10px] border rounded bg-white text-slate-400 truncate" 
        />
        <label className="bg-blue-600 text-white p-2 rounded cursor-pointer">
          <Upload size={14} />
          <input 
            type="file" 
            hidden 
            accept="image/*,video/*" 
            onChange={(e) => handleFileUpload(e, fieldName)} // Error 1 (Ln 274) Solved
          />
        </label>
      </div>

      <div className="h-32 w-full rounded-md overflow-hidden border border-slate-300 relative bg-slate-900 group">
        {mediaUrl ? (
          <>
            {isVideo(mediaUrl) ? (
              <video src={mediaUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={mediaUrl} alt="Preview" className="h-full w-full object-cover"/>
            )}
            <button 
              onClick={() => handleDeleteFile(fieldName, mediaUrl)} // Error 2 (Ln 287) Solved
              className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Trash2 size={24} />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[10px] text-slate-500">No Media</div>
        )}
      </div>
    </div>
  );
})}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManufacturingAdmin;