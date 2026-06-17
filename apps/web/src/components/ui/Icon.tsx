import * as Icons from 'lucide-react';
import { ComponentType, SVGProps } from 'react';

/**
 * Icon size scale. Pixel values are tuned to render crisply next to text in
 * our base font sizes (--text-xs..--text-xl).
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

/**
 * The icons the app actually uses — names mirror the lucide-react PascalCase
 * exports. Kept as a literal union so <Icon /> call sites are checked.
 *
 * Add a new icon here only when at least one page uses it; this keeps the
 * tree-shakeable lucide-react surface intentional.
 */
export type IconName =
  // Navigation
  | 'Home' | 'Users' | 'BookOpen' | 'ClipboardList' | 'MessageSquare'
  // AppShell controls
  | 'Menu' | 'X' | 'LogOut' | 'Bell'
  // Form actions
  | 'Plus' | 'Copy' | 'Check' | 'Edit' | 'Trash2' | 'Send' | 'Search' | 'Save'
  // Brand / domain
  | 'Stethoscope' | 'Heart' | 'Brain' | 'Activity' | 'Sparkles' | 'UserRound'
  // Status / feedback
  | 'AlertCircle' | 'AlertTriangle' | 'CheckCircle' | 'XCircle' | 'Info'
  // Inline UI
  | 'Mail' | 'Lock' | 'Calendar' | 'Settings'
  // Direction
  | 'ChevronLeft' | 'ChevronRight' | 'ChevronDown' | 'ChevronUp' | 'ArrowRight'
  // Auth screen decoration
  | 'Sun' | 'Cloud' | 'ShieldCheck';

const ComponentMap: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  Home: Icons.Home,
  Users: Icons.Users,
  BookOpen: Icons.BookOpen,
  ClipboardList: Icons.ClipboardList,
  MessageSquare: Icons.MessageSquare,
  Menu: Icons.Menu,
  X: Icons.X,
  LogOut: Icons.LogOut,
  Bell: Icons.Bell,
  Plus: Icons.Plus,
  Copy: Icons.Copy,
  Check: Icons.Check,
  Edit: Icons.Edit,
  Trash2: Icons.Trash2,
  Send: Icons.Send,
  Search: Icons.Search,
  Save: Icons.Save,
  Stethoscope: Icons.Stethoscope,
  Heart: Icons.Heart,
  Brain: Icons.Brain,
  Activity: Icons.Activity,
  Sparkles: Icons.Sparkles,
  UserRound: Icons.UserRound,
  AlertCircle: Icons.AlertCircle,
  AlertTriangle: Icons.AlertTriangle,
  CheckCircle: Icons.CheckCircle,
  XCircle: Icons.XCircle,
  Info: Icons.Info,
  Mail: Icons.Mail,
  Lock: Icons.Lock,
  Calendar: Icons.Calendar,
  Settings: Icons.Settings,
  ChevronLeft: Icons.ChevronLeft,
  ChevronRight: Icons.ChevronRight,
  ChevronDown: Icons.ChevronDown,
  ChevronUp: Icons.ChevronUp,
  ArrowRight: Icons.ArrowRight,
  Sun: Icons.Sun,
  Cloud: Icons.Cloud,
  ShieldCheck: Icons.ShieldCheck,
};

/**
 * Type-safe icon. Use <Icon name="..." size="..." /> everywhere.
 *
 * Accessibility:
 *  - aria-hidden by default (icons are decorative when paired with text).
 *  - If you pass aria-label, role becomes "img" and aria-hidden is removed so
 *    screen readers can announce it.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'size' | 'name'> {
  name: IconName;
  size?: IconSize;
}

export function Icon({ name, size = 'md', 'aria-label': ariaLabel, role, ...rest }: IconProps) {
  const Cmp = ComponentMap[name];
  const decorative = ariaLabel === undefined;
  return (
    <Cmp
      width={SIZE_PX[size]}
      height={SIZE_PX[size]}
      strokeWidth={2}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : (role ?? 'img')}
      aria-label={ariaLabel}
      {...rest}
    />
  );
}
