import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement, AnnouncementCategory, AnnouncementTargetType, PengumumanSubTab, Student } from '../types';
import { formatIndonesianDayAndDate, getTimezoneIana } from '../utils/formatters';
import { 
  Megaphone, PlusCircle, Search, Filter, Trash2, Edit3, Pin, 
  Send, Users, CheckCircle2, AlertTriangle, Info, Sparkles, 
  Calendar, Clock, Eye, ChevronRight, UserCheck, ShieldAlert, 
  Share2, ArrowLeft, RefreshCw, Layers, Bell, CheckSquare, Square,
  Flame, ExternalLink, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PengumumanView: React.FC = () => {
  const { 
    announcements, 
    students, 
    settings, 
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement, 
    activeSubTabs, 
    setActiveSubTab,
    showToast 
  } = useApp();

  const currentSubTab = (activeSubTabs['Pengumuman'] || 'daftar-pengumuman') as PengumumanSubTab;

  // State untuk form Buat / Edit Broadcast
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('info');
  const [formTargetType, setFormTargetType] = useState<AnnouncementTargetType>('all');
  const [formTargetClasses, setFormTargetClasses] = useState<string[]>([]);
  const [formTargetStudentIds, setFormTargetStudentIds] = useState<string[]>([]);
  const [formAuthorName, setFormAuthorName] = useState(settings.namaGuru || settings.sekolah || 'Administrator');
  const [formAuthorRole, setFormAuthorRole] = useState('Guru / Admin');
  const [formPriority, setFormPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formAttachmentUrl, setFormAttachmentUrl] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState('');

  // State pencarian & filter untuk Daftar Pengumuman
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTarget, setFilterTarget] = useState<string>('all');

  // State untuk Riwayat Penerima
  const [selectedAnnouncementForRecipients, setSelectedAnnouncementForRecipients] = useState<string | null>(null);
  const [recipientFilterStatus, setRecipientFilterStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [recipientSearch, setRecipientSearch] = useState('');

  // State student search modal / picker saat target 'student'
  const [studentPickerSearch, setStudentPickerSearch] = useState('');

  // Daftar seluruh kelas unik dari database siswa
  const availableClasses = useMemo(() => {
    const setCls = new Set<string>();
    students.forEach(s => {
      if (s.class) setCls.add(s.class);
    });
    return Array.from(setCls).sort();
  }, [students]);

  // Handle inisialisasi form edit
  const handleStartEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormTargetType(ann.targetType);
    setFormTargetClasses(ann.targetClasses || []);
    setFormTargetStudentIds(ann.targetStudentIds || []);
    setFormAuthorName(ann.authorName);
    setFormAuthorRole(ann.authorRole || 'Guru / Admin');
    setFormPriority(ann.priority || 'normal');
    setFormIsPinned(ann.isPinned || false);
    setFormAttachmentUrl(ann.attachmentUrl || '');
    setFormAttachmentName(ann.attachmentName || '');
    setActiveSubTab('Pengumuman', 'buat-broadcast');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('info');
    setFormTargetType('all');
    setFormTargetClasses([]);
    setFormTargetStudentIds([]);
    setFormAuthorName(settings.namaGuru || settings.sekolah || 'Administrator');
    setFormAuthorRole('Guru / Admin');
    setFormPriority('normal');
    setFormIsPinned(false);
    setFormAttachmentUrl('');
    setFormAttachmentName('');
  };

  const handleSubmitBroadcast = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Judul pengumuman tidak boleh kosong.', 'warning');
      return;
    }
    if (!formContent.trim()) {
      showToast('Isi pesan broadcast tidak boleh kosong.', 'warning');
      return;
    }
    if (formTargetType === 'class' && formTargetClasses.length === 0) {
      showToast('Pilih minimal satu kelas tujuan broadcast.', 'warning');
      return;
    }
    if (formTargetType === 'student' && formTargetStudentIds.length === 0) {
      showToast('Pilih minimal satu siswa tujuan pesan khusus.', 'warning');
      return;
    }

    // Ambil nama siswa tujuan untuk preview cepat
    const targetStudentNames = formTargetType === 'student'
      ? students.filter(s => formTargetStudentIds.includes(s.id)).map(s => `${s.name} (${s.class})`)
      : [];

    if (editingId) {
      updateAnnouncement(editingId, {
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        targetType: formTargetType,
        targetClasses: formTargetType === 'class' ? formTargetClasses : [],
        targetStudentIds: formTargetType === 'student' ? formTargetStudentIds : [],
        targetStudentNames,
        authorName: formAuthorName.trim() || 'Administrator',
        authorRole: formAuthorRole.trim() || 'Guru / Admin',
        priority: formPriority,
        isPinned: formIsPinned,
        attachmentUrl: formAttachmentUrl.trim() || undefined,
        attachmentName: formAttachmentName.trim() || undefined
      });
      showToast('Pengumuman berhasil diperbarui.', 'success');
    } else {
      addAnnouncement({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        targetType: formTargetType,
        targetClasses: formTargetType === 'class' ? formTargetClasses : [],
        targetStudentIds: formTargetType === 'student' ? formTargetStudentIds : [],
        targetStudentNames,
        authorName: formAuthorName.trim() || 'Administrator',
        authorRole: formAuthorRole.trim() || 'Guru / Admin',
        priority: formPriority,
        isPinned: formIsPinned,
        attachmentUrl: formAttachmentUrl.trim() || undefined,
        attachmentName: formAttachmentName.trim() || undefined,
        readBy: {}
      });
    }

    handleResetForm();
    setActiveSubTab('Pengumuman', 'daftar-pengumuman');
  };

  const toggleClassSelection = (cls: string) => {
    setFormTargetClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const toggleStudentSelection = (stId: string) => {
    setFormTargetStudentIds(prev => 
      prev.includes(stId) ? prev.filter(id => id !== stId) : [...prev, stId]
    );
  };

  const selectAllClassStudents = (cls: string) => {
    const classStudentIds = students.filter(s => s.class === cls).map(s => s.id);
    const allSelected = classStudentIds.every(id => formTargetStudentIds.includes(id));
    if (allSelected) {
      setFormTargetStudentIds(prev => prev.filter(id => !classStudentIds.includes(id)));
    } else {
      setFormTargetStudentIds(prev => Array.from(new Set([...prev, ...classStudentIds])));
    }
  };

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchQuery = !q || 
        ann.title.toLowerCase().includes(q) || 
        ann.content.toLowerCase().includes(q) || 
        ann.authorName.toLowerCase().includes(q);

      // Filter Category
      const matchCat = filterCategory === 'all' || ann.category === filterCategory;

      // Filter Target
      let matchTarget = true;
      if (filterTarget === 'all_classes') {
        matchTarget = ann.targetType === 'all';
      } else if (filterTarget === 'specific_class') {
        matchTarget = ann.targetType === 'class';
      } else if (filterTarget === 'student_only') {
        matchTarget = ann.targetType === 'student';
      } else if (filterTarget !== 'all') {
        matchTarget = (ann.targetClasses || []).includes(filterTarget);
      }

      return matchQuery && matchCat && matchTarget;
    });
  }, [announcements, searchQuery, filterCategory, filterTarget]);

  // Kategori helper
  const getCategoryMeta = (cat: AnnouncementCategory) => {
    switch (cat) {
      case 'darurat':
        return { label: 'Darurat / Mendesak', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: ShieldAlert };
      case 'penting':
        return { label: 'Penting', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: AlertTriangle };
      case 'akademik':
        return { label: 'Akademik & Ujian', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: Sparkles };
      case 'kegiatan':
        return { label: 'Kegiatan Sekolah', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Calendar };
      default:
        return { label: 'Informasi Umum', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Info };
    }
  };

  // Helper menghitung total audiens target per pengumuman
  const getTargetStudentsForAnnouncement = (ann: Announcement): Student[] => {
    if (ann.targetType === 'all') {
      return students;
    }
    if (ann.targetType === 'class') {
      return students.filter(s => (ann.targetClasses || []).includes(s.class));
    }
    if (ann.targetType === 'student') {
      return students.filter(s => (ann.targetStudentIds || []).includes(s.id) || (ann.targetStudentIds || []).includes(s.nisn));
    }
    return [];
  };

  // Selected announcement for recipient tracking
  const activeSelectedAnn = useMemo(() => {
    if (!selectedAnnouncementForRecipients && announcements.length > 0) {
      return announcements[0];
    }
    return announcements.find(a => a.id === selectedAnnouncementForRecipients) || announcements[0] || null;
  }, [selectedAnnouncementForRecipients, announcements]);

  // Recipient list calculations
  const recipientData = useMemo(() => {
    if (!activeSelectedAnn) return { targetStudents: [], readCount: 0, unreadCount: 0, list: [] };
    const targetStudents = getTargetStudentsForAnnouncement(activeSelectedAnn);
    const readByMap = activeSelectedAnn.readBy || {};

    const list = targetStudents.map(st => {
      const readInfo = readByMap[st.id] || readByMap[st.nisn] || null;
      return {
        student: st,
        isRead: Boolean(readInfo),
        readAt: readInfo?.readAt || null
      };
    });

    const readCount = list.filter(item => item.isRead).length;
    const unreadCount = list.length - readCount;

    return {
      targetStudents,
      readCount,
      unreadCount,
      list
    };
  }, [activeSelectedAnn, students]);

  // Filter recipient list
  const filteredRecipientList = useMemo(() => {
    return recipientData.list.filter(item => {
      const q = recipientSearch.toLowerCase();
      const matchSearch = !q || 
        item.student.name.toLowerCase().includes(q) || 
        item.student.nisn.includes(q) || 
        item.student.class.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (recipientFilterStatus === 'read') return item.isRead;
      if (recipientFilterStatus === 'unread') return !item.isRead;
      return true;
    });
  }, [recipientData, recipientSearch, recipientFilterStatus]);

  return (
    <div id="view-pengumuman" className="space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="subtab-daftar-pengumuman"
            onClick={() => setActiveSubTab('Pengumuman', 'daftar-pengumuman')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              currentSubTab === 'daftar-pengumuman'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Daftar Pengumuman ({announcements.length})</span>
          </button>

          <button
            id="subtab-buat-broadcast"
            onClick={() => {
              if (currentSubTab !== 'buat-broadcast') handleResetForm();
              setActiveSubTab('Pengumuman', 'buat-broadcast');
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              currentSubTab === 'buat-broadcast'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{editingId ? 'Edit Broadcast' : 'Buat Broadcast Baru'}</span>
          </button>

          <button
            id="subtab-riwayat-penerima"
            onClick={() => setActiveSubTab('Pengumuman', 'riwayat-penerima')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              currentSubTab === 'riwayat-penerima'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Status & Rekap Penerima</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Zona Waktu: <strong className="text-blue-600 dark:text-blue-400 font-bold">{settings.timezone || 'WIB'}</strong></span>
          </div>

          {currentSubTab === 'daftar-pengumuman' && (
            <button
              id="btn-quick-new-broadcast"
              onClick={() => {
                handleResetForm();
                setActiveSubTab('Pengumuman', 'buat-broadcast');
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tulis Pengumuman</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: DAFTAR PENGUMUMAN & ARSIP                                       */}
      {/* ========================================================================= */}
      {currentSubTab === 'daftar-pengumuman' && (
        <div className="space-y-6">
          {/* Header Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Pengumuman</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{announcements.length}</p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Broadcast Seluruh Kelas</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {announcements.filter(a => a.targetType === 'all').length}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Broadcast Kelas Spesifik</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {announcements.filter(a => a.targetType === 'class').length}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pesan Khusus Siswa</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {announcements.filter(a => a.targetType === 'student').length}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-announcements"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari judul, isi, atau penulis..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Category Filter */}
              <select
                id="filter-announcement-category"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="info">Informasi Umum</option>
                <option value="penting">Penting</option>
                <option value="darurat">Darurat / Mendesak</option>
                <option value="akademik">Akademik & Ujian</option>
                <option value="kegiatan">Kegiatan Sekolah</option>
              </select>

              {/* Target Audience Filter */}
              <select
                id="filter-announcement-target"
                value={filterTarget}
                onChange={e => setFilterTarget(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Sasaran</option>
                <option value="all_classes">Hanya Semua Kelas</option>
                <option value="specific_class">Hanya Kelas Spesifik</option>
                <option value="student_only">Hanya Pesan Perorangan</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>Kelas: {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Announcements Card Grid */}
          {filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <Megaphone className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Belum Ada Pengumuman</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Kirimkan pengumuman baru untuk memberikan informasi langsung ke siswa atau kelas tertentu.
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveSubTab('Pengumuman', 'buat-broadcast');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Broadcast Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAnnouncements.map(ann => {
                const catMeta = getCategoryMeta(ann.category);
                const CatIcon = catMeta.icon;
                const targetStudents = getTargetStudentsForAnnouncement(ann);
                const readCount = Object.keys(ann.readBy || {}).length;
                const targetCount = targetStudents.length || 1;
                const readPercentage = Math.round((readCount / targetCount) * 100);

                return (
                  <motion.div
                    key={ann.id}
                    id={`announcement-card-${ann.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-slate-800/90 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      ann.isPinned
                        ? 'border-indigo-400 dark:border-indigo-500/60 ring-1 ring-indigo-400/30'
                        : 'border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${catMeta.color}`}>
                            <CatIcon className="w-3 h-3" />
                            {catMeta.label}
                          </span>

                          {ann.isPinned && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                              <Pin className="w-3 h-3" /> Disematkan
                            </span>
                          )}

                          {ann.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Mendesak
                            </span>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                          <span>{formatIndonesianDayAndDate(ann.date).fullString}</span>
                          <span>•</span>
                          <span>Pukul {ann.time} {settings.timezone || 'WIB'}</span>
                        </div>
                      </div>

                      {/* Title & Audience */}
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-1">
                        {ann.title}
                      </h4>

                      {/* Target Indicator */}
                      <div className="mb-3 text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                        <span>Sasaran: </span>
                        {ann.targetType === 'all' && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                            Seluruh Siswa (Semua Kelas)
                          </span>
                        )}
                        {ann.targetType === 'class' && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                            Kelas: {(ann.targetClasses || []).join(', ')}
                          </span>
                        )}
                        {ann.targetType === 'student' && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                            {ann.targetStudentNames?.length || (ann.targetStudentIds || []).length} Siswa Pilihan
                          </span>
                        )}
                      </div>

                      {/* Snippet Content */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3">
                        {ann.content}
                      </p>

                      {/* Attachment Tag if any */}
                      {ann.attachmentUrl && (
                        <div className="mb-3 flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="truncate">{ann.attachmentName || 'Tautan Lampiran Dokumen'}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      {/* Reader Progress Bar */}
                      <button
                        onClick={() => {
                          setSelectedAnnouncementForRecipients(ann.id);
                          setActiveSubTab('Pengumuman', 'riwayat-penerima');
                        }}
                        className="group flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
                        title="Klik untuk lihat detail rekap penerima"
                      >
                        <div className="w-20 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              readPercentage >= 80 ? 'bg-emerald-500' : readPercentage >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, readPercentage)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-blue-600">
                          {readCount}/{targetCount} Siswa ({readPercentage}%)
                        </span>
                      </button>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-pin-${ann.id}`}
                          onClick={() => updateAnnouncement(ann.id, { isPinned: !ann.isPinned })}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            ann.isPinned
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200'
                              : 'text-slate-400 hover:text-slate-600 border-transparent hover:border-slate-200'
                          }`}
                          title={ann.isPinned ? 'Lepas Sematan' : 'Sematkan di Atas'}
                        >
                          <Pin className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-edit-${ann.id}`}
                          onClick={() => handleStartEdit(ann)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Edit Pengumuman"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-delete-${ann.id}`}
                          onClick={() => {
                            if (window.confirm(`Hapus pengumuman "${ann.title}"?`)) {
                              deleteAnnouncement(ann.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-view-recipients-${ann.id}`}
                          onClick={() => {
                            setSelectedAnnouncementForRecipients(ann.id);
                            setActiveSubTab('Pengumuman', 'riwayat-penerima');
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Penerima</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: BUAT BROADCAST / PESAN BARU                                     */}
      {/* ========================================================================= */}
      {currentSubTab === 'buat-broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSubmitBroadcast} className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingId ? 'Edit Pengumuman / Broadcast' : 'Buat Broadcast & Pengumuman Baru'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Informasi akan langsung tampil sebagai popup di portal siswa saat login pertama kali.
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Judul Pengumuman *
                </label>
                <input
                  id="input-broadcast-title"
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Misal: Jadwal Penilaian Akhir Semester (PAS) Ganjil"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Kategori Informasi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['info', 'penting', 'darurat', 'akademik', 'kegiatan'] as AnnouncementCategory[]).map(cat => {
                    const meta = getCategoryMeta(cat);
                    const Icon = meta.icon;
                    const isSelected = formCategory === cat;

                    return (
                      <button
                        type="button"
                        key={cat}
                        id={`btn-cat-${cat}`}
                        onClick={() => setFormCategory(cat)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience Selector (Pilihan Sasaran) */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>Sasaran Penerima Broadcast *</span>
                  <span className="text-[11px] font-normal text-slate-500 lowercase">
                    (Semua kelas atau pilih perorangan jika pesan berbeda)
                  </span>
                </label>

                {/* 3 Main Choice Radios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    id="target-choice-all"
                    onClick={() => setFormTargetType('all')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetType === 'all'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <Layers className="w-4 h-4" />
                      <span>Semua Kelas</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${formTargetType === 'all' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Broadcast ke seluruh siswa sekolah
                    </p>
                  </button>

                  <button
                    type="button"
                    id="target-choice-class"
                    onClick={() => setFormTargetType('class')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetType === 'class'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <Users className="w-4 h-4" />
                      <span>Kelas Tertentu</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${formTargetType === 'class' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Pilih satu atau beberapa kelas
                    </p>
                  </button>

                  <button
                    type="button"
                    id="target-choice-student"
                    onClick={() => setFormTargetType('student')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formTargetType === 'student'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      <UserCheck className="w-4 h-4" />
                      <span>Siswa Tertentu</span>
                    </div>
                    <p className={`text-[11px] mt-1 ${formTargetType === 'student' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Pesan khusus personal / privat
                    </p>
                  </button>
                </div>

                {/* Sub-Selection: If Specific Class is selected */}
                {formTargetType === 'class' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Centang Kelas yang Akan Menerima Broadcast:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableClasses.map(cls => {
                        const isChecked = formTargetClasses.includes(cls);
                        const classCount = students.filter(s => s.class === cls).length;

                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => toggleClassSelection(cls)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                              isChecked
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            <span>{cls}</span>
                            <span className={`text-[10px] px-1 rounded ${isChecked ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                              {classCount} siswa
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Selection: If Specific Student is selected */}
                {formTargetType === 'student' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pilih Siswa Penerima ({formTargetStudentIds.length} dipilih):
                      </p>
                      <div className="relative w-48">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentPickerSearch}
                          onChange={e => setStudentPickerSearch(e.target.value)}
                          placeholder="Cari nama / NISN..."
                          className="w-full pl-8 pr-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Student List Matrix */}
                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      {students
                        .filter(s => {
                          const q = studentPickerSearch.toLowerCase();
                          return !q || s.name.toLowerCase().includes(q) || s.nisn.includes(q) || s.class.toLowerCase().includes(q);
                        })
                        .map(st => {
                          const isSelected = formTargetStudentIds.includes(st.id);
                          return (
                            <button
                              type="button"
                              key={st.id}
                              onClick={() => toggleStudentSelection(st.id)}
                              className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                <span className="truncate">{st.name}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 flex-shrink-0 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-2">
                                {st.class} • {st.nisn}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Isi Pesan Pengumuman *
                </label>
                <textarea
                  id="input-broadcast-content"
                  rows={5}
                  required
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman, instruksi tugas, pengingat kegiatan, atau informasi penting di sini..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-normal"
                />
              </div>

              {/* Author & Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Nama Penulis / Guru
                  </label>
                  <input
                    type="text"
                    value={formAuthorName}
                    onChange={e => setFormAuthorName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Peran / Jabatan
                  </label>
                  <input
                    type="text"
                    value={formAuthorRole}
                    onChange={e => setFormAuthorRole(e.target.value)}
                    placeholder="Misal: Guru Informatika / Wali Kelas"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* Attachment Link & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Tautan Dokumen / URL Lampiran (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formAttachmentUrl}
                    onChange={e => setFormAttachmentUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau https://..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-pinned"
                    checked={formIsPinned}
                    onChange={e => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="chk-pinned" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Sematkan di Atas (Pinned)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tingkat Urgensi:
                  </label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Penting (Tinggi)</option>
                    <option value="urgent">Mendesak / Darurat</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  id="btn-submit-broadcast"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Kirim & Broadcast Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Pratinjau Tampilan Popup Siswa</span>
              </div>

              {/* Mock Student Popup Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
                {/* Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded-full">
                      Pengumuman Terbaru
                    </span>
                    {formIsPinned && (
                      <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                        PINNED
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold mt-1 leading-snug line-clamp-2">
                    {formTitle || 'Judul Pengumuman Akan Ditampilkan di Sini'}
                  </h4>
                  <p className="text-[11px] text-blue-100 mt-1 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    {formTargetType === 'all' 
                      ? 'Seluruh Siswa & Kelas' 
                      : formTargetType === 'class' 
                        ? `Kelas: ${formTargetClasses.join(', ') || 'Belum dipilih'}`
                        : `${formTargetStudentIds.length} Siswa Pilihan`}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Oleh: <strong>{formAuthorName || 'Administrator'}</strong></span>
                    <span>Hari Ini • Baru saja</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[80px]">
                    {formContent || 'Isi teks pengumuman yang diketik akan muncul di sini...'}
                  </p>

                  {formAttachmentUrl && (
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                      <span className="truncate">Tautan Lampiran Dokumen</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <div className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 opacity-90">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Saya Mengerti</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Popup otomatis muncul saat siswa login / buka portal pertama kali.</p>
                <p>• Setelah siswa klik &quot;Saya Mengerti&quot;, popup <strong>tidak akan muncul lagi</strong> pada login berikutnya.</p>
                <p>• Pesan tetap dapat diakses siswa kapan saja di sub menu Pengumuman.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: STATUS & REKAP PENERIMA                                         */}
      {/* ========================================================================= */}
      {currentSubTab === 'riwayat-penerima' && (
        <div className="space-y-6">
          {/* Announcement Chooser Card */}
          <div className="p-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pilih Pengumuman yang Dipantau:
              </label>
              <select
                id="select-active-announcement-recipient"
                value={activeSelectedAnn?.id || ''}
                onChange={e => setSelectedAnnouncementForRecipients(e.target.value)}
                className="w-full md:w-96 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              >
                {announcements.map(ann => (
                  <option key={ann.id} value={ann.id}>
                    [{ann.date}] {ann.title}
                  </option>
                ))}
              </select>
            </div>

            {activeSelectedAnn && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  Sasaran: <strong>{activeSelectedAnn.targetType === 'all' ? 'Semua Kelas' : activeSelectedAnn.targetType === 'class' ? (activeSelectedAnn.targetClasses || []).join(', ') : 'Personal'}</strong>
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {formatIndonesianDayAndDate(activeSelectedAnn.date).fullString} • Pukul {activeSelectedAnn.time} {settings.timezone || 'WIB'}
                </span>
              </div>
            )}
          </div>

          {/* Stats Breakdown Cards */}
          {activeSelectedAnn && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Target Siswa</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {recipientData.targetStudents.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sudah Membaca</span>
                </p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {recipientData.readCount} <span className="text-xs font-normal text-slate-500">
                    ({Math.round((recipientData.readCount / (recipientData.targetStudents.length || 1)) * 100)}%)
                  </span>
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Belum Membaca (Menunggu Login)</span>
                </p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {recipientData.unreadCount} <span className="text-xs font-normal text-slate-500">
                    ({Math.round((recipientData.unreadCount / (recipientData.targetStudents.length || 1)) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Recipient Filter Toolbar */}
          <div className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setRecipientFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  recipientFilterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Semua Siswa ({recipientData.list.length})
              </button>

              <button
                onClick={() => setRecipientFilterStatus('read')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  recipientFilterStatus === 'read'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Sudah Dibaca ({recipientData.readCount})
              </button>

              <button
                onClick={() => setRecipientFilterStatus('unread')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  recipientFilterStatus === 'unread'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Belum Dibaca ({recipientData.unreadCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recipientSearch}
                onChange={e => setRecipientSearch(e.target.value)}
                placeholder="Filter nama, NISN, kelas..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Recipient Table */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">No</th>
                    <th className="p-3.5">Nama Siswa</th>
                    <th className="p-3.5">NISN</th>
                    <th className="p-3.5">Kelas</th>
                    <th className="p-3.5">Status Pembaca</th>
                    <th className="p-3.5">Waktu Membaca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecipientList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada siswa pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRecipientList.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30">
                        <td className="p-3.5 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">{item.student.name}</td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{item.student.nisn}</td>
                        <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">{item.student.class}</td>
                        <td className="p-3.5">
                          {item.isRead ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Sudah Dibaca
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              Menunggu Buka
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {item.readAt ? (
                            new Date(item.readAt).toLocaleString('id-ID', {
                              timeZone: getTimezoneIana(settings.timezone),
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }).replace(/\./g, ':') + ` ${settings.timezone || 'WIB'}`
                          ) : (
                            <span className="text-slate-400 italic">Belum dibuka</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
