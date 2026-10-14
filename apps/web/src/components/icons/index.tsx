// ─── CUSTOM CAFÉ SVG ICONS ────────────────────────────────────────────────────
// Iconos SVG propios de CafeFlow — estilo minimalista línea delgada

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/** Taza de café con vapor — logo principal de CafeFlow */
export function CoffeeCupIcon({ size = 24, className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Vapor izquierda */}
      <path d="M6 2c0 1.5 1.5 1.5 1.5 3" />
      {/* Vapor centro */}
      <path d="M9.5 2c0 1.5 1.5 1.5 1.5 3" />
      {/* Vapor derecha */}
      <path d="M13 2c0 1.5 1.5 1.5 1.5 3" />
      {/* Taza */}
      <path d="M3 8h14l-1.5 9a2 2 0 0 1-2 1.7H6.5a2 2 0 0 1-2-1.7L3 8z" />
      {/* Asa */}
      <path d="M17 8h1a3 3 0 0 1 0 6h-1" />
      {/* Platillo */}
      <line x1="1" y1="20" x2="19" y2="20" />
    </svg>
  );
}

/** Grano de café */
export function CoffeeBeanIcon({ size = 24, className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="12" rx="7" ry="10" transform="rotate(-30 12 12)" />
      <path d="M12 2c0 5-4 10 0 20" transform="rotate(-30 12 12)" />
    </svg>
  );
}

/** Caja registradora / POS */
export function CashRegisterIcon({ size = 24, className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Cuerpo */}
      <rect x="2" y="10" width="20" height="11" rx="2" />
      {/* Pantalla */}
      <rect x="6" y="3" width="12" height="5" rx="1" />
      {/* Línea divisora */}
      <line x1="2" y1="15" x2="22" y2="15" />
      {/* Teclas */}
      <circle cx="7" cy="18" r="1" fill="currentColor" />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
      <circle cx="17" cy="18" r="1" fill="currentColor" />
      {/* Conector pantalla */}
      <line x1="12" y1="8" x2="12" y2="10" />
    </svg>
  );
}

/** Ticket de venta */
export function ReceiptIcon({ size = 24, className = '', strokeWidth = 1.5 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

// ─── RE-EXPORTS DE LUCIDE (los más usados en CafeFlow) ────────────────────────
// Para no importar desde dos lugares distintos en los componentes

export {
  Search,
  X,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  Sunrise,
  Moon,
  LogOut,
  User,
  Users,
  Store,
  Package,
  Tag,
  Settings,
  BarChart2,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  PartyPopper,
  Mail,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  RefreshCw,
  Download,
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Filter,
  ChevronDown,
  MoreVertical,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  Activity,
  Sliders,
  UserCheck,
  Percent,
  Gift,
  Phone,
  ToggleLeft,
  ToggleRight,
  Copy,
  ListFilter,
  ChefHat,
  FileDown,
  PieChart,
  Bell,
  History,
  ChevronUp,
  LayoutGrid,
  Keyboard,
  RotateCcw,
  Upload,
  Palette,
  Megaphone,
  MonitorPlay,
  Undo2,
  Maximize2,
  Minimize2,
  Flame,
  HandPlatter,
} from 'lucide-react';
