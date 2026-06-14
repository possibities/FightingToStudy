// 统一图标封装:语义名 → lucide 图标。尺寸由 CSS 控制(svg 选择器/className),颜色随 currentColor。
import {
  Tent, BookOpenText, ChartColumnBig, Settings, ScrollText, Map as MapIcon, Swords,
  Coins, Sparkles, Egg, Bird, Trophy, Medal, Hourglass, Star, Backpack,
  TreePine, Mountain, Gem, Flame, BookOpen, Hammer, Sprout, Vault, TowerControl, Telescope,
  Moon, Sun, Check, X, Plus, Flag, ArrowRight, RotateCcw, WandSparkles, HelpCircle,
} from 'lucide-react';

const MAP = {
  // 导航 / UI
  camp: Tent, book: BookOpenText, chart: ChartColumnBig, gear: Settings, avatar: WandSparkles,
  // 委托 / 奖励
  scroll: ScrollText, map: MapIcon, sword: Swords, coin: Coins, spark: Sparkles,
  egg: Egg, hatch: Bird, trophy: Trophy, medal: Medal, hourglass: Hourglass, star: Star, backpack: Backpack,
  // 材料(key 同名)
  wood: TreePine, stone: Mountain, stardust: Sparkles, crystal: Gem,
  // 建筑(key 同名)
  campfire: Flame, tent: Tent, library: BookOpen, workshop: Hammer,
  herb_garden: Sprout, treasury: Vault, watchtower: TowerControl, observatory: Telescope,
  // 场景 / 动作
  fire: Flame, moon: Moon, sun: Sun, check: Check, cross: X, plus: Plus,
  flag: Flag, arrow: ArrowRight, repeat: RotateCcw,
};

export default function Icon({ name, size, strokeWidth = 2, className, ...rest }) {
  const Glyph = MAP[name] || HelpCircle;
  return <Glyph size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />;
}
