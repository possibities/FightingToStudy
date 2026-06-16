import { useRef, useState } from 'react';
import { useGame } from '../state/GameStateContext.jsx';
import { useToast } from './Toast.jsx';
import { rollDice } from '../api/client.js';
import { playSfx, vibrate } from '../audio/sfx.js';
import { reduceMotion } from '../utils/motion.js';
import Icon from './Icon.jsx';

const BETS = [10, 20, 50, 100];

export default function Dice({ onClose }) {
  const { state, refresh } = useGame();
  const toast = useToast();
  const [choice, setChoice] = useState('big');
  const [bet, setBet] = useState(20);
  const [rolling, setRolling] = useState(false);
  const [faces, setFaces] = useState([1, 1]);
  const [result, setResult] = useState(null);
  const intRef = useRef(0);
  const gold = state.player.gold;
  const remaining = state.diceRemaining ?? 0;

  async function roll() {
    if (rolling) return;
    if (remaining <= 0) { toast.show('今日骰戏次数已用完,明天再来'); return; }
    if (gold < bet) { toast.show('金币不够下注'); return; }
    setRolling(true); setResult(null);
    if (!reduceMotion()) intRef.current = setInterval(() => setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 80);
    try {
      const r = await rollDice(choice, bet);
      setTimeout(() => {
        clearInterval(intRef.current);
        setFaces(r.dice);
        setResult(r);
        playSfx(r.win ? 'rare' : 'flip');
        vibrate(r.win ? [30, 40, 60] : 20);
        setRolling(false);
        refresh();
      }, 900);
    } catch (e) { clearInterval(intRef.current); toast.show(e.message); setRolling(false); }
  }

  return (
    <div className="modal-mask" onClick={rolling ? undefined : onClose}>
      <div className="modal card dice-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dice-title">
        <h3 id="dice-title"><Icon name="dice" size={20} /> 篝火骰戏</h3>
        <p className="dim">押大(8~12)或小(2~6),掷 2 骰。猜中翻倍,出 7 庄家通杀。只赌金币 · 今日剩 <span className="num">{remaining}</span> 局。</p>

        <div className="dice-faces">
          <span className={`die${rolling ? ' shaking' : ''}`}><Icon name={`dice${faces[0]}`} size={46} /></span>
          <span className={`die${rolling ? ' shaking' : ''}`}><Icon name={`dice${faces[1]}`} size={46} /></span>
        </div>
        {result && (
          <div className={`dice-result ${result.win ? 'win' : 'lose'}`}>
            点数 {result.sum} · {result.win ? `赢了!金币 +${result.delta}` : result.sum === 7 ? `掷出 7,庄家通杀 ${result.delta}` : `没押中 ${result.delta}`}
          </div>
        )}

        <div className="dice-choice">
          <button className={`btn-ghost${choice === 'small' ? ' on' : ''}`} onClick={() => setChoice('small')} disabled={rolling}>小 · 2~6</button>
          <button className={`btn-ghost${choice === 'big' ? ' on' : ''}`} onClick={() => setChoice('big')} disabled={rolling}>大 · 8~12</button>
        </div>
        <div className="dice-bets">
          {BETS.map(b => (
            <button key={b} className={`btn-ghost${bet === b ? ' on' : ''}`} onClick={() => setBet(b)} disabled={rolling || gold < b}>{b}</button>
          ))}
        </div>
        <button className="btn dice-roll" onClick={roll} disabled={rolling || remaining <= 0 || gold < bet}>掷骰 · 押 {bet}</button>
        <small className="dim">当前金币 <span className="num">{gold}</span></small>
        <button className="btn-ghost" onClick={onClose} disabled={rolling}>关闭</button>
      </div>
    </div>
  );
}
