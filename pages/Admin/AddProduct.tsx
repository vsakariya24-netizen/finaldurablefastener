import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft, Save, Loader2, Trash2, Upload,
  X, Check, Ruler, Image as ImageIcon,
  LayoutGrid, Settings, Hammer, Plus, Info,
  Search, ListPlus, Activity, ShieldCheck,
  Palette, Box, Tag, Layers, Type as TypeIcon
} from 'lucide-react';

// --- TYPES ---
type CategoryStructure = {
  id: string;
  name: string;
  sub_categories: { id: string; name: string }[];
};

type FaqItem = { question: string; answer: string };
type SpecItem = { key: string; value: string };

type DimItem = {
  label: string;
  symbol: string;
  values: Record<string, string>;
};

type CertItem = { title: string; subtitle: string };
type MaterialRow = { name: string; grades: string };
type AppItem = { name: string; image: string; loading?: boolean };

type SizeImageItem = {
  labels: string;
  name: string;
  image: string;
  loading: boolean;
};

// --- VARIANT TYPES (FITTING STYLE) ---
type VariantFinish = {
    id: string; 
    name: string;
    type: string;
    image: string;
    loading: boolean;
};

type VariantGroup = {
    id: string; 
    sizeLabel: string; 
    finishes: VariantFinish[];
};

// --- VARIANT TYPES (FASTENER STYLE) ---
type FastenerSize = { 
  diameter: string; 
  diameterUnit: 'mm' | 'gauge'; 
  length: string; 
  unit: 'mm' | 'inch'; 
};
type FastenerFinish = { 
  name: string; 
  image: string;      
  icon: string;       
  loading: boolean; 
  iconLoading: boolean; 
};
type FastenerType = { name: string; image: string; loading: boolean }; 

// --- CONSTANTS ---
const HEAD_TYPES = ["Bugle Head", "Countersunk (CSK)", "Pan Head", "Wafer Head"];
const DRIVE_TYPES = ["Phillips No.2", "Pozi (PZ)", "Torx (Star)", "Slotted"];
const THREAD_TYPES = ["Fine Thread", "Coarse Thread", "Twinfast", "Hi-Lo"];
const MATERIALS = ["C1022 Hardened Carbon Steel", "Stainless Steel 304", "Mild Steel", "Zinc Alloy", "Aluminium", "Brass"];

const KNOWN_CORE_KEYS = [
  "Head Type", "Drive Type", "Thread Type",
  "Point Type", "Coating", "Plating", "Surface Finish", "Shank Type", "Washer Type",
  "Material", "Grade", "Standard"
];

const DEFAULT_PERFORMANCE_KEYS = [
  "Core Hardness", "Surface Hardness", "Tensile Strength",
  "Shear Strength", "Salt Spray Resistance", "Installation Speed", "Temperature Range"
];
// Add this function inside your component
const collectAllImageUrls = (productData: any, variantGroupsData: any, fastenerData: any) => {
  const urls: string[] = [];
  
  // Product gallery images
  if (productData.images) urls.push(...productData.images);
  
  // Technical drawing
  if (productData.technical_drawing) urls.push(productData.technical_drawing);
  
  // Size images
  if (productData.size_images) {
    productData.size_images.forEach((si: any) => {
      if (si.image) urls.push(si.image);
    });
  }
  
  // Applications images
  if (productData.applications) {
    productData.applications.forEach((app: any) => {
      if (app.image) urls.push(app.image);
    });
  }
  
  // Fitting variants
  if (variantGroupsData) {
    variantGroupsData.forEach((group: any) => {
      group.finishes.forEach((finish: any) => {
        if (finish.image) urls.push(finish.image);
      });
    });
  }
  
  // Fastener variants
  if (fastenerData) {
    if (fastenerData.finishes) {
      fastenerData.finishes.forEach((f: any) => {
        if (f.image) urls.push(f.image);
        if (f.icon) urls.push(f.icon);
      });
    }
    if (fastenerData.types) {
      fastenerData.types.forEach((t: any) => {
        if (t.image) urls.push(t.image);
      });
    }
  }
  
  // Filter out empty strings and duplicates
  return [...new Set(urls.filter(url => url && url.trim() !== ''))];
};

// --- ✅ UPLOAD FUNCTION ---
const uploadFile = async (file: File, folder: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const CLOUDFLARE_WORKER_URL = "https://supabase-proxy-dfpl.vsakariya24.workers.dev/api/upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("filePath", filePath);

  try {
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const exactError = errorData?.error || `HTTP Error ${response.status}`;
      throw new Error(exactError);
    }

    const data = await response.json();
    return data.url; 
  } catch (error: any) {
    console.error("Upload Error:", error);
    throw new Error(error.message || "Network Error: Could not reach Cloudflare Worker");
  }
};

const AddProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoryStructure[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([{ name: '', grades: '' }]);

  // --- STATE: FITTING VARIANT ---
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);

  // --- STATE: FASTENER VARIANT ---
  const [fastenerSizes, setFastenerSizes] = useState<FastenerSize[]>([
    { diameter: '', diameterUnit: 'mm', length: '', unit: 'mm' }
  ]);
  const [fastenerFinishes, setFastenerFinishes] = useState<FastenerFinish[]>([
    { name: '', image: '', icon: '', loading: false, iconLoading: false }
  ]);
  const [fastenerTypes, setFastenerTypes] = useState<FastenerType[]>([{ name: '', image: '', loading: false }]); 

  // --- SIZE IMAGES STATE ---
  const [sizeImages, setSizeImages] = useState<SizeImageItem[]>([
    { labels: 'M1,M2,M3', name: 'WHITE', image: '', loading: false }
  ]);

  // --- EXPERT / FITTING DATA ---
  const [expertData, setExpertData] = useState({ seo_keywords: '' });
  
  const [fittingExtras, setFittingExtras] = useState({
    colors: '',       
    general_names: '', 
    packing: ''        
  });

  // Main Form Data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: '',
    sub_category: '',
    material: '',
    material_grade: '',
    short_description: '',
    long_description: '',
    images: [] as string[],
    technical_drawing: '',
    specifications: [] as SpecItem[],
    dimensional_specifications: [] as DimItem[],
    applications: [] as AppItem[],
    certifications: [] as CertItem[],
    faqs: [] as FaqItem[]
  });

  const [dynamicCoreSpecs, setDynamicCoreSpecs] = useState<SpecItem[]>([
    { key: 'Head Type', value: '' },
    { key: 'Drive Type', value: '' },
    { key: 'Thread Type', value: '' }
  ]);

  const [availablePerfKeys, setAvailablePerfKeys] = useState<string[]>(DEFAULT_PERFORMANCE_KEYS);
  const [selectedPerformance, setSelectedPerformance] = useState<string[]>([]);
  const [isAddingPerf, setIsAddingPerf] = useState(false);
  const [newPerfName, setNewPerfName] = useState('');

  // --- CATEGORY DETECTION ---
  const isFittingCategory = useMemo(() => {
    const cat = formData.category?.toLowerCase() || '';
    const sub = formData.sub_category?.toLowerCase() || '';
    return (
        cat.includes('fitting') || cat.includes('channel') || cat.includes('hinge') || 
        cat.includes('handle') || cat.includes('lock') || cat.includes('hardware') ||
        sub.includes('fitting') || sub.includes('channel')
    );
  }, [formData.category, formData.sub_category]);

  const isFastenerCategory = !isFittingCategory;

  // --- 1. INITIAL FETCH ---
  useEffect(() => {
    const fetchCategories = async () => {
      const { data: cats } = await supabase.from('categories').select('*');
      const { data: subs } = await supabase.from('sub_categories').select('*');
      if (cats && subs) {
        setCategories(cats.map(cat => ({
          id: cat.id, name: cat.name,
          sub_categories: subs.filter(sub => sub.category_id === cat.id)
        })));
      }
    };
    fetchCategories();
  }, []);

  // --- 2. FETCH PRODUCT ---
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        const { data: product, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) { console.error(error); return; }

        if (product) {
          const cat = product.category?.toLowerCase() || '';
          const sub = product.sub_category?.toLowerCase() || '';
          const productIsFitting = (
              cat.includes('fitting') || cat.includes('channel') || cat.includes('hinge') || 
              cat.includes('handle') || cat.includes('lock') || cat.includes('hardware') ||
              sub.includes('fitting') || sub.includes('channel')
          );

          let loadedApps: AppItem[] = [];
          if (Array.isArray(product.applications)) {
              loadedApps = product.applications.map((app: any) => {
                  if (typeof app === 'string') return { name: app, image: '' };
                  return { name: app.name, image: app.image || '' };
              });
          }

          let parsedRows: MaterialRow[] = [{ name: '', grades: '' }];
          if (product.material) {
              const smartSplitRegex = /\s*\|\s*(?![^()]*\))/g;
              let rawParts = (product.material.match(smartSplitRegex) || product.material.includes('|')) 
                ? product.material.split(smartSplitRegex).map((s: string) => s.trim())
                : product.material.split(',').map((s: string) => s.trim());
              parsedRows = rawParts.map((part: string) => {
                 const match = part.match(/^(.*?)\s*\(Grade\s*([^)]*)\)$/i);
                 return match ? { name: match[1].trim(), grades: match[2].trim() } : { name: part.replace(/\(Grade.*?\)/, '').trim(), grades: '' };
              });
          }
          setMaterialRows(parsedRows.length > 0 ? parsedRows : [{ name: '', grades: '' }]);

          if (product.size_images && Array.isArray(product.size_images)) {
              const formattedSizeImages = product.size_images.map((si: any) => ({
                  labels: si.labels || '',
                  name: si.name || '',
                  image: si.image || '',
                  loading: false
              }));
              setSizeImages(formattedSizeImages);
          }

          const specs = Array.isArray(product.specifications) ? product.specifications : [];
          setExpertData({ seo_keywords: specs.find((s:any) => s.key === 'seo_keywords')?.value || '' });
          setFittingExtras({
            colors: specs.find((s:any) => s.key === 'Available Colors')?.value || '',
            general_names: specs.find((s:any) => s.key === 'General Names')?.value || '',
            packing: specs.find((s:any) => s.key === 'Standard Packing')?.value || ''
          });

          const loadedCoreSpecs: SpecItem[] = [];
          const loadedOtherSpecs: SpecItem[] = [];
          const loadedPerfKeys: string[] = [];
          const dynamicAvailableKeys = new Set(DEFAULT_PERFORMANCE_KEYS);

          if (product.head_type) loadedCoreSpecs.push({ key: 'Head Type', value: product.head_type });
          if (product.drive_type) loadedCoreSpecs.push({ key: 'Drive Type', value: product.drive_type });
          if (product.thread_type) loadedCoreSpecs.push({ key: 'Thread Type', value: product.thread_type });
          
          specs.forEach((s: any) => {
              const key = s.key.trim();
              const lowerKey = key.toLowerCase();
              const val = s.value || ''; 

              if (['seo_keywords', 'available colors', 'general names', 'standard packing', 'standard', 'tds_url', 'mtc_url'].includes(lowerKey)) return;
              if (['head type', 'drive type', 'thread type'].includes(lowerKey)) return;

              const isDefaultPerfKey = DEFAULT_PERFORMANCE_KEYS.some(pk => pk.toLowerCase() === lowerKey);
              const isCustomPerfKey = val.trim().toLowerCase() === "standard";

              if (isDefaultPerfKey || isCustomPerfKey) {
                  const exactKey = DEFAULT_PERFORMANCE_KEYS.find(pk => pk.toLowerCase() === lowerKey) || key;
                  dynamicAvailableKeys.add(exactKey);
                  loadedPerfKeys.push(exactKey);
              } else if (KNOWN_CORE_KEYS.some(k => k.toLowerCase() === lowerKey)) {
                  loadedCoreSpecs.push({ key: s.key, value: s.value });
              } else {
                  loadedOtherSpecs.push({ key: s.key, value: s.value });
              }
          });

          setAvailablePerfKeys(Array.from(dynamicAvailableKeys));
          setDynamicCoreSpecs(loadedCoreSpecs.length > 0 ? loadedCoreSpecs : dynamicCoreSpecs);
          setSelectedPerformance(loadedPerfKeys);

          let parsedDims: DimItem[] = [];
          if (Array.isArray(product.dimensional_specifications)) {
              parsedDims = product.dimensional_specifications.map((d: any) => ({
                  label: d.label || '',
                  symbol: d.symbol || '',
                  values: typeof d.values === 'object' ? d.values : {} 
              }));
          }

          setFormData({
            name: product.name || '',
            slug: product.slug || '',
            category: product.category || '',
            sub_category: product.sub_category || '',
            material: product.material || '',
            material_grade: product.material_grade || '',
            short_description: product.short_description || '',
            long_description: product.long_description || '',
            images: product.images || [],
            technical_drawing: product.technical_drawing || '',
            specifications: loadedOtherSpecs,
            dimensional_specifications: parsedDims,
            applications: loadedApps,
            certifications: product.certifications || [],
            faqs: product.faqs || []
          });

          // --- RECONSTRUCT VARIANTS ---
          const { data: variantData } = await supabase.from('product_variants').select('*').eq('product_id', id);
          
          if (variantData && variantData.length > 0) {
            if (productIsFitting) {
                const finishImagesMap = product.finish_images || {};
                const grouped: Record<string, VariantFinish[]> = {};
                
                variantData.forEach((v: any) => {
                    const sizeKey = v.diameter || v.length || "Standard"; 
                    if (!grouped[sizeKey]) grouped[sizeKey] = [];
                    const savedImage = v.image ? v.image : (finishImagesMap[v.finish] || '');
                    
                    grouped[sizeKey].push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: v.finish,
                        type: v.type || '',
                        image: savedImage, 
                        loading: false
                    });
                });

                const reconstructedGroups: VariantGroup[] = Object.keys(grouped).map(sizeLabel => ({
                    id: Math.random().toString(36).substr(2, 9),
                    sizeLabel: sizeLabel,
                    finishes: grouped[sizeLabel]
                }));
                setVariantGroups(reconstructedGroups);

            } else {
                const uniqueSizesMap = new Map();
                variantData.forEach((v: any) => {
                    const key = `${v.diameter}|${v.length}`;
                    if(!uniqueSizesMap.has(key) && (v.diameter || v.length)) {
                        uniqueSizesMap.set(key, { 
                            diameter: v.diameter, 
                            diameterUnit: v.diameter_unit || 'mm',
                            length: v.length,
                            unit: v.unit || 'mm'
                        });
                    }
                });
                setFastenerSizes(Array.from(uniqueSizesMap.values()));

                const uniqueFinishesMap = new Map();
                variantData.forEach((v: any) => {
                    if(v.finish && !uniqueFinishesMap.has(v.finish)) {
                        uniqueFinishesMap.set(v.finish, { name: v.finish, image: v.image || '', loading: false });
                    }
                });
                setFastenerFinishes(uniqueFinishesMap.size > 0 ? Array.from(uniqueFinishesMap.values()) : fastenerFinishes);

                const typeImagesMap = product.type_images || {};
                const uniqueTypes = new Set<string>();
                variantData.forEach((v: any) => { if(v.type) uniqueTypes.add(v.type); });
                Object.keys(typeImagesMap).forEach(typeKey => { if(typeKey) uniqueTypes.add(typeKey); });

                if(uniqueTypes.size > 0) {
                   setFastenerTypes(Array.from(uniqueTypes).map(t => ({ 
                       name: t,
                       image: typeImagesMap[t] || '', 
                       loading: false
                   })));
                }
            }
          }
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  // --- SYNC MATERIAL ---
  useEffect(() => {
    const combinedMaterials = materialRows
      .filter(r => r.name.trim() !== '')
      .map(r => {
        const name = r.name.trim();
        const grade = r.grades.trim();
        return grade ? `${name} (Grade ${grade})` : name;
      })
      .join(' | '); 
    setFormData(prev => ({ ...prev, material: combinedMaterials }));
  }, [materialRows]);

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExpertChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setExpertData({ ...expertData, [e.target.name]: e.target.value });
  };
  
  const handleFittingChange = (e: any) => setFittingExtras(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // --- FITTING LOGIC ---
  const addVariantGroup = () => setVariantGroups(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), sizeLabel: '', finishes: [{ id: Math.random().toString(36).substr(2, 9), name: '', type: '', image: '', loading: false }] }]);
  const removeVariantGroup = (idx: number) => setVariantGroups(prev => prev.filter((_, i) => i !== idx));
  const updateGroupSize = (idx: number, val: string) => setVariantGroups(prev => { const n = [...prev]; n[idx] = { ...n[idx], sizeLabel: val }; return n; });
  const addFinishToGroup = (groupIdx: number) => setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes.push({ id: Math.random().toString(36).substr(2, 9), name: '', type: '', image: '', loading: false }); return n; });
  const removeFinishFromGroup = (groupIdx: number, finishIdx: number) => setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes = n[groupIdx].finishes.filter((_, i) => i !== finishIdx); return n; });
  const updateFinishName = (groupIdx: number, finishIdx: number, val: string) => setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes[finishIdx].name = val; return n; });
  const updateFinishType = (groupIdx: number, finishIdx: number, val: string) => setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes[finishIdx].type = val; return n; });
  
  const handleFinishImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupIdx: number, finishIdx: number) => {
    if (!e.target.files?.[0]) return;
    setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes[finishIdx].loading = true; return n; });
    try {
      const url = await uploadFile(e.target.files[0], 'finishes');
      setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes[finishIdx].image = url; n[groupIdx].finishes[finishIdx].loading = false; return n; });
    } catch (err: any) {
      alert(`Finish image error: ${err.message}`);
      setVariantGroups(prev => { const n = [...prev]; n[groupIdx].finishes[finishIdx].loading = false; return n; });
    }
  };
