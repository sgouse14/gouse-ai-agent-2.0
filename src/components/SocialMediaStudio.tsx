import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  Camera,
  Film,
  Play,
  Pause,
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  Check,
  Copy,
  ExternalLink,
  Trash2,
  Sparkles,
  Phone,
  MessageSquare,
  Globe,
  Send,
  Heart,
  ShieldCheck,
  Building2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Megaphone,
  Briefcase,
  X,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkle,
  Radio,
} from 'lucide-react';
import { Project, SocialMediaItem } from '../types';

// Import local project assets for instant out-of-the-box rich visuals
import villaExteriorImg from '../assets/images/bangalore_house_exterior_1790170528532.jpg';
import siteFramingImg from '../assets/images/bangalore_builder_proj1_1790170892084.jpg';
import villaElevationImg from '../assets/images/bangalore_builder_proj2_1790170907606.jpg';
import columnGridImg from '../assets/images/bangalore_builder_proj3_1790170920758.jpg';
import courtyardInteriorImg from '../assets/images/pg_dining_lounge_1790170229065.jpg';
import masterSuiteImg from '../assets/images/pg_bedroom_suite_1790170216460.jpg';

// Pre-seeded high quality sample videos (working HTML5 open video streams)
const SAMPLE_WALKTHROUGH_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-living-room-41381-large.mp4';
const SAMPLE_DRONE_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-modern-city-buildings-42795-large.mp4';

export const INITIAL_SOCIAL_MEDIA_ITEMS: SocialMediaItem[] = [
  {
    id: 'media-1',
    type: 'video',
    title: '3D Lumion Architectural Walkthrough • Biophilic Living & Courtyard',
    caption: 'Step inside the biophilic double-height courtyard featuring NBC 2016 solar passive daylighting and bespoke teak louvers. Designed and executed by Ar. S. Gouse.',
    url: SAMPLE_WALKTHROUGH_VIDEO,
    thumbnailUrl: courtyardInteriorImg,
    fileName: 'lumion_3d_walkthrough_4k.mp4',
    fileSize: '42.8 MB',
    dimensions: '1920x1080 (Full HD 60fps)',
    aspectRatio: '16:9',
    duration: '02:14',
    platform: 'youtube',
    category: '3d_walkthrough',
    uploadedAt: 'Today at 09:30 AM',
    architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
    tags: ['#3DWalkthrough', '#LumionArchitecture', '#NBC2016', '#TurnkeyConstruction', '#BangaloreArchitects'],
    likesCount: 142,
    viewsCount: 2840,
    isFeatured: true,
  },
  {
    id: 'media-2',
    type: 'photo',
    title: 'Signature Front Elevation & Cantilevered Balconies',
    caption: 'Evening twilight elevation render showcasing wire-cut exposed brickwork, textured slate cladding, and integrated acoustic double-glazed fenestrations.',
    url: villaExteriorImg,
    thumbnailUrl: villaExteriorImg,
    fileName: 'signature_villa_exterior_twilight.jpg',
    fileSize: '4.8 MB',
    dimensions: '3840x2160 (4K UHD)',
    aspectRatio: '1:1',
    platform: 'instagram',
    category: 'site_elevation',
    uploadedAt: 'Yesterday',
    architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
    tags: ['#LuxuryVilla', '#ModernElevation', '#BangaloreArchitecture', '#FacadeEngineering', '#ArchitecturalDesign'],
    likesCount: 389,
    viewsCount: 4520,
    isFeatured: true,
  },
  {
    id: 'media-3',
    type: 'video',
    title: 'Drone Aerial Survey & Setback Verification Reel',
    caption: 'High-altitude drone sweep validating ADS setbacks (2.5ft front, 2.0ft side yards) compliant with BBMP and NBC 2016 residential building bylaws.',
    url: SAMPLE_DRONE_VIDEO,
    thumbnailUrl: siteFramingImg,
    fileName: 'drone_aerial_setbacks_reel.mp4',
    fileSize: '28.4 MB',
    dimensions: '1080x1920 (Vertical 9:16 Reel)',
    aspectRatio: '9:16',
    duration: '00:54',
    platform: 'instagram',
    category: 'drone_aerial',
    uploadedAt: '2 days ago',
    architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
    tags: ['#DroneReel', '#InstagramReel', '#SiteSetbacks', '#CivilEngineering', '#DroneSurvey'],
    likesCount: 512,
    viewsCount: 8900,
    isFeatured: false,
  },
  {
    id: 'media-4',
    type: 'photo',
    title: 'RCC Column Grid & Slab Reinforcement Inspection',
    caption: 'M25 design-mix concrete casting with Jindal Panther Fe550D TMT reinforcement, cover block placement, and pre-pour structural lead verification.',
    url: columnGridImg,
    thumbnailUrl: columnGridImg,
    fileName: 'rcc_slab_casting_day42.jpg',
    fileSize: '3.9 MB',
    dimensions: '2560x1440 (2K QHD)',
    aspectRatio: '16:9',
    platform: 'facebook',
    category: 'slab_casting',
    uploadedAt: '3 days ago',
    architectAttribution: 'Er. Ramesh Babu & Ar. S. Gouse',
    tags: ['#StructuralEngineering', '#RCCFraming', '#ConcreteSlab', '#JindalPanther', '#QualityControl'],
    likesCount: 178,
    viewsCount: 1940,
    isFeatured: false,
  },
  {
    id: 'media-5',
    type: 'photo',
    title: 'Master Bedroom Suite & Teak Louver Terraces',
    caption: 'Interior styling with concealed ambient LED coves, Italian marble floor takeoffs, and panoramic sliding pocket doors opening to private planters.',
    url: masterSuiteImg,
    thumbnailUrl: masterSuiteImg,
    fileName: 'master_bedroom_interior_suite.jpg',
    fileSize: '5.1 MB',
    dimensions: '3000x2000',
    aspectRatio: '4:5',
    platform: 'all',
    category: 'interior_design',
    uploadedAt: '4 days ago',
    architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
    tags: ['#InteriorArchitecture', '#MasterSuite', '#LuxuryInteriors', '#BiophilicHomes', '#IndianArchitects'],
    likesCount: 265,
    viewsCount: 3120,
    isFeatured: false,
  },
  {
    id: 'media-6',
    type: 'photo',
    title: 'Turnkey Villa Superstructure Framing Milestone',
    caption: 'G+3 framing milestone completed on schedule with zero cost escalation. Turnkey architectural consultation and contractor execution.',
    url: villaElevationImg,
    thumbnailUrl: villaElevationImg,
    fileName: 'turnkey_superstructure_g3.jpg',
    fileSize: '4.2 MB',
    dimensions: '3200x2400',
    aspectRatio: '16:9',
    platform: 'facebook',
    category: 'site_elevation',
    uploadedAt: '5 days ago',
    architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
    tags: ['#TurnkeyConstruction', '#VillaMilestone', '#BangaloreBuilders', '#HandoverReady'],
    likesCount: 210,
    viewsCount: 2780,
    isFeatured: false,
  },
];

