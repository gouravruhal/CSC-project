import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Cpu,
  Phone,
  Layers,
  HelpCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Tag
} from 'lucide-react';
import { WebsiteContent, EquipmentItem, ManagedServiceItem } from '../../types';
import { sanitizeText, sanitizePhone, validateSafeUrl } from '../../lib/uiSecurity';

interface AdminWebsiteContentManagerProps {
  adminToken: string;
}

const DEFAULT_CONTENT: WebsiteContent = {
  kendraName: 'MAA VAISHNO e-WORLD CSC CENTRE',
  operatorName: 'Surender Bajwa',
  phone: '+91 9896419275',
  whatsapp: '+91 9896419275',
  email: 'surenderbajwa1@gmail.com',
  address: 'Rairkalan, Panipat, Haryana 132103',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=29.48823169134412,76.83097890513511',
  workingHoursText: 'Monday to Saturday: 8:30 AM to 7:30 PM (Sunday Closed)',
  equipmentList: [
    {
      id: 'eq-1',
      name: 'High-Performance Workstation PC',
      imageUrl: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'eq-2',
      name: 'Heavy-Duty Laser Printer & Copier',
      imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'eq-3',
      name: 'HD Optical Document Scanner',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'eq-4',
      name: 'PVC Smart Card Thermal Printer',
      imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=600&q=80',
    },
  ],
  servicesList: [
    { id: 'srv-1', name: 'Hindi Typing Work', category: 'Typing', isClosed: false },
    { id: 'srv-2', name: 'English Typing Work', category: 'Typing', isClosed: false },
    { id: 'srv-3', name: 'Government Application Drafting', category: 'Typing', isClosed: false },
    { id: 'srv-4', name: 'Rent Agreements & Affidavits', category: 'Typing', isClosed: false },
    { id: 'srv-5', name: 'Black & White Printing', category: 'Printing', isClosed: false },
    { id: 'srv-6', name: 'Colour Laser Printing', category: 'Printing', isClosed: false },
    { id: 'srv-7', name: 'Fast Document Photocopy', category: 'Printing', isClosed: false },
    { id: 'srv-8', name: 'HD Document Scanning', category: 'Printing', isClosed: false },
    { id: 'srv-9', name: 'PVC Smart Card Printing (Aadhaar / PAN)', category: 'Printing', isClosed: false },
    { id: 'srv-10', name: 'Scan to PDF & PDF Merge', category: 'Printing', isClosed: false },
    { id: 'srv-11', name: 'Government Job Recruitment Forms', category: 'Online Forms', isClosed: false },
    { id: 'srv-12', name: 'PAN Card (New & Correction)', category: 'Online Forms', isClosed: false },
    { id: 'srv-13', name: 'PM-Kisan & Ayushman e-KYC', category: 'Online Forms', isClosed: false },
    { id: 'srv-14', name: 'Income, Caste & Domicile Certificates', category: 'Online Forms', isClosed: false },
  ],
  coreServices: [],
  faqs: [
    {
      q: 'Is there any fee to send documents online?',
      a: 'No, sending documents through this portal is completely free. You only pay standard printing or service fees at the counter.',
    },
    {
      q: 'How long does Hindi & English typing work take?',
      a: 'Short letters are typed immediately and multi-page documents are prepared quickly with special attention to accurate spelling and names.',
    },
    {
      q: 'Are my documents safe with Maa Vaishno e-World?',
      a: 'Yes, customer documents are handled with strict confidentiality and encrypted processing.',
    },
    {
      q: 'What are the centre operating hours?',
      a: 'Monday through Saturday from 8:30 AM to 7:30 PM (Sunday Closed).',
    },
  ],
};