// Add this function alongside your uploadFile function
const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  
  const CLOUDFLARE_WORKER_URL = "https://supabase-proxy-dfpl.vsakariya24.workers.dev/api/delete";
  
  try {
    // Extract the file path from the URL
    const urlObj = new URL(fileUrl);
    const filePath = urlObj.pathname.substring(1); // Remove leading slash
    
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}?path=${encodeURIComponent(filePath)}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      console.error(`Delete failed for ${fileUrl}: ${response.status}`);
    }
  } catch (error: any) {
    console.error("Delete Error:", error);
    // Don't throw - allow other deletions to continue
  }
};

// Helper to delete multiple files
const deleteMultipleFiles = async (urls: string[]) => {
  const results = await Promise.allSettled(urls.map(url => deleteFile(url)));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`${failed.length} files failed to delete`);
  }
};
  // --- FASTENER VARIANT LOGIC ---
  const addFastenerSize = () => setFastenerSizes([...fastenerSizes, { diameter: '', diameterUnit: 'mm', length: '', unit: 'mm' }]);
  const removeFastenerSize = (idx: number) => setFastenerSizes(fastenerSizes.filter((_, i) => i !== idx));
  const updateFastenerSize = (idx: number, field: keyof FastenerSize, val: string) => {
    const newSizes = [...fastenerSizes];
    // @ts-ignore
    newSizes[idx] = { ...newSizes[idx], [field]: val };
    setFastenerSizes(newSizes);
  };

  const addFastenerFinish = () => setFastenerFinishes([...fastenerFinishes, { name: '', image: '', icon: '', loading: false, iconLoading: false }]);
  const removeFastenerFinish = (idx: number) => setFastenerFinishes(fastenerFinishes.filter((_, i) => i !== idx));
  const updateFastenerFinishName = (idx: number, val: string) => { const newFinishes = [...fastenerFinishes]; newFinishes[idx].name = val; setFastenerFinishes(newFinishes); };

  const handleFastenerFinishIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files?.[0]) return;
    const newFinishes = [...fastenerFinishes]; newFinishes[idx].iconLoading = true; setFastenerFinishes(newFinishes);
    try {
        const url = await uploadFile(e.target.files[0], 'finish-icons');
        newFinishes[idx].icon = url;
    } catch (err: any) {
        alert(`Icon upload failed: ${err.message}`);
    } finally {
        newFinishes[idx].iconLoading = false;
        setFastenerFinishes([...newFinishes]);
    }
  };

  const handleFastenerFinishUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
      if (!e.target.files?.[0]) return;
      const newFinishes = [...fastenerFinishes]; newFinishes[idx].loading = true; setFastenerFinishes(newFinishes);
      try {
          const url = await uploadFile(e.target.files[0], 'finishes');
          newFinishes[idx].image = url;
      } catch(err: any) { alert(`Upload failed: ${err.message}`); }
      newFinishes[idx].loading = false; setFastenerFinishes(newFinishes);
  };

  const addFastenerType = () => setFastenerTypes([...fastenerTypes, { name: '', image: '', loading: false }]);
  const removeFastenerType = (idx: number) => setFastenerTypes(fastenerTypes.filter((_, i) => i !== idx));
  const updateFastenerType = (idx: number, val: string) => { const newTypes = [...fastenerTypes]; newTypes[idx].name = val; setFastenerTypes(newTypes); };
  
  const handleFastenerTypeUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files?.[0]) return;
    const newTypes = [...fastenerTypes]; newTypes[idx].loading = true; setFastenerTypes(newTypes);
    try {
        const url = await uploadFile(e.target.files[0], 'types');
        newTypes[idx].image = url;
    } catch(err: any) { alert(`Upload failed: ${err.message}`); }
    newTypes[idx].loading = false; setFastenerTypes(newTypes);
  };

  // --- OTHER HANDLERS ---
  const addFaq = () => setFormData(p => ({ ...p, faqs: [...p.faqs, { question: '', answer: '' }] }));
  const removeFaq = (idx: number) => setFormData(p => ({ ...p, faqs: p.faqs.filter((_, i) => i !== idx) }));
  const updateFaq = (idx: number, field: 'question' | 'answer', val: string) => { const newFaqs = [...formData.faqs]; newFaqs[idx][field] = val; setFormData(p => ({ ...p, faqs: newFaqs })); };

  const addSizeImage = () => setSizeImages([...sizeImages, { labels: '', name: '', image: '', loading: false }]);
  const removeSizeImage = (idx: number) => setSizeImages(sizeImages.filter((_, i) => i !== idx));
  const updateSizeImageText = (idx: number, field: 'labels' | 'name', val: string) => { const n = [...sizeImages]; n[idx][field] = val; setSizeImages(n); };
  
  const handleSizeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files?.[0]) return;
    const n = [...sizeImages]; n[idx].loading = true; setSizeImages(n);
    try { const url = await uploadFile(e.target.files[0], 'size-variants'); n[idx].image = url; } catch (err: any) { alert(`Upload failed: ${err.message}`); }
    n[idx].loading = false; setSizeImages(n);
  };

  const togglePerformanceSpec = (key: string) => { setSelectedPerformance(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]); };