interface SocialMediaStudioProps {
  activeProject: Project;
  onOpenWorkflowEngine?: () => void;
}

export const SocialMediaStudio: React.FC<SocialMediaStudioProps> = ({
  activeProject,
  onOpenWorkflowEngine,
}) => {
  // Navigation & Sub-mode tabs
  const [activeSubMode, setActiveSubMode] = useState<'gallery' | 'channels' | 'ads' | 'wall'>('gallery');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'instagram' | 'facebook' | 'youtube' | 'linkedin'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Media Library state (synced with localStorage)
  const [mediaItems, setMediaItems] = useState<SocialMediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('gouse_ai_social_media_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_SOCIAL_MEDIA_ITEMS;
    } catch {
      return INITIAL_SOCIAL_MEDIA_ITEMS;
    }
  });

  // Save to localStorage whenever mediaItems changes
  useEffect(() => {
    try {
      localStorage.setItem('gouse_ai_social_media_library', JSON.stringify(mediaItems));
    } catch (err) {
      console.warn('LocalStorage limit reached or error saving media library:', err);
    }
  }, [mediaItems]);

  // Active showcase media (the selected photo or video synced across mockups)
  const [activeMediaId, setActiveMediaId] = useState<string>(() => {
    return mediaItems[0]?.id || 'media-1';
  });

  const activeMedia = mediaItems.find((m) => m.id === activeMediaId) || mediaItems[0] || INITIAL_SOCIAL_MEDIA_ITEMS[0];

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSourceMode, setUploadSourceMode] = useState<'file' | 'url' | 'sample'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload Form Fields
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadAspectRatio, setUploadAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [uploadPlatform, setUploadPlatform] = useState<'all' | 'instagram' | 'facebook' | 'youtube' | 'linkedin'>('all');
  const [uploadCategory, setUploadCategory] = useState<SocialMediaItem['category']>('3d_walkthrough');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('');
  const [uploadDimensions, setUploadDimensions] = useState('');
  const [uploadDuration, setUploadDuration] = useState('01:30');
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // Full Lightbox / Theater Modal
  const [lightboxItem, setLightboxItem] = useState<SocialMediaItem | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const theaterVideoRef = useRef<HTMLVideoElement>(null);

  // Video Player in Mockup States
  const [isPlayingYouTube, setIsPlayingYouTube] = useState(false);
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [isPlayingFeedVideo, setIsPlayingFeedVideo] = useState(false);
  const [reelLikes, setReelLikes] = useState<number>(1284);
  const [hasLikedReel, setHasLikedReel] = useState<boolean>(false);

  // Social Channels state (Instagram / Facebook / YouTube)
  const [socialPlatformFocus, setSocialPlatformFocus] = useState<'all' | 'instagram' | 'facebook' | 'youtube'>('all');
  const [instagramFormat, setInstagramFormat] = useState<'reel' | 'post' | 'carousel'>('reel');
  const [copiedInstagramKit, setCopiedInstagramKit] = useState(false);
  const [copiedFacebookKit, setCopiedFacebookKit] = useState(false);
  const [copiedYouTubeKit, setCopiedYouTubeKit] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Ads Studio State
  const [adPlatformFocus, setAdPlatformFocus] = useState<'all' | 'instagram' | 'facebook' | 'youtube' | 'linkedin'>('all');
  const [adBudgetTier, setAdBudgetTier] = useState<number>(500); // INR per ad (User configured: 500)
  const [copiedAdCopy, setCopiedAdCopy] = useState(false);

  // Stakeholder Wall Comments
  const [wallComments, setWallComments] = useState<Array<{
    id: string;
    author: string;
    role: string;
    avatarText: string;
    timestamp: string;
    content: string;
    mediaItem?: SocialMediaItem;
    likes: number;
    hasLiked?: boolean;
    tag?: string;
  }>>([
    {
      id: 'soc-wall-1',
      author: 'Ar. S. Gouse',
      role: 'Lead Architect (+91 8073947241)',
      avatarText: 'SG',
      timestamp: '2 hours ago',
      content: 'Uploaded the updated 4K Lumion walkthrough showing the biophilic central courtyard and setback perimeter. Elevation options compliant with NBC 2016.',
      mediaItem: INITIAL_SOCIAL_MEDIA_ITEMS[0],
      likes: 8,
      hasLiked: true,
      tag: '3D Walkthrough Release',
    },
    {
      id: 'soc-wall-2',
      author: 'Client Representative',
      role: 'Project Stakeholder',
      avatarText: 'CR',
      timestamp: 'Yesterday',
      content: 'The evening twilight facade rendering with wire-cut brickwork looks fantastic! We approved the cantilevered balconies for construction drawings.',
      mediaItem: INITIAL_SOCIAL_MEDIA_ITEMS[1],
      likes: 12,
      hasLiked: false,
      tag: 'Client Approval',
    },
  ]);
  const [newWallComment, setNewWallComment] = useState('');
  const [newWallAuthor, setNewWallAuthor] = useState('Ar. S. Gouse');
  const [newWallTag, setNewWallTag] = useState('Site Progress Update');
  const [selectedWallMediaId, setSelectedWallMediaId] = useState<string>('');

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Process File Selection (Images & Videos)
  const processSelectedFile = (file: File) => {
    setPreviewError(null);
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setPreviewError('Please upload an image (PNG, JPG, WEBP, GIF, SVG) or video file (MP4, WebM, MOV).');
      return;
    }

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadFileName(file.name);
    setUploadFileSize(`${sizeInMb} MB`);

    if (isVideo) {
      setUploadType('video');
      setUploadAspectRatio('16:9');
      setUploadDimensions('1080p MP4');
      setUploadDuration('01:45');
      // Create local object URL for instant, high-speed playback
      const objectUrl = URL.createObjectURL(file);
      setUploadUrl(objectUrl);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } else {
      setUploadType('photo');
      setUploadAspectRatio('1:1');
      setUploadDimensions('High-Res Photo');
      // Use FileReader for photos
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadUrl(event.target?.result as string);
        if (!uploadTitle) {
          setUploadTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Form Submission / Add Media
  const handleCreateMediaItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadUrl) {
      setPreviewError('Please select a photo or video to upload, or paste a valid URL.');
      return;
    }

    const title = uploadTitle.trim() || (uploadType === 'video' ? 'Architectural Video Showcase' : 'Architectural Elevation Photo');
    const autoTags = [
      `#${uploadCategory.replace(/_/g, '')}`,
      '#GouseArchitecture',
      '#NBC2016',
      '#BangaloreLuxury',
      '#ArchitectTurnkey',
    ];

    const newItem: SocialMediaItem = {
      id: `media-${Date.now()}`,
      projectId: activeProject.id,
      type: uploadType,
      title,
      caption: uploadCaption.trim() || `${title} • NBC 2016 compliant turnkey architectural execution by Ar. S. Gouse (+91 8073947241).`,
      url: uploadUrl,
      thumbnailUrl: uploadType === 'video' ? (uploadUrl.startsWith('data:') ? undefined : uploadUrl) : uploadUrl,
      fileName: uploadFileName || `${uploadType}_upload_${Date.now()}`,
      fileSize: uploadFileSize || (uploadType === 'video' ? '18.4 MB' : '3.2 MB'),
      dimensions: uploadDimensions || (uploadType === 'video' ? '1920x1080 Full HD' : '3000x2000'),
      aspectRatio: uploadAspectRatio,
      duration: uploadType === 'video' ? uploadDuration : undefined,
      platform: uploadPlatform,
      category: uploadCategory,
      uploadedAt: 'Just now',
      architectAttribution: 'Ar. S. Gouse (+91 8073947241)',
      tags: autoTags,
      likesCount: 1,
      viewsCount: 1,
      isFeatured: true,
    };

    setMediaItems([newItem, ...mediaItems]);
    setActiveMediaId(newItem.id);
    setIsUploadModalOpen(false);

    // Reset upload form
    setUploadTitle('');
    setUploadCaption('');
    setUploadUrl('');
    setUploadFileName('');
    setUploadFileSize('');
    setPreviewError(null);

    // Show toast
    setUploadSuccessToast(`Successfully uploaded ${newItem.type === 'video' ? 'video' : 'photo'}: "${newItem.title}"! Set as Active Creative.`);
    setTimeout(() => setUploadSuccessToast(null), 5000);
  };

  // Delete Media
  const handleDeleteMedia = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const item = mediaItems.find((m) => m.id === id);
    if (!item) return;

    if (window.confirm(`Are you sure you want to remove "${item.title}" from the Social Media library?`)) {
      const updated = mediaItems.filter((m) => m.id !== id);
      setMediaItems(updated);
      if (activeMediaId === id && updated.length > 0) {
        setActiveMediaId(updated[0].id);
      }
    }
  };

  // Reset to default sample media
  const handleResetToDefault = () => {
    if (window.confirm('Reset media library to standard architectural portfolio with sample 4K videos & photos?')) {
      setMediaItems(INITIAL_SOCIAL_MEDIA_ITEMS);
      setActiveMediaId(INITIAL_SOCIAL_MEDIA_ITEMS[0].id);
      localStorage.removeItem('gouse_ai_social_media_library');
      setUploadSuccessToast('Reset media library to standard 4K portfolio.');
      setTimeout(() => setUploadSuccessToast(null), 4000);
    }
  };

  // Add Comment on Stakeholder Wall
  const handleAddWallComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallComment.trim()) return;

    const attached = mediaItems.find((m) => m.id === selectedWallMediaId);

    const newComment = {
      id: `wall-${Date.now()}`,
      author: newWallAuthor,
      role: newWallAuthor.includes('Gouse') ? 'Lead Architect (+91 8073947241)' : 'Stakeholder',
      avatarText: newWallAuthor.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
      timestamp: 'Just now',
      content: newWallComment.trim(),
      mediaItem: attached,
      likes: 0,
      hasLiked: false,
      tag: newWallTag,
    };

    setWallComments([newComment, ...wallComments]);
    setNewWallComment('');
    setSelectedWallMediaId('');
  };

  // Filtered Media
  const filteredMedia = mediaItems.filter((item) => {
    if (mediaTypeFilter !== 'all' && item.type !== mediaTypeFilter) return false;
    if (platformFilter !== 'all' && item.platform !== 'all' && item.platform !== platformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.caption.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Direct Phone & SMS Links
  const companyPhone = '+91 8073947241';
  const directCallHref = `tel:${companyPhone.replace(/\s+/g, '')}`;
  const directAreaSmsHref = `sms:${companyPhone.replace(/\s+/g, '')}?&body=${encodeURIComponent(
    `Hello Ar. S. Gouse, I reviewed the social media showcase for "${activeProject.name || activeMedia.title}" (${activeProject.builtUpAreaSqFt || 3500} sq.ft). I would like to schedule an architectural consultation and turnkey site visit.`
  )}`;
  const directWhatsAppHref = `https://api.whatsapp.com/send?phone=918073947241&text=${encodeURIComponent(
    `Hello Ar. S. Gouse (+91 8073947241), I am inquiring from your Social Media Showcase regarding "${activeMedia.title}". Could you share the detailed BOQ and architectural drawings?`
  )}`;

  // Copy Kits
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const instagramKitText = `🏛️ ${activeMedia.title}\n\n${activeMedia.caption}\n\n📐 Built-Up Area: ${activeProject.builtUpAreaSqFt || 3500} SQ.FT\n✅ Compliant with NBC 2016 & BBMP Setbacks\n📞 Architectural Consultation: Ar. S. Gouse ${companyPhone}\n💬 Send Area SMS: ${directAreaSmsHref}\n\n${activeMedia.tags.join(' ')} #GouseArchitects`;

  const facebookKitText = `⭐ PROJECT HIGHLIGHT: ${activeMedia.title}\n\n${activeMedia.caption}\n\nKey Specifications:\n• Project: ${activeProject.name}\n• Location: ${activeProject.location || 'Bengaluru, India'}\n• Architectural Direction: Ar. S. Gouse (${companyPhone})\n• NBC 2016 Compliant RCC Framing & Daylighting\n\nDirect Call / WhatsApp: ${companyPhone}\n#TurnkeyConstruction #ArchitecturalDesign #BangaloreVillas`;

  const youtubeKitText = `TITLE:\n${activeMedia.title} | 4K 60FPS Architectural Walkthrough\n\nDESCRIPTION:\n${activeMedia.caption}\n\nArchitect & Turnkey Contractor: Ar. S. Gouse\nPhone / SMS: ${companyPhone}\nLocation: ${activeProject.location || 'Bengaluru, India'}\nBuilt-Up Area: ${activeProject.builtUpAreaSqFt || 3500} sq.ft\n\nTIMESTAMPS:\n00:00 Aerial Drone Setback Analysis\n01:10 Double-Height Biophilic Courtyard\n02:20 Cantilevered Facade & Teak Louvers\n03:15 Structural Column Grid & BOQ Handover\n\nTAGS:\n${activeMedia.tags.join(', ')}`;

  return (
    <div id="social-media-studio-container" className="space-y-6">
      {/* SUCCESS TOAST */}
      {uploadSuccessToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white shadow-2xl animate-bounce">
          <Check className="h-5 w-5 shrink-0" />
          <span className="text-xs font-bold">{uploadSuccessToast}</span>
          <button
            type="button"
            onClick={() => setUploadSuccessToast(null)}
            className="ml-2 text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER: SOCIAL MEDIA HUB & UPLOAD HERO BANNER */}
      <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 md:p-6 shadow-2xl shadow-sky-500/10 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-sky-500 text-white shadow-lg shadow-pink-500/20 shrink-0">
              <Share2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  Social Media &amp; Media Showcase Hub
                </h2>
                <span className="rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-sky-500/20 px-3 py-0.5 text-[11px] font-mono font-bold text-sky-200 border border-sky-500/40">
                  UPLOAD PHOTOS &amp; VIDEOS
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  {mediaItems.length} Media Assets Loaded
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Upload and manage high-resolution architectural <strong>photos</strong>, <strong>4K video walkthroughs</strong>, and <strong>drone reels</strong>. Sync media instantly with Instagram Reels &amp; Posts, Facebook Stories, YouTube 3D Player, and Sponsored Social Ads.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary UPLOAD Button */}
            <button
              id="btn-upload-social-media"
              type="button"
              onClick={() => {
                setUploadSourceMode('file');
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-sky-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 hover:opacity-95 hover:scale-[1.02] transition active:scale-95"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Photo / Video</span>
              <span className="rounded bg-black/30 px-1.5 py-0.5 text-[10px] font-mono">
                +ADD
              </span>
            </button>

            {/* Direct Architect Phone Call */}
            <a
              id="btn-social-architect-call"
              href={directCallHref}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
              title="Call Lead Architect Ar. S. Gouse"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>+91 8073947241</span>
            </a>

            {/* WhatsApp Inquiry */}
            <a
              id="btn-social-architect-whatsapp"
              href={directWhatsAppHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 4 CORE SUB-MODE SWITCHERS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
          <button
            id="subtab-media-gallery"
            type="button"
            onClick={() => setActiveSubMode('gallery')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
              activeSubMode === 'gallery'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Media Library &amp; Uploads</span>
            <span className={`rounded-full px-2 py-0.2 text-[10px] font-mono ${
              activeSubMode === 'gallery' ? 'bg-slate-950 text-sky-300' : 'bg-slate-800 text-slate-300'
            }`}>
              {mediaItems.length}
            </span>
          </button>

          <button
            id="subtab-social-channels"
            type="button"
            onClick={() => setActiveSubMode('channels')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
              activeSubMode === 'channels'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Instagram &amp; YouTube Player</span>
            <span className="rounded-full bg-slate-900 px-2 py-0.2 text-[10px] font-mono text-pink-300">
              MOCKUPS
            </span>
          </button>

          <button
            id="subtab-social-ads"
            type="button"
            onClick={() => setActiveSubMode('ads')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
              activeSubMode === 'ads'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>Promote via Social Ads</span>
            <span className="rounded-full bg-slate-950/40 px-2 py-0.2 text-[10px] font-mono font-extrabold text-slate-950">
              ₹500 ADS
            </span>
          </button>

          <button
            id="subtab-stakeholder-wall"
            type="button"
            onClick={() => setActiveSubMode('wall')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
              activeSubMode === 'wall'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Stakeholder Media Feed</span>
            <span className="rounded-full bg-slate-900 px-2 py-0.2 text-[10px] font-mono text-emerald-300">
              {wallComments.length}
            </span>
          </button>
        </div>

        {/* ACTIVE CREATIVE BANNER (INDICATES WHICH MEDIA IS SYNCED ACROSS CHANNELS) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 text-xs">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
              {activeMedia.type === 'video' ? (
                <video src={activeMedia.url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={activeMedia.url} alt={activeMedia.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                {activeMedia.type === 'video' ? (
                  <Play className="h-4 w-4 text-white fill-current" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                  Active Showcase Creative:
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                  activeMedia.type === 'video' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {activeMedia.type.toUpperCase()} • {activeMedia.aspectRatio}
                </span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                {activeMedia.title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLightboxItem(activeMedia)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              <Eye className="h-3.5 w-3.5 text-sky-400" />
              <span>Full Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubMode('channels')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition"
            >
              <span>View in Mockups</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODE 1: MEDIA LIBRARY & UPLOADS GALLERY */}
      {/* ========================================================================= */}
      {activeSubMode === 'gallery' && (
        <div id="media-library-gallery-section" className="space-y-6">
          {/* FILTER & SEARCH TOOLBAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-sky-400" /> Filter:
              </span>

              {/* All / Photos / Videos */}
              <button
                type="button"
                onClick={() => setMediaTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  mediaTypeFilter === 'all'
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All Media ({mediaItems.length})
              </button>

              <button
                type="button"
                onClick={() => setMediaTypeFilter('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  mediaTypeFilter === 'photo'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-pink-300'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Photos ({mediaItems.filter((m) => m.type === 'photo').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaTypeFilter('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  mediaTypeFilter === 'video'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-red-300'
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Videos &amp; 3D ({mediaItems.filter((m) => m.type === 'video').length})</span>
              </button>
            </div>

            {/* Search Box and Reset */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search renders, reels, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition shrink-0"
                title="Reset to initial 4K sample portfolio"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* MEDIA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMedia.map((item) => {
              const isActive = item.id === activeMediaId;
              return (
                <div
                  key={item.id}
                  className={`group rounded-xl border bg-slate-900/90 overflow-hidden flex flex-col transition-all duration-200 shadow-lg ${
                    isActive
                      ? 'border-sky-400 ring-2 ring-sky-500/20 shadow-sky-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Media Thumbnail Container */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setLightboxItem(item)}>
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        playsInline
                        onMouseOver={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                        onMouseOut={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase shadow-md ${
                        item.type === 'video'
                          ? 'bg-red-600 text-white'
                          : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      }`}>
                        {item.type === 'video' ? 'VIDEO • 4K' : 'PHOTO'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-950/80 text-slate-200 text-[10px] font-mono border border-slate-700">
                        {item.aspectRatio}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded bg-sky-500 text-slate-950 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Check className="h-3 w-3" /> ACTIVE CREATIVE
                        </span>
                      )}
                    </div>

                    {/* Duration / File Size Badge */}
                    <div className="absolute top-2.5 right-2.5 rounded bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-800">
                      {item.duration || item.fileSize}
                    </div>

                    {/* Play / Preview Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        {item.type === 'video' ? <Play className="h-6 w-6 fill-current ml-0.5" /> : <Eye className="h-6 w-6" />}
                      </div>
                    </div>
                  </div>

                  {/* Media Content Information */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="capitalize text-sky-400 font-semibold">{item.category.replace(/_/g, ' ')}</span>
                        <span>{item.uploadedAt}</span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                        {item.caption}
                      </p>

                      {/* Hashtags */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {item.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                      {/* Set as Active Creative Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMediaId(item.id);
                          setUploadSuccessToast(`Set "${item.title}" as active creative across all mockups.`);
                          setTimeout(() => setUploadSuccessToast(null), 3000);
                        }}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                          isActive
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        {isActive ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
                        <span>{isActive ? 'Active Creative' : 'Use in Mockups'}</span>
                      </button>

                      {/* Preview / Theater */}
                      <button
                        type="button"
                        onClick={() => setLightboxItem(item)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
                        title="Theater View"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteMedia(item.id, e)}
                        className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Remove Media"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredMedia.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center space-y-4">
              <Camera className="h-12 w-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No media found matching your filter</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try selecting a different filter or upload a new photo or video to the architectural portfolio.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition"
              >
                <Upload className="h-4 w-4" />
                <span>Upload New Photo or Video</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODE 2: INSTAGRAM REELS, FACEBOOK & YOUTUBE PLAYER MOCKUPS */}
      {/* ========================================================================= */}
      {activeSubMode === 'channels' && (
        <div id="channels-showcase-section" className="space-y-6">
          {/* Sub-channel Selector */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Platform Preview:</span>
            {[
              { id: 'all', label: 'All Channels', icon: Share2, color: 'text-sky-300' },
              { id: 'instagram', label: 'Instagram Reels & Post Studio', icon: Camera, color: 'text-pink-400' },
              { id: 'youtube', label: 'YouTube 3D Tour Player', icon: Film, color: 'text-red-400' },
              { id: 'facebook', label: 'Facebook Page & Community Story', icon: Globe, color: 'text-blue-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = socialPlatformFocus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSocialPlatformFocus(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                    isSelected
                      ? 'bg-slate-800 border-sky-400/80 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT / CENTER: INSTAGRAM & YOUTUBE PLAYERS (7 COLS) */}
            <div className="lg:col-span-7 space-y-6">
              {/* INSTAGRAM MODULE */}
              {(socialPlatformFocus === 'all' || socialPlatformFocus === 'instagram') && (
                <div className="rounded-2xl bg-slate-900/90 border border-pink-500/30 p-5 space-y-4 shadow-xl shadow-pink-500/5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white">
                        <Camera className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Instagram Reels &amp; Showcase Studio
                        </h4>
                        <span className="text-[10px] text-pink-400 font-mono">
                          Live Active Media: {activeMedia.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      {(['reel', 'post', 'carousel'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setInstagramFormat(fmt)}
                          className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold transition ${
                            instagramFormat === fmt
                              ? 'bg-pink-500 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* INTERACTIVE INSTAGRAM PHONE PREVIEW FRAME */}
                  <div className="mx-auto max-w-sm rounded-3xl bg-slate-950 border-4 border-slate-800 p-2 shadow-2xl overflow-hidden relative">
                    {/* Phone Top Notch Bar */}
                    <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-900">
                      <span>9:41</span>
                      <div className="h-3 w-16 bg-slate-900 rounded-full" />
                      <span>5G 100%</span>
                    </div>

                    {/* Instagram Account Header */}
                    <div className="p-2.5 flex items-center justify-between border-b border-slate-900 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                          <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center text-[10px] font-bold text-white">
                            SG
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1 text-xs">
                            <span>gouse_architects</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                          </div>
                          <div className="text-[10px] text-slate-400">Bengaluru • Ar. S. Gouse</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-pink-400 font-bold">Follow</span>
                    </div>

                    {/* Visual Media Container */}
                    <div className="relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                      {activeMedia.type === 'video' ? (
                        <video
                          src={activeMedia.url}
                          className="h-full w-full object-cover"
                          autoPlay
                          loop
                          muted={isMuted}
                          playsInline
                        />
                      ) : (
                        <img
                          src={activeMedia.url}
                          alt={activeMedia.title}
                          className="h-full w-full object-cover"
                        />
                      )}

                      {/* Reel Floating Overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

                      {/* Right-Side Floating Actions */}
                      <div className="absolute right-2.5 bottom-12 flex flex-col items-center gap-4 text-white z-10">
                        {/* Like */}
                        <button
                          type="button"
                          onClick={() => {
                            setHasLikedReel(!hasLikedReel);
                            setReelLikes(hasLikedReel ? reelLikes - 1 : reelLikes + 1);
                          }}
                          className="flex flex-col items-center gap-1 text-xs font-mono"
                        >
                          <div className={`p-2 rounded-full backdrop-blur-md transition ${hasLikedReel ? 'bg-pink-600 text-white' : 'bg-black/40 text-white hover:text-pink-400'}`}>
                            <Heart className={`h-5 w-5 ${hasLikedReel ? 'fill-current' : ''}`} />
                          </div>
                          <span className="text-[10px]">{reelLikes}</span>
                        </button>

                        {/* Comment */}
                        <div className="flex flex-col items-center gap-1 text-xs font-mono">
                          <div className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <span className="text-[10px]">48</span>
                        </div>

                        {/* Share */}
                        <div className="flex flex-col items-center gap-1 text-xs font-mono">
                          <div className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white">
                            <Send className="h-5 w-5" />
                          </div>
                          <span className="text-[10px]">Share</span>
                        </div>
                      </div>

                      {/* Bottom Info Overlay */}
                      <div className="absolute left-3 right-16 bottom-3 text-white space-y-1 z-10 pointer-events-auto">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">@gouse_architects</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/80 font-mono font-bold">
                            NBC 2016
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-200 line-clamp-2 leading-snug">
                          {activeMedia.caption}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-pink-300 font-mono">
                          <span>♫ Ar. S. Gouse • Signature Turnkey Design Audio</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Call Action Bar */}
                    <div className="p-2.5 flex items-center justify-between border-t border-slate-900 text-xs">
                      <a
                        href={directCallHref}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-400"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Direct Call: +91 8073947241</span>
                      </a>
                      <a
                        href={directAreaSmsHref}
                        className="text-[11px] font-mono text-sky-400 underline font-semibold"
                      >
                        Send Area SMS
                      </a>
                    </div>
                  </div>

                  {/* Caption & Hashtag Kit */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-pink-400">
                        Instagram Caption &amp; Hashtag Kit:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(instagramKitText, setCopiedInstagramKit)}
                        className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 font-mono"
                      >
                        {copiedInstagramKit ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedInstagramKit ? 'Copied Kit!' : 'Copy Instagram Kit'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {instagramKitText}
                    </div>
                  </div>
                </div>
              )}

              {/* YOUTUBE 3D & 4K VIDEO PLAYER MODULE */}
              {(socialPlatformFocus === 'all' || socialPlatformFocus === 'youtube') && (
                <div className="rounded-2xl bg-slate-900/90 border border-red-500/30 p-5 space-y-4 shadow-xl shadow-red-500/5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          YouTube 3D Architectural Player
                        </h4>
                        <span className="text-[10px] text-red-400 font-mono">
                          Playing: {activeMedia.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      4K UHD • 60 FPS
                    </span>
                  </div>

                  {/* Real HTML5 Interactive YouTube Player Frame */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                    <div className="relative aspect-video bg-black flex items-center justify-center">
                      {activeMedia.type === 'video' ? (
                        <video
                          src={activeMedia.url}
                          className="h-full w-full object-contain"
                          controls
                          autoPlay={isPlayingYouTube}
                          muted={isMuted}
                        />
                      ) : (
                        <div className="relative h-full w-full flex items-center justify-center">
                          <img src={activeMedia.url} alt={activeMedia.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                            <span className="text-xs font-bold text-white bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-700">
                              Selected Active Creative is a Photo: {activeMedia.title}
                            </span>
                            <span className="text-[11px] text-slate-400 mt-1">
                              To play full motion video, select any video from the Media Library.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* YouTube Chapters */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800 text-xs">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Interactive Video Chapters:</span>
                        <span className="font-mono text-[10px] text-red-400">NBC 2016 Compliant Walkthrough</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <strong className="text-red-400">00:00</strong> Drone Aerials
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <strong className="text-red-400">01:10</strong> Courtyard Daylighting
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <strong className="text-red-400">02:25</strong> Facade Teak Louvers
                        </div>
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          <strong className="text-red-400">03:45</strong> RCC Slab Matrix
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* YouTube SEO & Kit */}
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-red-400">
                        YouTube SEO Title &amp; Description Kit:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(youtubeKitText, setCopiedYouTubeKit)}
                        className="flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200 font-mono"
                      >
                        {copiedYouTubeKit ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedYouTubeKit ? 'Copied Kit!' : 'Copy YouTube Kit'}</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      {youtubeKitText}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: LIVE MULTI-CHANNEL PORTAL & STAKEHOLDER FEED SUMMARY (5 COLS) */}
            <div className="lg:col-span-5 space-y-6">
              {/* FACEBOOK MODULE */}
              {(socialPlatformFocus === 'all' || socialPlatformFocus === 'facebook') && (
                <div className="rounded-2xl bg-slate-900/90 border border-blue-500/30 p-5 space-y-4 shadow-xl shadow-blue-500/5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        f
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Facebook Page Post Preview
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">Client Group Ready</span>
                  </div>

                  {/* Facebook Mock Post Card */}
                  <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-md">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          GA
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Gouse Architectural Design &amp; Turnkey</div>
                          <div className="text-[10px] text-slate-400">Bengaluru • Public Portfolio</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">Verified</span>
                    </div>

                    <div className="p-3 text-xs text-slate-200">
                      <p className="line-clamp-2">{activeMedia.caption}</p>
                    </div>

                    {/* Post Media */}
                    <div className="relative aspect-video bg-black">
                      {activeMedia.type === 'video' ? (
                        <video src={activeMedia.url} className="h-full w-full object-cover" controls />
                      ) : (
                        <img src={activeMedia.url} alt={activeMedia.title} className="h-full w-full object-cover" />
                      )}
                    </div>

                    <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Heart className="h-4 w-4 text-rose-500 fill-current" />
                        <span>342 Likes</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(facebookKitText, setCopiedFacebookKit)}
                        className="text-blue-400 hover:text-blue-300 font-bold text-xs"
                      >
                        {copiedFacebookKit ? 'Copied Post!' : 'Copy FB Post'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DIRECT CHANNELS QUICK LAUNCH */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                  <ExternalLink className="h-4 w-4 text-sky-400" />
                  <span>One-Click Channel Publishing</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href="https://www.instagram.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 hover:bg-pink-500 hover:text-white transition font-semibold"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Open Instagram</span>
                  </a>
                  <a
                    href="https://www.facebook.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500 hover:text-white transition font-semibold"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Open Facebook</span>
                  </a>
                  <a
                    href="https://www.youtube.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white transition font-semibold"
                  >
                    <Play className="h-4 w-4" />
                    <span>Open YouTube</span>
                  </a>
                  <a
                    href={directAreaSmsHref}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500 hover:text-white transition font-semibold"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Send Area SMS</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODE 3: PROMOTE COMPANY VIA SOCIAL ADS (₹500 PER AD) */}
      {/* ========================================================================= */}
      {activeSubMode === 'ads' && (
        <div id="social-ads-promotions-section" className="space-y-6">
          <div className="rounded-2xl border border-amber-500/40 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Company Sponsored Ads Studio • Lead Acquisition
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acquire prospective villa &amp; commercial turnkey clients via Instagram, Facebook &amp; YouTube Ads.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-mono font-bold text-amber-300 border border-amber-500/30">
                  Budget: ₹{adBudgetTier} INR / Ad
                </span>
              </div>
            </div>

            {/* AD CREATIVE SELECTOR (USES CURRENT ACTIVE MEDIA) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Ad Settings & Copy (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    1. Select Ad Creative Visual:
                  </span>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="h-12 w-20 rounded bg-black overflow-hidden relative shrink-0">
                      {activeMedia.type === 'video' ? (
                        <video src={activeMedia.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={activeMedia.url} alt={activeMedia.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{activeMedia.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {activeMedia.type.toUpperCase()} • {activeMedia.aspectRatio} • {activeMedia.category}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSubMode('gallery')}
                      className="px-2.5 py-1 text-xs rounded bg-slate-800 text-sky-300 hover:bg-slate-700 transition font-semibold"
                    >
                      Change Media
                    </button>
                  </div>
                </div>

                {/* Ad Copy Box */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      2. Auto-Generated High-Converting Ad Copy:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = `Looking to build a luxury turnkey villa in Bangalore without cost escalation?\n\nArchitectural Design & Turnkey Construction by Ar. S. Gouse\nPhone / SMS: ${companyPhone}\nNBC 2016 Compliant • Zero Escalation Contract\n\nCall now for free site visit and 3D concept layout!`;
                        copyToClipboard(copy, setCopiedAdCopy);
                      }}
                      className="flex items-center gap-1 text-xs text-amber-300 font-mono font-bold"
                    >
                      {copiedAdCopy ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedAdCopy ? 'Copied!' : 'Copy Ad Copy'}</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-200 bg-slate-900/60 p-3 rounded border border-slate-800/80 leading-relaxed font-sans">
                    <strong>Headline:</strong> NBC 2016 Compliant Luxury Turnkey Villas in Bengaluru<br />
                    <strong>Primary Text:</strong> Experience architectural excellence with biophilic courtyards, precision BOQ estimation, and zero cost escalations. Call Ar. S. Gouse at {companyPhone} for an architectural blueprint consultation.<br />
                    <strong>Call To Action:</strong> Call +91 8073947241 / Send Area SMS
                  </div>
                </div>
              </div>

              {/* Right Column: Live Sponsored Ad Preview Mockup (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Live Sponsored Ad Mockup:
                </span>
                <div className="rounded-xl border border-amber-500/40 bg-slate-950 overflow-hidden shadow-xl">
                  {/* Sponsored Header */}
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center text-[10px] font-bold text-slate-950">
                        GA
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Gouse Architectural Design</div>
                        <div className="text-[10px] text-amber-400 font-mono">Sponsored Ad • ₹500 Tier</div>
                      </div>
                    </div>
                  </div>

                  {/* Ad Media Display */}
                  <div className="relative aspect-video bg-black">
                    {activeMedia.type === 'video' ? (
                      <video src={activeMedia.url} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={activeMedia.url} alt={activeMedia.title} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                      NBC 2016 COMPLIANT
                    </div>
                  </div>

                  {/* CTA Bar */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">Ar. S. Gouse Lead Architect</div>
                      <div className="text-[10px] text-slate-400">{companyPhone}</div>
                    </div>
                    <a
                      href={directCallHref}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODE 4: STAKEHOLDER MEDIA FEED (COLLABORATION WALL) */}
      {/* ========================================================================= */}
      {activeSubMode === 'wall' && (
        <div id="stakeholder-wall-section" className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Stakeholder Media &amp; Feedback Wall ({wallComments.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Team, Architect &amp; Client Feed</span>
            </div>

            {/* Post Note Form with Media Attachment */}
            <form onSubmit={handleAddWallComment} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newWallAuthor}
                  onChange={(e) => setNewWallAuthor(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="Ar. S. Gouse">Ar. S. Gouse (Lead Architect)</option>
                  <option value="Client Representative">Client Partner</option>
                  <option value="Er. Ramesh Babu">Structural Lead</option>
                  <option value="Site Project Manager">Site Project Manager</option>
                </select>

                <select
                  value={newWallTag}
                  onChange={(e) => setNewWallTag(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="Site Progress Update">Site Progress Update</option>
                  <option value="3D Walkthrough Release">3D Walkthrough Release</option>
                  <option value="Client Approval">Client Approval</option>
                  <option value="Material Inspection">Material Inspection</option>
                </select>

                <select
                  value={selectedWallMediaId}
                  onChange={(e) => setSelectedWallMediaId(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-500"
                >
                  <option value="">Attach Media (Optional)...</option>
                  {mediaItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.type.toUpperCase()}] {m.title.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share architectural note, revision request or inspection finding..."
                  value={newWallComment}
                  onChange={(e) => setNewWallComment(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Post Update</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {wallComments.map((comment) => (
                <div key={comment.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-300">
                        {comment.avatarText}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{comment.author}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{comment.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{comment.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed pl-10">
                    {comment.content}
                  </p>

                  {/* Attached Media Thumbnail */}
                  {comment.mediaItem && (
                    <div
                      className="ml-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 max-w-sm cursor-pointer"
                      onClick={() => setLightboxItem(comment.mediaItem!)}
                    >
                      <div className="relative aspect-video bg-black">
                        {comment.mediaItem.type === 'video' ? (
                          <video src={comment.mediaItem.url} className="h-full w-full object-cover" muted />
                        ) : (
                          <img src={comment.mediaItem.url} alt={comment.mediaItem.title} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                          ATTACHED {comment.mediaItem.type.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-2 text-xs font-semibold text-white truncate">
                        {comment.mediaItem.title}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pl-10 pt-1 text-[11px]">
                    <span className="rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 font-mono text-[10px]">
                      {comment.tag}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWallComments(
                          wallComments.map((c) =>
                            c.id === comment.id
                              ? { ...c, likes: c.hasLiked ? c.likes - 1 : c.likes + 1, hasLiked: !c.hasLiked }
                              : c
                          )
                        );
                      }}
                      className={`flex items-center gap-1 font-mono transition ${
                        comment.hasLiked ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${comment.hasLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD PHOTO / VIDEO DIALOG */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border-2 border-sky-500/40 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-sky-500 flex items-center justify-center text-white">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Upload Photos &amp; Videos to Social Media Area
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supports 4K architectural renderings, Lumion 3D walkthroughs, and drone video reels.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setPreviewError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Source Mode Tabs (File Dropzone vs Paste URL vs Presets) */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setUploadSourceMode('file')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSourceMode === 'file' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload From Device</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadSourceMode('url')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSourceMode === 'url' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Paste Web URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadSourceMode('sample')}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  uploadSourceMode === 'sample' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sample Architectural Assets</span>
              </button>
            </div>

            {previewError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {previewError}
              </div>
            )}

            {/* MODE A: DRAG & DROP FILE ZONE */}
            {uploadSourceMode === 'file' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? 'border-sky-400 bg-sky-500/10 scale-[1.01]'
                    : uploadUrl
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-950 hover:border-sky-500 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {uploadUrl ? (
                  <div className="space-y-3">
                    <div className="max-h-48 max-w-sm mx-auto rounded-lg overflow-hidden border border-slate-700 bg-black">
                      {uploadType === 'video' ? (
                        <video src={uploadUrl} className="max-h-48 w-full object-contain" controls />
                      ) : (
                        <img src={uploadUrl} alt="Preview" className="max-h-48 w-full object-contain" />
                      )}
                    </div>
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                      <Check className="h-4 w-4" />
                      <span>{uploadFileName || 'File selected successfully'} ({uploadFileSize})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 underline">Click to choose a different file</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500/20 to-sky-500/20 text-sky-400 border border-sky-500/30">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Drag &amp; Drop Photo or Video Here, or Click to Browse
                    </h4>
                    <p className="text-xs text-slate-400">
                      Supports PNG, JPG, WEBP, GIF, SVG • MP4, WEBM, MOV (Up to 100MB)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MODE B: URL INPUT */}
            {uploadSourceMode === 'url' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Image or Video URL Link:</label>
                <input
                  type="url"
                  placeholder="https://example.com/walkthrough.mp4 or https://example.com/render.jpg"
                  value={uploadUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setUploadUrl(url);
                    if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                      setUploadType('video');
                      setUploadAspectRatio('16:9');
                    } else if (url.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i)) {
                      setUploadType('photo');
                      setUploadAspectRatio('1:1');
                    }
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
                />
              </div>
            )}

            {/* MODE C: SAMPLE PRESETS */}
            {uploadSourceMode === 'sample' && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block mb-1">
                  Click any sample to load into form:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('video');
                      setUploadUrl(SAMPLE_WALKTHROUGH_VIDEO);
                      setUploadTitle('3D Lumion Walkthrough • Courtyard & Daylight Analysis');
                      setUploadAspectRatio('16:9');
                      setUploadCategory('3d_walkthrough');
                      setUploadDuration('02:14');
                      setUploadFileSize('42.8 MB');
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500 text-left transition space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-red-400 font-bold">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>4K Lumion Walkthrough (MP4)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">1080p 60fps • 02:14</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('video');
                      setUploadUrl(SAMPLE_DRONE_VIDEO);
                      setUploadTitle('Drone Aerial Setback Verification Reel');
                      setUploadAspectRatio('9:16');
                      setUploadCategory('drone_aerial');
                      setUploadDuration('00:54');
                      setUploadFileSize('28.4 MB');
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-pink-500 text-left transition space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-pink-400 font-bold">
                      <Film className="h-3.5 w-3.5" />
                      <span>Drone Vertical Reel (9:16)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Instagram 9:16 • 00:54</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('photo');
                      setUploadUrl(villaExteriorImg);
                      setUploadTitle('Signature Villa Exterior Evening Elevation');
                      setUploadAspectRatio('1:1');
                      setUploadCategory('site_elevation');
                      setUploadFileSize('4.8 MB');
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Signature 4K Elevation (JPG)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">1:1 Square Post • 4K UHD</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('photo');
                      setUploadUrl(courtyardInteriorImg);
                      setUploadTitle('Double-Height Biophilic Courtyard Photo');
                      setUploadAspectRatio('4:5');
                      setUploadCategory('interior_design');
                      setUploadFileSize('5.2 MB');
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-left transition space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Camera className="h-3.5 w-3.5" />
                      <span>Biophilic Courtyard (Photo)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">4:5 Portrait • Daylight Finishes</div>
                  </button>
                </div>
              </div>
            )}

            {/* FORM METADATA FIELDS */}
            <form onSubmit={handleCreateMediaItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Title / Showcase Headline:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Biophilic Courtyard 3D Lumion Walkthrough"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Media Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Media Type:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadType('photo')}
                      className={`py-1.5 rounded-lg font-bold border transition flex items-center justify-center gap-1.5 ${
                        uploadType === 'photo'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('video')}
                      className={`py-1.5 rounded-lg font-bold border transition flex items-center justify-center gap-1.5 ${
                        uploadType === 'video'
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Film className="h-3.5 w-3.5" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Aspect Ratio:</label>
                  <select
                    value={uploadAspectRatio}
                    onChange={(e) => setUploadAspectRatio(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  >
                    <option value="16:9">16:9 Landscape (YouTube / TV)</option>
                    <option value="9:16">9:16 Vertical (Instagram Reel / Story)</option>
                    <option value="1:1">1:1 Square (Instagram Feed)</option>
                    <option value="4:5">4:5 Portrait (Facebook / Mobile Feed)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Portfolio Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  >
                    <option value="3d_walkthrough">3D Walkthrough / Lumion</option>
                    <option value="site_elevation">Site Elevation Render</option>
                    <option value="drone_aerial">Drone Aerial Survey</option>
                    <option value="interior_design">Interior Styling &amp; Finishes</option>
                    <option value="slab_casting">RCC Column &amp; Slab Casting</option>
                    <option value="handover">Handover Ceremony</option>
                  </select>
                </div>

                {/* Platform Target */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Target Channel:</label>
                  <select
                    value={uploadPlatform}
                    onChange={(e) => setUploadPlatform(e.target.value as any)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                  >
                    <option value="all">All Channels (Instagram, FB, YT)</option>
                    <option value="instagram">Instagram Reels &amp; Posts</option>
                    <option value="youtube">YouTube 3D Walkthrough</option>
                    <option value="facebook">Facebook Page Post</option>
                    <option value="linkedin">LinkedIn Architectural Showcase</option>
                  </select>
                </div>

                {/* Caption */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-300">Caption &amp; Project Description:</label>
                  <textarea
                    rows={2}
                    placeholder="Enter project specifications, NBC 2016 bylaws notes, or hashtags..."
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadUrl}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-sky-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-500/20 hover:opacity-95 transition disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload &amp; Add to Social Portfolio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FULLSCREEN LIGHTBOX & THEATER VIDEO PLAYER */}
      {/* ========================================================================= */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative w-full max-w-5xl rounded-2xl bg-slate-950 border border-slate-800 p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase mr-2 ${
                  lightboxItem.type === 'video' ? 'bg-red-600 text-white' : 'bg-pink-600 text-white'
                }`}>
                  {lightboxItem.type.toUpperCase()}
                </span>
                <span className="text-sm font-bold text-white">{lightboxItem.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Visual Display */}
            <div className="flex-1 min-h-[300px] flex items-center justify-center bg-black rounded-xl overflow-hidden relative">
              {lightboxItem.type === 'video' ? (
                <video
                  ref={theaterVideoRef}
                  src={lightboxItem.url}
                  className="max-h-[60vh] w-full object-contain"
                  controls
                  autoPlay
                  loop={isLooping}
                  muted={isMuted}
                />
              ) : (
                <img
                  src={lightboxItem.url}
                  alt={lightboxItem.title}
                  className="max-h-[60vh] max-w-full object-contain"
                />
              )}
            </div>

            {/* Video Speed Controls & Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-800 pt-3">
              <div className="text-slate-400 space-y-0.5">
                <div className="text-white font-semibold">{lightboxItem.caption}</div>
                <div className="text-[11px] font-mono text-slate-500">
                  {lightboxItem.dimensions} • {lightboxItem.fileSize} • {lightboxItem.architectAttribution}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMediaId(lightboxItem.id);
                    setLightboxItem(null);
                    setUploadSuccessToast(`Set "${lightboxItem.title}" as active creative.`);
                    setTimeout(() => setUploadSuccessToast(null), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Set as Active Creative</span>
                </button>
                <a
                  href={lightboxItem.url}
                  download={lightboxItem.fileName || 'architectural_media'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