export const AdminWebsiteContentManager: React.FC<AdminWebsiteContentManagerProps> = ({ adminToken }) => {
  const [content, setContent] = useState<WebsiteContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [activeSection, setActiveSection] = useState<'equipment' | 'contacts' | 'services' | 'faq'>('equipment');

  // Equipment input states
  const [newEquipName, setNewEquipName] = useState<string>('');
  const [newEquipImageUrl, setNewEquipImageUrl] = useState<string>('');
  const [equipImageUploading, setEquipImageUploading] = useState<boolean>(false);
  const equipFileInputRef = useRef<HTMLInputElement>(null);

  // Services input states
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServiceCategory, setNewServiceCategory] = useState<string>('Typing');
  const [customCategoryInput, setCustomCategoryInput] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [newServiceIsClosed, setNewServiceIsClosed] = useState<boolean>(false);

  // FAQ input states
  const [newFaqQuestion, setNewFaqQuestion] = useState<string>('');
  const [newFaqAnswer, setNewFaqAnswer] = useState<string>('');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/website-content');
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const merged: WebsiteContent = {
            ...DEFAULT_CONTENT,
            ...data.content,
            equipmentList: data.content.equipmentList && data.content.equipmentList.length > 0
              ? data.content.equipmentList
              : DEFAULT_CONTENT.equipmentList,
            servicesList: data.content.servicesList && data.content.servicesList.length > 0
              ? data.content.servicesList
              : DEFAULT_CONTENT.servicesList,
          };
          setContent(merged);
          localStorage.setItem('mv_website_content', JSON.stringify(merged));
          return;
        }
      }
      const cached = localStorage.getItem('mv_website_content');
      if (cached) setContent({ ...DEFAULT_CONTENT, ...JSON.parse(cached) });
    } catch (e) {
      console.error('Failed to fetch website content:', e);
      const cached = localStorage.getItem('mv_website_content');
      if (cached) setContent({ ...DEFAULT_CONTENT, ...JSON.parse(cached) });
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/admin/website-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(content),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update website content');

      localStorage.setItem('mv_website_content', JSON.stringify(content));
      showToast('Website content saved & synchronized with public website!');
    } catch (err: any) {
      console.error('Error saving content:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // --- EQUIPMENT HANDLERS ---
  const handleUploadEquipImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setEquipImageUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/equipment-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload image file');
      const data = await res.json();
      if (data.imageUrl) {
        setNewEquipImageUrl(data.imageUrl);
        showToast('Image uploaded successfully!');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading equipment image');
    } finally {
      setEquipImageUploading(false);
      if (equipFileInputRef.current) equipFileInputRef.current.value = '';
    }
  };

  const handleAddEquipment = () => {
    if (!newEquipName.trim()) {
      setErrorMessage('Please enter an equipment name.');
      return;
    }
    if (!newEquipImageUrl.trim()) {
      setErrorMessage('Please upload a picture or provide an image URL.');
      return;
    }

    const newItem: EquipmentItem = {
      id: 'eq-' + Date.now().toString(36),
      name: newEquipName.trim(),
      imageUrl: newEquipImageUrl.trim(),
    };

    setContent((prev) => ({
      ...prev,
      equipmentList: [...(prev.equipmentList || []), newItem],
    }));

    setNewEquipName('');
    setNewEquipImageUrl('');
    showToast(`Added equipment: ${newItem.name}`);
  };

  const handleRemoveEquipment = (id: string) => {
    setContent((prev) => ({
      ...prev,
      equipmentList: (prev.equipmentList || []).filter((item) => item.id !== id),
    }));
  };

  // --- SERVICES HANDLERS ---
  const handleAddService = () => {
    if (!newServiceName.trim()) {
      setErrorMessage('Please enter a service name.');
      return;
    }

    const category = isCustomCategory ? customCategoryInput.trim() : newServiceCategory.trim();
    if (!category) {
      setErrorMessage('Please select or enter a category.');
      return;
    }

    const newService: ManagedServiceItem = {
      id: 'srv-' + Date.now().toString(36),
      name: newServiceName.trim(),
      category: category || 'Other',
      isClosed: newServiceIsClosed,
    };

    setContent((prev) => ({
      ...prev,
      servicesList: [...(prev.servicesList || []), newService],
    }));

    setNewServiceName('');
    setCustomCategoryInput('');
    setIsCustomCategory(false);
    setNewServiceIsClosed(false);
    showToast(`Added service: ${newService.name}`);
  };

  const handleToggleServiceStatus = (id: string) => {
    setContent((prev) => ({
      ...prev,
      servicesList: (prev.servicesList || []).map((srv) =>
        srv.id === id ? { ...srv, isClosed: !srv.isClosed } : srv
      ),
    }));
  };

  const handleRemoveService = (id: string) => {
    setContent((prev) => ({
      ...prev,
      servicesList: (prev.servicesList || []).filter((srv) => srv.id !== id),
    }));
  };

  // --- FAQ HANDLERS ---
  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setContent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { q: newFaqQuestion.trim(), a: newFaqAnswer.trim() }],
    }));
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleRemoveFaq = (index: number) => {
    setContent((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="container-box p-12 text-center text-xs font-bold text-[var(--color-muted-text)] rounded-2xl border border-[var(--color-border)]">
        Loading website content manager...
      </div>
    );
  }

  const equipmentItems = content.equipmentList || [];
  const servicesItems = content.servicesList || [];

  const renderSaveButton = () => (
    <button
      type="button"
      disabled={saving}
      onClick={handleSave}
      className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all disabled:opacity-50 shrink-0"
    >
      {saving ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5" />
          <span>Save All Changes</span>
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}


      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Content Section Tab Switcher */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
        {[
          { id: 'equipment', label: `1. Center Equipment & Hardware Setup (${equipmentItems.length})`, icon: Cpu },
          { id: 'contacts', label: '2. Contacts, Location & Working Hours', icon: Phone },
          { id: 'services', label: `3. Services Offered (${servicesItems.length} Active)`, icon: Layers },
          { id: 'faq', label: `4. Public FAQs (${content.faqs.length})`, icon: HelpCircle },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                isActive
                  ? 'bg-[#30AFFF] text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="space-y-4">
        
        {/* SECTION 1: Center Equipment & Hardware Setup */}
        {activeSection === 'equipment' && (
          <div className="container-box p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] space-y-5 shadow-xs">
            <div className="border-b border-[var(--color-border)] pb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">
                Center Equipment & Hardware Setup ({equipmentItems.length} Items)
              </h3>
              {renderSaveButton()}
            </div>

            {/* Add New Equipment Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#30AFFF]" />
                <span className="font-extrabold text-xs text-[var(--color-text)]">Add New Equipment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Equipment Name */}
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text)]">Equipment Name *</label>
                  <input
                    type="text"
                    value={newEquipName}
                    onChange={(e) => setNewEquipName(e.target.value)}
                    placeholder="e.g. Laser Duplex Printer, HD Scanner, Workstation PC"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                  />
                </div>

                {/* Picture input (Upload or URL) */}
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text)]">Equipment Photo *</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newEquipImageUrl}
                      onChange={(e) => setNewEquipImageUrl(e.target.value)}
                      placeholder="Paste Image URL or choose file →"
                      className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                    />
                    
                    <input
                      ref={equipFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadEquipImage}
                      className="hidden"
                      id="equipImageUpload"
                    />
                    <label
                      htmlFor="equipImageUpload"
                      className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] hover:border-[#30AFFF] text-xs font-bold text-[var(--color-text)] flex items-center space-x-1.5 cursor-pointer shrink-0 transition-colors"
                      title="Upload photo from device"
                    >
                      {equipImageUploading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#30AFFF]" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-[#30AFFF]" />
                      )}
                      <span>Upload</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Preview & Add Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                {newEquipImageUrl ? (
                  <div className="flex items-center space-x-2 text-xs">
                    <img
                      src={newEquipImageUrl}
                      alt="Preview"
                      className="w-12 h-10 object-cover rounded-lg border border-[var(--color-border)]"
                    />
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Photo ready
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[var(--color-muted-text)] font-semibold">
                    Supported: JPG, PNG, WEBP
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleAddEquipment}
                  className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Equipment</span>
                </button>
              </div>
            </div>

            {/* Current Equipment Grid (Only pic and name) */}
            <div className="space-y-2">
              <span className="font-extrabold text-xs text-[var(--color-text)]">
                Active Setup Items ({equipmentItems.length})
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {equipmentItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] overflow-hidden flex flex-col group relative shadow-2xs hover:border-[#30AFFF]/50 transition-colors"
                  >
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEquipment(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 cursor-pointer shadow-sm transition-colors"
                        title="Remove equipment item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 text-center">
                      <p className="text-xs font-black text-[var(--color-text)] truncate" title={item.name}>
                        {item.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 2: Contacts, Email, Location & Working Hours */}
        {activeSection === 'contacts' && (
          <div className="container-box p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] space-y-4 shadow-xs">
            <div className="border-b border-[var(--color-border)] pb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">
                Contacts, Email, Location & Working Hours
              </h3>
              {renderSaveButton()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[var(--color-text)]">Primary Mobile Number</label>
                <input
                  type="text"
                  value={content.phone}
                  onChange={(e) => setContent({ ...content, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF] font-mono"
                  placeholder="+91 9896419275"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--color-text)]">WhatsApp / Alternate Number</label>
                <input
                  type="text"
                  value={content.whatsapp}
                  onChange={(e) => setContent({ ...content, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF] font-mono"
                  placeholder="+91 9896419275"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[var(--color-text)]">Official Support Email</label>
                <input
                  type="email"
                  value={content.email}
                  onChange={(e) => setContent({ ...content, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                  placeholder="surenderbajwa1@gmail.com"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[var(--color-text)]">Physical Centre Address</label>
                <input
                  type="text"
                  value={content.address}
                  onChange={(e) => setContent({ ...content, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                  placeholder="Opp. Bus Stand, Rairkalan, Panipat, Haryana 132103"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-[var(--color-text)]">Google Maps Location Link</label>
                <input
                  type="text"
                  value={content.mapsUrl}
                  onChange={(e) => setContent({ ...content, mapsUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF] text-xs font-mono"
                  placeholder="https://www.google.com/maps/search/?api=1&query=..."
                />
              </div>

              {/* Working Hours Display */}
              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-[var(--color-border)]">
                <label className="font-bold text-[var(--color-text)]">Working Hours Display Text</label>
                <input
                  type="text"
                  value={content.workingHoursText}
                  onChange={(e) => setContent({ ...content, workingHoursText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                  placeholder="Monday to Saturday: 8:30 AM to 7:30 PM (Sunday Closed)"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Services Offered (Connected to Services Page) */}
        {activeSection === 'services' && (
          <div className="container-box p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] space-y-5 shadow-xs">
            <div className="border-b border-[var(--color-border)] pb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">
                Services Offered ({servicesItems.length} Active in Catalog)
              </h3>
              {renderSaveButton()}
            </div>

            {/* Add Service Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#30AFFF]" />
                <span className="font-extrabold text-xs text-[var(--color-text)]">Add New Service</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Service Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-[var(--color-text)]">Service Name *</label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. PVC Smart Card Printing, Police Verification, Hindi Typing"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
                  />
                </div>

                {/* Service Category */}
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text)]">Category *</label>
                  {!isCustomCategory ? (
                    <div className="flex items-center space-x-1.5">
                      <select
                        value={newServiceCategory}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                          } else {
                            setNewServiceCategory(e.target.value);
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none cursor-pointer font-bold"
                      >
                        <option value="Typing">Typing (टाइपिंग व लेटर)</option>
                        <option value="Printing">Printing (प्रिंटिंग व स्कैनिंग)</option>
                        <option value="Online Forms">Online Forms (सरकारी फॉर्म)</option>
                        <option value="Government Schemes">Government Schemes (योजनाएं)</option>
                        <option value="Other">Other (अन्य सेवाएं)</option>
                        <option value="__custom__">+ Custom Category...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Type new category..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="px-2 py-2 rounded-xl border border-[var(--color-border)] text-[11px] font-bold"
                      >
                        List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Add Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <label htmlFor="serviceClosedCheckbox" className="font-bold text-xs text-[var(--color-text)] flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="serviceClosedCheckbox"
                      checked={newServiceIsClosed}
                      onChange={(e) => setNewServiceIsClosed(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                    <span>Mark as Temporarily Closed</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-4 py-2 rounded-xl bg-[#30AFFF] hover:bg-[#209CEF] text-slate-950 font-black text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all ml-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Service</span>
                </button>
              </div>
            </div>

            {/* Services List with Editable Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[var(--color-text)]">
                  Services Catalog List ({servicesItems.length})
                </span>
                <span className="text-[11px] text-[var(--color-muted-text)] font-semibold">
                  Click status button to toggle Open / Closed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {servicesItems.map((service) => (
                  <div
                    key={service.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 text-xs transition-all ${
                      service.isClosed
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-[var(--bg-primary)] border-[var(--color-border)] hover:border-[#30AFFF]/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-muted-text)] flex items-center space-x-1">
                          <Tag className="w-2.5 h-2.5 text-[#30AFFF]" />
                          <span>{service.category}</span>
                        </span>

                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleServiceStatus(service.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center space-x-1 cursor-pointer transition-all ${
                            service.isClosed
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                          title={service.isClosed ? 'Click to re-open service' : 'Click to mark as temporarily closed'}
                        >
                          {service.isClosed ? (
                            <>
                              <XCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span>Closed</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Active</span>
                            </>
                          )}
                        </button>
                      </div>

                      <h4 className={`text-xs font-black mt-2 leading-snug ${
                        service.isClosed ? 'text-amber-900 dark:text-amber-200 line-through opacity-80' : 'text-[var(--color-text)]'
                      }`}>
                        {service.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]/50">
                      <span className="text-[10px] text-[var(--color-muted-text)] font-semibold">
                        {service.isClosed ? 'Unavailable at counter' : 'Available for upload'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                        title="Delete service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SECTION 4: Frequently Asked Questions (FAQs) */}
        {activeSection === 'faq' && (
          <div className="container-box p-5 sm:p-6 rounded-2xl border border-[var(--color-border)] space-y-4 shadow-xs">
            <div className="border-b border-[var(--color-border)] pb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-[var(--color-text)] uppercase tracking-wide">
                Frequently Asked Questions ({content.faqs.length} Active)
              </h3>
              {renderSaveButton()}
            </div>

            {/* Add FAQ Form */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-2.5 text-xs">
              <span className="font-bold text-[var(--color-text)]">Add New FAQ</span>
              <input
                type="text"
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                placeholder="Question (e.g. Can I submit documents on Sunday?)"
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
              />
              <textarea
                rows={2}
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Answer (e.g. Counter is closed on Sundays, but online uploads are accepted 24/7)..."
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--color-border)] text-xs text-[var(--color-text)] focus:outline-none focus:border-[#30AFFF]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-1.5 rounded-xl bg-[#30AFFF] text-slate-950 text-xs font-black flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ</span>
                </button>
              </div>
            </div>

            {/* Existing FAQs List */}
            <div className="space-y-2.5 pt-1">
              {content.faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--color-border)] space-y-1.5 text-xs relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-extrabold text-[var(--color-text)] leading-snug">
                      Q: {faq.q}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                      title="Remove FAQ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[var(--color-muted-text)] font-normal leading-relaxed">
                    A: {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default AdminWebsiteContentManager;