const handleAddCustomPerf = () => {
    const trimmedName = newPerfName.trim();
    
    if (!trimmedName) { 
        setIsAddingPerf(false); 
        setNewPerfName(''); 
        return; 
    }
    
    if (!availablePerfKeys.some(k => k.toLowerCase() === trimmedName.toLowerCase())) {
        setAvailablePerfKeys(prev => [...prev, trimmedName]); 
        setSelectedPerformance(prev => [...prev, trimmedName]); 
    }
    
    setNewPerfName(''); // Corrected line
    setIsAddingPerf(false);
};
const handleDeleteProduct = async (productId: string) => {
  if (!confirm('⚠️ WARNING: This will permanently delete the product AND all associated images from Cloudflare. This cannot be undone. Are you sure?')) {
    return;
  }
  
  setLoading(true);
  
  try {
    // 1. Fetch the product first to get all image URLs
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // 2. Fetch variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);
    
    // 3. Collect all image URLs
    const finishImagesMap = product.finish_images || {};
    const finishIconsMap = product.finish_icons || {};
    const typeImagesMap = product.type_images || {};
    
    const allImageUrls = [
      // Product images
      ...(product.images || []),
      // Technical drawing
      ...(product.technical_drawing ? [product.technical_drawing] : []),
      // Size images
      ...(product.size_images || []).map((si: any) => si.image).filter(Boolean),
      // Application images
      ...(product.applications || []).map((app: any) => app.image).filter(Boolean),
      // Finish images from maps
      ...Object.values(finishImagesMap),
      // Finish icons
      ...Object.values(finishIconsMap),
      // Type images
      ...Object.values(typeImagesMap),
      // Variant images
      ...(variants || []).map((v: any) => v.image).filter(Boolean),
    ];
    
    // Remove duplicates and empty strings
    const uniqueUrls = [...new Set(allImageUrls.filter(url => url && typeof url === 'string' && url.trim() !== ''))];
    
    console.log(`🗑️ Deleting ${uniqueUrls.length} images from Cloudflare...`);
    
    // 4. Delete all images from Cloudflare
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const url of uniqueUrls) {
      try {
        await deleteFile(url);
        deletedCount++;
        console.log(`✅ Deleted: ${url.substring(0, 50)}...`);
      } catch (err) {
        failedCount++;
        console.error(`❌ Failed to delete: ${url}`, err);
      }
    }
    
    console.log(`📊 Deletion summary: ${deletedCount} succeeded, ${failedCount} failed`);
    
    // 5. Delete variants from Supabase
    const { error: variantDeleteError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);
    
    if (variantDeleteError) throw variantDeleteError;
    
    // 6. Delete product from Supabase
    const { error: productDeleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (productDeleteError) throw productDeleteError;
    
    alert(`✅ Product deleted successfully!\n🗑️ ${deletedCount} images removed from Cloudflare.`);
    navigate('/dfpladmin-access/products');
    
  } catch (error: any) {
    console.error("Delete Error:", error);
    alert(`❌ Deletion failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
  const addCoreSpec = () => setDynamicCoreSpecs([...dynamicCoreSpecs, { key: '', value: '' }]);
  const removeCoreSpec = (idx: number) => setDynamicCoreSpecs(dynamicCoreSpecs.filter((_, i) => i !== idx));
  const updateCoreSpec = (idx: number, field: 'key' | 'value', val: string) => { const newSpecs = [...dynamicCoreSpecs]; newSpecs[idx][field] = val; setDynamicCoreSpecs(newSpecs); };

  const addSpec = () => setFormData(p => ({ ...p, specifications: [...p.specifications, { key: '', value: '' }] }));
  const removeSpec = (idx: number) => setFormData(p => ({ ...p, specifications: p.specifications.filter((_, i) => i !== idx) }));
  const updateSpec = (idx: number, field: 'key'|'value', val: string) => { const newSpecs = [...formData.specifications]; newSpecs[idx][field] = val; setFormData(p => ({ ...p, specifications: newSpecs })); };

  const addDim = () => setFormData(p => ({ ...p, dimensional_specifications: [...p.dimensional_specifications, { label: '', symbol: '', values: {} }] }));
  const removeDim = (idx: number) => setFormData(p => ({ ...p, dimensional_specifications: p.dimensional_specifications.filter((_, i) => i !== idx) }));
  const updateDim = (idx: number, field: 'label' | 'symbol' | 'values', val: string, diameterKey?: string) => {
    const newDims = [...formData.dimensional_specifications];
    if (field === 'values' && diameterKey) { newDims[idx].values = { ...newDims[idx].values, [diameterKey]: val }; } 
    else if (field === 'label' || field === 'symbol') { newDims[idx][field] = val; }
    setFormData(p => ({ ...p, dimensional_specifications: newDims }));
  };

  const addCert = () => setFormData(p => ({ ...p, certifications: [...p.certifications, { title: 'ISO 9001:2015', subtitle: 'Certified Facility' }] }));
  const removeCert = (idx: number) => setFormData(p => ({ ...p, certifications: p.certifications.filter((_, i) => i !== idx) }));
  const updateCert = (idx: number, field: 'title' | 'subtitle', val: string) => { const newCerts = [...formData.certifications]; newCerts[idx][field] = val; setFormData(p => ({ ...p, certifications: newCerts })); };

  const addMaterialRow = () => setMaterialRows([...materialRows, { name: '', grades: '' }]);
  const removeMaterialRow = (idx: number) => setMaterialRows(materialRows.filter((_, i) => i !== idx));
  const updateMaterialRow = (idx: number, field: 'name' | 'grades', val: string) => { const newRows = [...materialRows]; newRows[idx][field] = val; setMaterialRows(newRows); };

  const handleAppImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    if (!e.target.files?.[0]) return;
    const newApps = [...formData.applications]; newApps[idx].loading = true; setFormData(p => ({ ...p, applications: newApps }));
    try { const url = await uploadFile(e.target.files[0], 'applications'); newApps[idx].image = url; } catch(err: any) { alert(`Upload failed: ${err.message}`); }
    newApps[idx].loading = false; setFormData(p => ({ ...p, applications: newApps }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const url = await uploadFile(e.target.files[0], 'gallery');
      setFormData(prev => ({ ...prev, images: [url, ...prev.images] }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTechDrawingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try { const url = await uploadFile(e.target.files[0], 'tech'); setFormData(prev => ({ ...prev, technical_drawing: url })); } catch(err: any) { alert(`Upload failed: ${err.message}`); }
    setUploading(false);
  };

  const addApp = () => setFormData(p => ({ ...p, applications: [...p.applications, { name: '', image: '' }] }));
  const updateAppName = (idx: number, val: string) => { const newApps = [...formData.applications]; newApps[idx].name = val; setFormData(p => ({ ...p, applications: newApps })); };
  const removeApp = (idx: number) => setFormData(p => ({ ...p, applications: p.applications.filter((_, i) => i !== idx) }));

  // --- HELPER FOR BLUEPRINT COLUMNS ---
  const uniqueDiameters = useMemo(() => {
    let rawList: string[] = [];
    if (isFittingCategory) {
        rawList = variantGroups.map(g => g.sizeLabel.trim());
    } else {
        rawList = fastenerSizes.map(s => {
          const val = s.diameter.trim();
          if(!val) return '';
          return s.diameterUnit === 'mm' ? `${val}mm` : `#${val}`;
        });
    }
    return Array.from(new Set(rawList.filter(d => d !== ''))).sort();
  }, [isFittingCategory, variantGroups, fastenerSizes]);


  // --- SUBMIT FUNCTION ---
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const finalSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const finishImageMap: Record<string, string> = {};
  const finishIconMap: Record<string, string> = {};
  const typeImageMap: Record<string, string> = {};

  if (isFittingCategory) {
    variantGroups.forEach(group => {
      group.finishes.forEach(f => {
        if (f.name.trim() && f.image) finishImageMap[f.name.trim()] = f.image;
      });
    });
  } else {
    fastenerFinishes.forEach(f => {
      if (f.name.trim() && f.image) finishImageMap[f.name.trim()] = f.image;
      if (f.icon) finishIconMap[f.name.trim()] = f.icon;
    });
    fastenerTypes.forEach(t => {
      if (t.name.trim() && t.image) typeImageMap[t.name.trim()] = t.image;
    });
  }

  const payload = {
    ...formData,
    slug: finalSlug,
    finish_images: finishImageMap,
    finish_icons: finishIconMap,
    type_images: typeImageMap,
    size_images: sizeImages.filter(si => si.labels.trim() || si.image).map(({ loading, ...rest }) => rest),
    specifications: [
      ...formData.specifications.filter(s => s.key && s.value),
      ...selectedPerformance.map(key => ({ key, value: 'Standard' })),
      { key: 'Available Colors', value: fittingExtras.colors },
      { key: 'General Names', value: fittingExtras.general_names },
      { key: 'Standard Packing', value: fittingExtras.packing },
      { key: 'seo_keywords', value: expertData.seo_keywords },
      ...dynamicCoreSpecs.filter(s => s.key && s.value)
    ].filter(s => s.value && s.value.trim() !== ''),
    applications: formData.applications.filter(a => a.name.trim() !== '').map(({ loading, ...rest }) => rest),
    faqs: formData.faqs.filter(f => f.question.trim() !== ''),
  };

  try {
    let productId = id;

    if (isEditMode) {
      const { error: updateErr } = await supabase.from('products').update(payload).eq('id', id);
      if (updateErr) throw updateErr;
    } else {
      const { data, error: insertErr } = await supabase
        .from('products')
        .insert([payload])
        .select('id')
        .single();

      if (insertErr) {
        if (insertErr.message.includes('fetch')) {
          await supabase.from('products').insert([payload]);
          const { data: fallbackData } = await supabase.from('products').select('id').eq('slug', finalSlug).single();
          productId = fallbackData?.id;
        } else {
          throw insertErr;
        }
      } else {
        productId = data.id;
      }
    }

    if (!productId) throw new Error("Failed to retrieve Product ID");

    await supabase.from('product_variants').delete().eq('product_id', productId);

    const variantRows: any[] = [];

    if (isFittingCategory) {
      variantGroups.forEach(group => {
        group.finishes.forEach(f => {
          variantRows.push({
            product_id: productId,
            diameter: group.sizeLabel, 
            finish: f.name,
            type: f.type,
            image: f.image
          });
        });
      });
    } else {
      fastenerSizes.forEach(size => {
        fastenerFinishes.forEach(finish => {
          const baseType = fastenerTypes[0]?.name || ''; 
          variantRows.push({
            product_id: productId,
            diameter: size.diameter,
            diameter_unit: size.diameterUnit,
            length: size.length,
            unit: size.unit,
            finish: finish.name,
            type: baseType,
            image: finish.image 
          });
        });
      });
    }

    if (variantRows.length > 0) {
      const { error: varErr } = await supabase.from('product_variants').insert(variantRows);
      if (varErr) throw varErr;
    }

    navigate('/dfpladmin-access/products'); 

  } catch (error: any) {
    console.error("Submission Error:", error);
    alert(`Submission Failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const activeSubCategories = categories.find(c => c.name === formData.category)?.sub_categories || [];

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dfpladmin access/products')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <datalist id="headTypeOptions">{HEAD_TYPES.map(o => <option key={o} value={o} />)}</datalist>
        <datalist id="driveTypeOptions">{DRIVE_TYPES.map(o => <option key={o} value={o} />)}</datalist>
        <datalist id="threadTypeOptions">{THREAD_TYPES.map(o => <option key={o} value={o} />)}</datalist>
        <datalist id="materialOptions">{MATERIALS.map(o => <option key={o} value={o} />)}</datalist>
        <datalist id="coreAttributesSuggestions"><option value="Head Type" /><option value="Drive Type" /><option value="Thread Type" /><option value="Point Type" /><option value="Coating" /></datalist>

        {/* 1. Basic Info & SEO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><Check size={18} className="text-blue-600" /> Basic Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div><label className="block text-sm font-bold mb-1">Product Name</label><input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-sm font-bold mb-1">Category</label><select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"><option value="">Select...</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <div><label className="block text-sm font-bold mb-1">Sub Category</label><select name="sub_category" value={formData.sub_category} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"><option value="">Select...</option>{activeSubCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
          </div>
          <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-2"><Search size={14}/> SEO Keywords (Comma Separated)</label>
              <input name="seo_keywords" value={expertData.seo_keywords} onChange={handleExpertChange} placeholder="e.g. Drywall Screw, Black Phosphate, Gypsum Screw" className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-sm"/>
          </div>
          <textarea name="short_description" value={formData.short_description} onChange={handleChange} placeholder="Short Description" className="w-full px-4 py-2 border rounded-lg mb-4" rows={2} />
          <textarea name="long_description" value={formData.long_description} onChange={handleChange} placeholder="Long Description" className="w-full px-4 py-2 border rounded-lg" rows={4} />
        </div>

        {/* 2. CERTIFICATIONS SECTION */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> Certifications</h3>
                <button type="button" onClick={addCert} className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded hover:bg-emerald-200 flex items-center gap-1"><Plus size={14} /> Add Badge</button>
            </div>
            
            <div className="space-y-3">
                {formData.certifications.map((cert, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="pt-2"><ShieldCheck className="text-gray-300" size={24} /></div>
                        <div className="flex-1 space-y-2">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase">Title</label><input value={cert.title} onChange={(e) => updateCert(idx, 'title', e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm font-bold text-gray-800" placeholder="ISO 9001:2015"/></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase">Subtitle</label><input value={cert.subtitle} onChange={(e) => updateCert(idx, 'subtitle', e.target.value)} className="w-full px-3 py-1.5 border rounded text-sm text-gray-600" placeholder="Certified Facility"/></div>
                        </div>
                        <button type="button" onClick={() => removeCert(idx)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>

            {formData.certifications.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <label className="block text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={14} className="text-emerald-500"/> Live Preview (How it looks to users)
                    </label>
                    
                    <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 flex flex-wrap gap-4">
                        {formData.certifications.map((cert: CertItem, idx: number) => (
                            <div key={idx} className="bg-neutral-900 rounded-md py-2 px-3 flex items-center gap-3 border border-neutral-800 shadow-2xl hover:scale-105 transition-transform duration-300 cursor-default">
                                <div className="p-1 rounded-full border-2 border-emerald-500/30 shrink-0">
                                    <ShieldCheck className="text-emerald-500" size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-sm leading-none">{cert.title || 'Draft Title'}</span>
                                    <span className="text-emerald-500 text-[9px] font-bold tracking-[0.25em] uppercase mt-1.5 font-mono leading-none">{cert.subtitle || 'Draft Subtitle'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* 3. CORE SPECS + MATERIAL */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2"><Hammer size={18} /> Core Specs</h3>
                  {!isFittingCategory && (
                    <button type="button" onClick={addCoreSpec} className="text-xs bg-black text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-slate-800 transition-colors"><ListPlus size={14}/> Add Attribute</button>
                  )}
              </div>
              
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase">Material Composition</label>
                      <button type="button" onClick={addMaterialRow} className="text-xs bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-100"><Plus size={12}/> Add Grade</button>
                  </div>
                  <div className="space-y-2">
                      {materialRows.map((row, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                              <div className="flex-1"><input value={row.name} list="materialOptions" onChange={(e) => updateMaterialRow(idx, 'name', e.target.value)} placeholder="Material Name" className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                              <div className="flex-1"><input value={row.grades} onChange={(e) => updateMaterialRow(idx, 'grades', e.target.value)} placeholder="Grade" className="w-full px-3 py-2 border rounded-md text-sm" /></div>
                              {materialRows.length > 1 && (<button type="button" onClick={() => removeMaterialRow(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>)}
                          </div>
                      ))}
                  </div>
              </div>

              {isFittingCategory ? (
                 <div className="border border-orange-200 bg-orange-50/50 p-4 rounded-xl">
                    <h3 className="font-bold mb-4 flex gap-2 text-orange-800"><LayoutGrid size={18} className="text-orange-600"/> Architectural DNA</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded border border-orange-100">
                             <label className="text-xs font-bold uppercase block mb-1 flex items-center gap-2 text-gray-600"><Palette size={14}/> Available Colors/Finishes</label>
                             <input name="colors" value={fittingExtras.colors} onChange={handleFittingChange} placeholder="Gold, Silver, Black Antique..." className="w-full border p-2 rounded text-sm"/>
                        </div>
                        <div className="bg-white p-3 rounded border border-orange-100">
                             <label className="text-xs font-bold uppercase block mb-1 flex items-center gap-2 text-gray-600"><Box size={14}/> Standard Packing</label>
                             <input name="packing" value={fittingExtras.packing} onChange={handleFittingChange} placeholder="100 pcs/box..." className="w-full border p-2 rounded text-sm"/>
                        </div>
                        <div className="col-span-1 md:col-span-2 bg-white p-3 rounded border border-orange-100">
                             <label className="text-xs font-bold uppercase block mb-1 flex items-center gap-2 text-gray-600"><Tag size={14}/> General Names / Tags</label>
                             <input name="general_names" value={fittingExtras.general_names} onChange={handleFittingChange} placeholder="Door Hinge, Cabinet Handle..." className="w-full border p-2 rounded text-sm"/>
                        </div>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {dynamicCoreSpecs.map((spec, idx) => (
                        <div key={idx} className="flex gap-4">
                            <input list="coreAttributesSuggestions" value={spec.key} onChange={(e) => updateCoreSpec(idx, 'key', e.target.value)} placeholder="Attribute Name" className="flex-1 px-3 py-2 border rounded-lg" />
                            <input list={spec.key === 'Head Type' ? "headTypeOptions" : spec.key === 'Drive Type' ? "driveTypeOptions" : spec.key === 'Thread Type' ? "threadTypeOptions" : ""} value={spec.value} onChange={(e) => updateCoreSpec(idx, 'value', e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border rounded-lg" />
                            <button type="button" onClick={() => removeCoreSpec(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                    ))}
                 </div>
              )}
        </div>

        {/* 4. PERFORMANCE DATA */}
        {!isFittingCategory && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-2 flex-wrap gap-2">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-amber-500" /> Performance Specs</h3>
                      <div className="flex items-center gap-2">
                        {isAddingPerf ? (
                            <div className="flex items-center gap-1">
                                <input autoFocus value={newPerfName} onChange={(e) => setNewPerfName(e.target.value)} placeholder="Feature Name..." className="text-sm px-2 py-1 border rounded w-40" />
                                <button type="button" onClick={handleAddCustomPerf} className="bg-green-600 text-white p-1 rounded"><Check size={14} /></button>
                                <button type="button" onClick={() => setIsAddingPerf(false)} className="bg-gray-200 p-1 rounded"><X size={14} /></button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setIsAddingPerf(true)} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">+ Add Custom</button>
                        )}
                      </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {availablePerfKeys.map((key) => {
                        const isSelected = selectedPerformance.includes(key);
                        return (
                            <div key={key} onClick={() => togglePerformanceSpec(key)} className={`cursor-pointer rounded-lg p-3 border text-sm font-medium flex items-center gap-3 ${isSelected ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-gray-50 text-gray-500'}`}>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'bg-white'}`}>{isSelected && <Check size={14} className="text-white" strokeWidth={3} />}</div>
                                {key}
                            </div>
                        );
                    })}
                  </div>
            </div>
        )}

        {/* 5. BLUEPRINT DATA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Ruler size={18} /> Blueprint Data</h3><button type="button" onClick={addDim} className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded">+ Add Feature</button></div>
              <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-dashed flex items-center gap-6">
                  <div className="w-32 h-20 bg-white border flex items-center justify-center overflow-hidden rounded">{formData.technical_drawing ? <img src={formData.technical_drawing} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-300" />}</div>
                  <div><label className="block text-sm font-bold mb-1">Drawing Image</label><input type="file" onChange={handleTechDrawingUpload} className="text-sm" /></div>
              </div>
              <div className="overflow-x-auto">
                  {uniqueDiameters.length === 0 ? (
                      <div className="text-center p-4 text-red-500 bg-red-50 rounded text-sm border border-red-100">⚠️ Please add sizes below to generate columns.</div>
                  ) : (
                      <table className="w-full min-w-[600px] border-collapse text-sm">
                        <thead><tr className="bg-gray-100 text-left"><th className="p-3 border-b">Feature Name</th><th className="p-3 border-b">Symbol</th>{uniqueDiameters.map(dia => (<th key={dia} className="p-3 border-b text-blue-600">{dia}</th>))}<th className="p-3 border-b"></th></tr></thead>
                        <tbody>
                          {formData.dimensional_specifications.map((dim, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">
                                <input
                                  value={dim.label}
                                  onChange={(e) => updateDim(idx, 'label', e.target.value)}
                                  className="w-full border rounded p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={dim.symbol}
                                  onChange={(e) => updateDim(idx, 'symbol', e.target.value)}
                                  className="w-full border rounded p-1 text-center"
                                />
                              </td>
                              
                              {uniqueDiameters.map((dia) => {
                                const rawKey = dia.replace('mm', '').replace('#', '');
                                const displayValue = dim.values[dia] || dim.values[rawKey] || '';

                                return (
                                  <td key={dia} className="p-2">
                                    <input
                                      value={displayValue} 
                                      onChange={(e) => updateDim(idx, 'values', e.target.value, dia)}
                                      className="w-full border rounded p-1 text-center"
                                    />
                                  </td>
                                );
                              })}

                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDim(idx)}
                                  className="text-red-400"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  )}
              </div>
        </div>

        {/* 6. VARIANTS CONFIGURATION */}
        {isFastenerCategory ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Ruler size={18}/> Dimensions</h3><button type="button" onClick={addFastenerSize} className="text-blue-600 text-sm font-bold">+ Add</button></div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {fastenerSizes.map((s, idx) => (
                            <div key={idx} className="flex flex-col gap-3 bg-gray-50 p-3 rounded-lg border relative">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Diameter / Gauge</label>
                                    <div className="flex gap-1">
                                        <input value={s.diameter} onChange={(e) => updateFastenerSize(idx, 'diameter', e.target.value)} placeholder={s.diameterUnit === 'mm' ? "e.g. 4.2" : "e.g. 8"} className="flex-1 px-3 py-2 border rounded-lg text-sm font-bold" />
                                        <select value={s.diameterUnit} onChange={(e) => updateFastenerSize(idx, 'diameterUnit', e.target.value as any)} className="w-24 px-1 py-2 border rounded-lg text-xs font-bold bg-white text-blue-600">
                                            <option value="mm">mm</option>
                                            <option value="gauge">Gauge</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Length</label>
                                    <div className="flex gap-1">
                                        <input value={s.length} onChange={(e) => updateFastenerSize(idx, 'length', e.target.value)} placeholder="e.g. 25" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                                        <select value={s.unit} onChange={(e) => updateFastenerSize(idx, 'unit', e.target.value as any)} className="w-24 px-1 py-2 border rounded-lg text-xs font-bold bg-white text-purple-600">
                                            <option value="mm">mm</option>
                                            <option value="inch">inch</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="button" onClick={() => removeFastenerSize(idx)} className="absolute -top-2 -right-2 bg-white text-red-400 rounded-full border p-1"><X size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><TypeIcon size={18}/> Types</h3><button type="button" onClick={addFastenerType} className="text-green-600 text-sm font-bold">+ Add</button></div>
                    <div className="space-y-3">
                        {fastenerTypes.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-3 border p-2 rounded-lg bg-gray-50">
                                <div className="w-10 h-10 bg-white rounded border relative overflow-hidden flex items-center justify-center">
                                    {t.image ? <img src={t.image} className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-gray-300"/>}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFastenerTypeUpload(e, idx)} />
                                </div>
                                <input value={t.name} onChange={(e) => updateFastenerType(idx, e.target.value)} placeholder="e.g. Full Thread" className="flex-1 px-3 py-2 border rounded text-sm" />
                                <button type="button" onClick={() => removeFastenerType(idx)} className="text-red-400"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Palette size={18}/> Finishes</h3><button type="button" onClick={addFastenerFinish} className="text-purple-600 text-sm font-bold">+ Add</button></div>
                  <div className="space-y-3">
                    {fastenerFinishes.map((f, idx) => (
                        <div key={idx} className="flex flex-col gap-2 border p-3 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                {/* HEAD ICON UPLOAD */}
                                <div className="flex flex-col items-center gap-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">Head Icon</label>
                                    <div className="w-12 h-12 bg-white rounded-lg border-2 border-dashed relative overflow-hidden flex items-center justify-center">
                                        {f.icon ? <img src={f.icon} className="w-full h-full object-contain p-1"/> : <TypeIcon size={16} className="text-gray-300"/>}
                                        {f.iconLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={12} className="animate-spin"/></div>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFastenerFinishIconUpload(e, idx)} />
                                    </div>
                                </div>

                                {/* FULL IMAGE UPLOAD */}
                                <div className="flex flex-col items-center gap-1">
                                    <label className="text-[9px] font-bold uppercase text-gray-400">Product Image</label>
                                    <div className="w-12 h-12 bg-white rounded-lg border relative overflow-hidden flex items-center justify-center">
                                        {f.image ? <img src={f.image} className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-gray-300"/>}
                                        {f.loading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={12} className="animate-spin"/></div>}
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFastenerFinishUpload(e, idx)} />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Finish Name</label>
                                    <input value={f.name} onChange={(e) => updateFastenerFinishName(idx, e.target.value)} placeholder="e.g. Black Phosphate" className="w-full px-3 py-2 border rounded text-sm" />
                                </div>
                                <button type="button" onClick={() => removeFastenerFinish(idx)} className="text-red-400 self-end mb-2"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
            </div>
        ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200">
                  <div className="flex justify-between items-center mb-6">
                    <div><h3 className="font-bold text-gray-900 flex items-center gap-2"><Layers size={18} className="text-orange-600"/> Variants Configuration</h3></div>
                    <button type="button" onClick={addVariantGroup} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold">+ Add Group</button>
                  </div>
                  <div className="space-y-6">
                    {variantGroups.map((group, groupIdx) => (
                        <div key={group.id} className="border rounded-xl bg-gray-50 overflow-hidden">
                            <div className="p-4 bg-gray-100 border-b flex items-center gap-4">
                                <div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Size Label</label><input value={group.sizeLabel} onChange={(e) => updateGroupSize(groupIdx, e.target.value)} placeholder="e.g. 4 inch" className="w-full px-3 py-2 border rounded font-bold" /></div>
                                <button type="button" onClick={() => removeVariantGroup(groupIdx)} className="text-red-500 p-2"><Trash2 size={18}/></button>
                            </div>
                            <div className="p-4 bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.finishes.map((finish, finishIdx) => (
                                        <div key={finish.id} className="flex items-center gap-3 border p-2 rounded-lg">
                                            <div className="w-12 h-12 bg-gray-100 rounded border relative overflow-hidden flex items-center justify-center">
                                                {finish.image ? <img src={finish.image} className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-gray-300"/>}
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFinishImageUpload(e, groupIdx, finishIdx)} />
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-2">
                                                <input value={finish.name} onChange={(e) => updateFinishName(groupIdx, finishIdx, e.target.value)} placeholder="Finish" className="w-full text-sm border-b" />
                                                <input value={finish.type} onChange={(e) => updateFinishType(groupIdx, finishIdx, e.target.value)} placeholder="Type" className="w-full text-sm border-b" />
                                            </div>
                                            <button type="button" onClick={() => removeFinishFromGroup(groupIdx, finishIdx)} className="text-gray-400"><X size={16}/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addFinishToGroup(groupIdx)} className="text-xs text-blue-600 font-bold">+ Add Variant</button>
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
            </div>
        )}

        {/* 7. Size Images */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="font-bold mb-6 flex items-center gap-2 text-blue-600">
              <ImageIcon size={18} /> Image Configurator (Frontend Buttons)
          </h3>
          <div className="space-y-4">
              {sizeImages.map((si, idx) => (
                  <div key={idx} className="border p-4 bg-gray-50 rounded-lg relative">
                      <input value={si.labels} onChange={(e) => updateSizeImageText(idx, 'labels', e.target.value)} placeholder="Labels (e.g., M1, M2, M3)" className="w-full px-3 py-2 border mb-2 font-bold"/>
                      <input type="file" onChange={(e) => handleSizeImageUpload(e, idx)} className="text-xs" />
                      {si.image && <img src={si.image} className="h-10 mt-2 object-contain" />}
                      <button type="button" onClick={() => removeSizeImage(idx)} className="absolute top-2 right-2 text-red-500"><X size={16}/></button>
                  </div>
              ))}
              <button type="button" onClick={addSizeImage} className="text-sm font-bold text-blue-600">+ Add Button Group</button>
          </div>
        </div>

        {/* 8. Other Specs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-gray-900 flex items-center gap-2"><Settings size={18} /> Other Specs</h3><button type="button" onClick={addSpec} className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded">+ Add Spec</button></div>
              <div className="space-y-3">
                  {formData.specifications.map((spec, idx) => (
                      <div key={idx} className="flex gap-4">
                          <input value={spec.key} onChange={(e) => updateSpec(idx, 'key', e.target.value)} placeholder="Label" className="flex-1 px-3 py-2 border rounded-lg" />
                          <input value={spec.value} onChange={(e) => updateSpec(idx, 'value', e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 border rounded-lg" />
                          <button type="button" onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                  ))}
              </div>
        </div>

        {/* 9. Applications */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
           <div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="font-bold text-gray-900 flex items-center gap-2"><LayoutGrid size={18} /> Applications</h3><button type="button" onClick={addApp} className="text-xs bg-green-100 text-green-800 font-bold px-3 py-1 rounded">+ Add</button></div>
           <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-xs mb-4 flex gap-2"><Info size={16} /><p>Use keywords like "Wood", "Gypsum", "Electrical" in App Name to auto-trigger icons.</p></div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {formData.applications.map((app, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="relative w-14 h-14 bg-white border border-gray-200 rounded flex-shrink-0 flex items-center justify-center overflow-hidden group">
                        {app.image ? (<img src={app.image} className="w-full h-full object-cover" />) : (<ImageIcon size={20} className="text-gray-300" />)}
                        {app.loading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 size={16} className="animate-spin text-green-600"/></div>}
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-white"><Upload size={16} /><input type="file" className="hidden" onChange={(e) => handleAppImageUpload(e, idx)} /></label>
                    </div>
                    <div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">App Name</label><input value={app.name} onChange={(e) => updateAppName(idx, e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></div>
                    <button type="button" onClick={() => removeApp(idx)} className="text-red-400 p-2"><Trash2 size={18}/></button>
                </div>
             ))}
           </div>
        </div>

        {/* 10. FAQs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Info size={18} className="text-blue-600" /> Product FAQs
                </h3>
                <button type="button" onClick={addFaq} className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1">
                    <Plus size={14} /> Add FAQ
                </button>
            </div>
            <div className="space-y-4">
                {formData.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3 relative">
                        <button type="button" onClick={() => removeFaq(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                            <X size={18} />
                        </button>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Question</label>
                            <input 
                                value={faq.question} 
                                onChange={(e) => updateFaq(idx, 'question', e.target.value)} 
                                className="w-full px-3 py-2 border rounded text-sm font-semibold" 
                                placeholder="e.g. Is this screw suitable for coastal environments?"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Answer</label>
                            <textarea 
                                value={faq.answer} 
                                onChange={(e) => updateFaq(idx, 'answer', e.target.value)} 
                                className="w-full px-3 py-2 border rounded text-sm h-20" 
                                placeholder="e.g. Yes, our SS304 grade provides excellent corrosion resistance..."
                            />
                        </div>
                    </div>
                ))}
                {formData.faqs.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm italic">No FAQs added for this product yet.</div>
                )}
            </div>
        </div>

        {/* 11. Gallery */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold mb-4">Product Gallery</h3>
            <div className="flex flex-wrap gap-4">
                {formData.images.map((img, idx) => (
                    <div key={idx} className="w-24 h-24 border rounded overflow-hidden relative group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                            type="button" 
                            onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} 
                            className="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                
                {/* Fixed JSX Syntax Here */}
                <label className="w-24 h-24 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    {uploading ? <Loader2 className="animate-spin" /> : <Upload className="text-gray-400" />}
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
            </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pb-10">
            <button type="submit" disabled={loading} className="bg-black text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                {isEditMode ? 'Update Product' : 'Save Product'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;