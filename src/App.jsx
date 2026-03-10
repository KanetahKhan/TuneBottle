import { useState, useEffect, useRef } from 'react';
import styles from './App.module.css';
import { storage } from './storage.js';
import { genId, timeAgo } from './helpers.js';

const BOTTLES_KEY = 'tunebottle-bottles-v2';

export default function TuneBottle() {
  const [tab, setTab] = useState('send'); // 'send' | 'ocean' | 'mine'
  const [bottles, setBottles] = useState([]);
  const [myBottleIds, setMyBottleIds] = useState([]);
  const [openedIds, setOpenedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [openedBottle, setOpenedBottle] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);

  // Unique anonymous session ID (resets on page reload = more private)
  const mySession = useRef(genId());

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ song: '', artist: '', note: '' });
  const [replyForm, setReplyForm] = useState({ song: '', artist: '', note: '' });

  // ── Load ──────────────────────────────────────────────────────────────────
  async function loadBottles() {
    setLoading(true);
    try {
      const res = await storage.get(BOTTLES_KEY);
      if (res?.value) setBottles(JSON.parse(res.value));
    } catch {
      setBottles([]);
    }
    setLoading(false);
  }

  useEffect(() => { loadBottles(); }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function saveBottles(updated) {
    setBottles(updated);
    try {
      await storage.set(BOTTLES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Save failed', e);
    }
  }

  // ── Send a bottle ─────────────────────────────────────────────────────────
  async function sendBottle() {
    if (!form.song.trim() || !form.note.trim()) return;
    const bottle = {
      id: genId(),
      song: form.song.trim(),
      artist: form.artist.trim(),
      note: form.note.trim(),
      ts: Date.now(),
      session: mySession.current,
      replies: [],
    };
    const updated = [bottle, ...bottles];
    await saveBottles(updated);
    setMyBottleIds(prev => [...prev, bottle.id]);
    setForm({ song: '', artist: '', note: '' });
    setSent(true);
    setTimeout(() => setSent(false), 3500);
  }

  // ── Open a random unseen bottle ───────────────────────────────────────────
  async function openRandomBottle() {
    const unseen = bottles.filter(
      b => b.session !== mySession.current && !openedIds.includes(b.id)
    );
    if (!unseen.length) return;
    const pick = unseen[Math.floor(Math.random() * unseen.length)];
    setOpenedBottle(pick);
    setOpenedIds(prev => [...prev, pick.id]);
  }

  // ── Reply ─────────────────────────────────────────────────────────────────
  async function submitReply(bottleId) {
    if (!replyForm.song.trim() || !replyForm.note.trim()) return;
    const reply = {
      id: genId(),
      song: replyForm.song.trim(),
      artist: replyForm.artist.trim(),
      note: replyForm.note.trim(),
      ts: Date.now(),
      session: mySession.current,
    };
    const updated = bottles.map(b =>
      b.id === bottleId ? { ...b, replies: [...(b.replies || []), reply] } : b
    );
    await saveBottles(updated);
    if (openedBottle?.id === bottleId) {
      setOpenedBottle(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
    }
    setReplyTarget(null);
    setReplyForm({ song: '', artist: '', note: '' });
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const myBottles   = bottles.filter(b => myBottleIds.includes(b.id));
  const oceanBottles = bottles.filter(b => b.session !== mySession.current);
  const unseenCount  = oceanBottles.filter(b => !openedIds.includes(b.id)).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      {/* Background layers */}
      <div className={styles.oceanBg} />
      <div className={styles.stars} />
      <div className={styles.waves} />

      <div className={styles.app}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.logoIcon}>🪸</span>
          <h1 className={styles.logo}>TuneBottle</h1>
          <p className={styles.tagline}>send a song into the sea. wait for the tide.</p>
        </header>

        {/* Tabs */}
        <nav className={styles.tabs}>
          {[
            { id: 'send',  label: '🌊 Send',  badge: null },
            { id: 'ocean', label: '🔍 Open',  badge: unseenCount > 0 ? unseenCount : null },
            { id: 'mine',  label: '📬 Mine',  badge: myBottles.some(b => b.replies?.length) ? '✦' : null },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.badge !== null && <span className={styles.badge}>{t.badge}</span>}
            </button>
          ))}
        </nav>

        {/* ── SEND ─────────────────────────────────────────────────────── */}
        {tab === 'send' && (
          <div className={styles.card}>
            {sent ? (
              <div className={styles.success}>
                <span className={styles.successIcon}>🍾</span>
                <p className={styles.successTitle}>Your bottle is adrift…</p>
                <p className={styles.successSub}>somewhere out there, a stranger is listening</p>
              </div>
            ) : (
              <>
                <p className={styles.cardTitle}>seal something in glass</p>

                <div className={styles.field}>
                  <label className={styles.label}>the song</label>
                  <div className={styles.inputRow}>
                    <input
                      className={styles.input}
                      placeholder="song title"
                      value={form.song}
                      maxLength={60}
                      onChange={e => setForm(f => ({ ...f, song: e.target.value }))}
                    />
                    <input
                      className={styles.input}
                      placeholder="artist"
                      value={form.artist}
                      maxLength={60}
                      onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>one line, anonymous</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="this song got me through my breakup…"
                    value={form.note}
                    maxLength={120}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  />
                  <p className={styles.charCount}>{form.note.length}/120</p>
                </div>

                <div className={styles.bottleFloat}>
                  <span className={styles.bottleEmoji}>🍾</span>
                </div>

                <button
                  className={styles.btnPrimary}
                  onClick={sendBottle}
                  disabled={!form.song.trim() || !form.note.trim()}
                >
                  throw it into the sea
                </button>
              </>
            )}
          </div>
        )}

        {/* ── OCEAN ────────────────────────────────────────────────────── */}
        {tab === 'ocean' && (
          <>
            {loading ? (
              <Loader />
            ) : openedBottle ? (
              <BottleCard
                bottle={openedBottle}
                replyTarget={replyTarget}
                replyForm={replyForm}
                setReplyForm={setReplyForm}
                onReply={() => setReplyTarget(openedBottle.id)}
                onSubmitReply={() => submitReply(openedBottle.id)}
                onBack={() => { setOpenedBottle(null); setReplyTarget(null); }}
              />
            ) : unseenCount > 0 ? (
              <div className={styles.openPrompt}>
                <div className={`${styles.bottleFloat} ${styles.bottleFloatLg}`}>
                  <span className={styles.bottleEmoji} style={{ fontSize: '5rem' }}>🍾</span>
                </div>
                <p className={styles.openCount}>
                  {unseenCount} bottle{unseenCount !== 1 ? 's' : ''} drifting nearby
                </p>
                <p className={styles.openSub}>you won't know whose it is</p>
                <button className={styles.btnPrimary} onClick={openRandomBottle}>
                  open a bottle
                </button>
              </div>
            ) : (
              <EmptyState icon="🌊" text={
                bottles.length === 0
                  ? 'the ocean is empty.\nbe the first to send something.'
                  : `you've opened every bottle in the sea.\ncome back later.`
              } />
            )}
          </>
        )}

        {/* ── MINE ─────────────────────────────────────────────────────── */}
        {tab === 'mine' && (
          <>
            {myBottles.length === 0 ? (
              <EmptyState icon="📭" text="you haven't sent any bottles yet" />
            ) : (
              <div className={styles.scrollArea}>
                {myBottles.map(b => (
                  <div className={styles.bottleCard} key={b.id}>
                    <p className={styles.bcNote}>"{b.note}"</p>
                    <SongRow song={b.song} artist={b.artist} ts={b.ts} />
                    {b.replies?.length > 0 ? (
                      <div className={styles.chain}>
                        <p className={styles.chainLabel}>✦ {b.replies.length} stranger{b.replies.length > 1 ? 's' : ''} replied</p>
                        {b.replies.map(r => <ReplyRow key={r.id} reply={r} />)}
                      </div>
                    ) : (
                      <p className={styles.drifting}>drifting… no replies yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BottleCard({ bottle, replyTarget, replyForm, setReplyForm, onReply, onSubmitReply, onBack }) {
  const s = styles;
  return (
    <div className={s.bottleCard}>
      <p className={s.bcNote}>"{bottle.note}"</p>
      <SongRow song={bottle.song} artist={bottle.artist} ts={bottle.ts} />

      {bottle.replies?.length > 0 && (
        <div className={s.chain}>
          <p className={s.chainLabel}>replies drifted back ({bottle.replies.length})</p>
          {bottle.replies.map(r => <ReplyRow key={r.id} reply={r} />)}
        </div>
      )}

      <div className={s.bcActions}>
        {replyTarget !== bottle.id && (
          <button className={s.btnSecondary} onClick={onReply}>↩ reply with a song</button>
        )}
        <button className={s.btnSecondary} onClick={onBack}>back to ocean</button>
      </div>

      {replyTarget === bottle.id && (
        <div className={s.replyDrawer}>
          <p className={s.replyDrawerTitle}>your reply</p>
          <div className={s.inputRow} style={{ marginBottom: '0.75rem' }}>
            <input className={s.input} placeholder="song title" value={replyForm.song} maxLength={60}
              onChange={e => setReplyForm(f => ({ ...f, song: e.target.value }))} />
            <input className={s.input} placeholder="artist" value={replyForm.artist} maxLength={60}
              onChange={e => setReplyForm(f => ({ ...f, artist: e.target.value }))} />
          </div>
          <textarea className={s.textarea} placeholder="this reminded me of…"
            value={replyForm.note} maxLength={120}
            onChange={e => setReplyForm(f => ({ ...f, note: e.target.value }))} />
          <button className={s.btnPrimary} style={{ marginTop: '0.75rem' }}
            onClick={onSubmitReply}
            disabled={!replyForm.song.trim() || !replyForm.note.trim()}>
            send reply
          </button>
        </div>
      )}
    </div>
  );
}

function SongRow({ song, artist, ts }) {
  return (
    <div className={styles.songRow}>
      <span className={styles.songIcon}>🎵</span>
      <div className={styles.songInfo}>
        <p className={styles.songTitle}>{song}</p>
        {artist && <p className={styles.songArtist}>{artist}</p>}
      </div>
      <span className={styles.songTs}>{timeAgo(ts)}</span>
    </div>
  );
}

function ReplyRow({ reply }) {
  return (
    <div className={styles.replyRow}>
      <div>
        <p className={styles.replyNote}>"{reply.note}"</p>
        <p className={styles.replySong}>🎵 {reply.song}{reply.artist ? ` — ${reply.artist}` : ''}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className={styles.emptyState}>
      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>{icon}</span>
      <p className={styles.emptyText}>{text}</p>
    </div>
  );
}

function Loader() {
  return (
    <div className={styles.loader}>
      <div className={styles.dots}>
        <span /><span /><span />
      </div>
    </div>
  );
}
