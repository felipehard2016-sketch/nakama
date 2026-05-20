import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomLists, createCustomList, deleteCustomList,
  renameCustomList, removeFromCustomList, getMedia,
} from '../lib/storage';
import { useToast } from '../context/ToastContext';
import { useTitle } from '../hooks/useTitle';
import {
  Plus, ListPlus, Pencil, Trash2, ChevronRight,
  X, Check, Search, Film, BookOpen, ArrowLeft,
} from 'lucide-react';

/* ─── Helpers ─── */
function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Modal criar/renomear ─── */
function ListFormModal({ initial = '', onConfirm, onClose, title = 'Nova Lista' }) {
  const [name, setName] = useState(initial);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const submit = e => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px 28px 24px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', borderRadius: 6, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da lista…"
            maxLength={60}
            style={{
              width: '100%', padding: '11px 14px',
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text)',
              fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: 9,
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '9px 20px', borderRadius: 9,
                background: name.trim() ? 'var(--purple)' : 'rgba(124,58,237,0.3)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                transition: 'opacity 0.15s',
              }}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Confirmação excluir ─── */
function DeleteConfirmModal({ listName, onConfirm, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16, padding: '28px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Excluir lista</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
          Tem certeza que deseja excluir a lista <strong style={{ color: 'var(--text)' }}>"{listName}"</strong>?
          <br />Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 9,
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 20px', borderRadius: 9,
              background: '#ef4444', color: '#fff',
              fontSize: 13, fontWeight: 600,
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card de mídia dentro de uma lista ─── */
function MediaCard({ mediaId, listId, onRemove, navigate }) {
  const media = getMedia(mediaId);
  if (!media) return null;

  const title = media.title || `Mídia #${mediaId}`;
  const cover = media.coverImage;
  const format = media.format;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Cover */}
      <div
        onClick={() => navigate(`/anime/${mediaId}`)}
        style={{
          width: 46, height: 64, borderRadius: 7,
          overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
          background: 'var(--bg-input, rgba(255,255,255,0.05))',
        }}
      >
        {cover ? (
          <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {format === 'MANGA' || format === 'NOVEL' ? <BookOpen size={18} color="var(--text-muted)" /> : <Film size={18} color="var(--text-muted)" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div
        onClick={() => navigate(`/anime/${mediaId}`)}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <p style={{
          fontSize: 13.5, fontWeight: 600, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        {media.format && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {media.format} {media.seasonYear ? `· ${media.seasonYear}` : ''}
          </p>
        )}
        {media.listStatus && (
          <span style={{
            fontSize: 10.5, fontWeight: 600,
            color: media.listStatus === 'COMPLETED' ? '#4ade80' :
              media.listStatus === 'WATCHING' ? '#a78bfa' :
              media.listStatus === 'PLAN_TO_WATCH' ? '#60a5fa' :
              media.listStatus === 'ON_HOLD' ? '#fbbf24' : '#f87171',
            marginTop: 3, display: 'block',
          }}>
            {media.listStatus === 'COMPLETED' ? '✓ Completo' :
              media.listStatus === 'WATCHING' ? '▶ Assistindo' :
              media.listStatus === 'PLAN_TO_WATCH' ? '🕒 Planejado' :
              media.listStatus === 'ON_HOLD' ? '⏸ Em pausa' : '✗ Abandonado'}
          </span>
        )}
      </div>

      {/* Remover */}
      <button
        onClick={() => onRemove(listId, mediaId)}
        title="Remover desta lista"
        style={{
          width: 30, height: 30, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', flexShrink: 0,
          border: '1px solid transparent',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#f87171';
          e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-muted)';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── View de uma lista aberta ─── */
function ListView({ list, onBack, onRename, onDelete, onRemoveMedia }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mediaIds = list.mediaIds || [];
  const filtered = search
    ? mediaIds.filter(id => {
        const m = getMedia(id);
        return m?.title?.toLowerCase().includes(search.toLowerCase());
      })
    : mediaIds;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: 13,
            padding: '6px 10px', borderRadius: 8,
            border: '1px solid var(--border)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <ArrowLeft size={14} />
          Voltar
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {list.name}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {mediaIds.length} {mediaIds.length === 1 ? 'item' : 'itens'} · Criada em {formatDate(list.createdAt)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setRenaming(true)}
            title="Renomear"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 9,
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 12.5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <Pencil size={13} /> Renomear
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Excluir lista"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 9,
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', fontSize: 12.5,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>

      {/* Busca */}
      {mediaIds.length > 4 && (
        <div style={{ position: 'relative', maxWidth: 340, marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar nesta lista…"
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 9, color: 'var(--text)',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
          />
        </div>
      )}

      {/* Grid de mídias */}
      {mediaIds.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <ListPlus size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Lista vazia</p>
          <p style={{ fontSize: 13 }}>
            Adicione mídias a esta lista pela página de detalhes de qualquer anime ou mangá.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {filtered.map(id => (
            <MediaCard
              key={id}
              mediaId={id}
              listId={list.id}
              onRemove={onRemoveMedia}
              navigate={navigate}
            />
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, gridColumn: '1/-1' }}>
              Nenhum resultado para "{search}"
            </p>
          )}
        </div>
      )}

      {renaming && (
        <ListFormModal
          title="Renomear Lista"
          initial={list.name}
          onClose={() => setRenaming(false)}
          onConfirm={name => { onRename(list.id, name); setRenaming(false); }}
        />
      )}
      {confirmDelete && (
        <DeleteConfirmModal
          listName={list.name}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(list.id); setConfirmDelete(false); }}
        />
      )}
    </div>
  );
}

/* ─── Card de lista na grade ─── */
function ListCard({ list, onClick, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  /* Preview das primeiras 3 capas */
  const previews = (list.mediaIds || []).slice(0, 3).map(id => {
    const m = getMedia(id);
    return m?.coverImage || null;
  }).filter(Boolean);

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '18px 18px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.12s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Preview capas */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14, height: 72 }}>
        {previews.length > 0 ? previews.map((src, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: 8, overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
          }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )) : (
          <div style={{
            flex: 1, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ListPlus size={28} color="rgba(124,58,237,0.3)" />
          </div>
        )}
        {/* Placeholders se menos de 3 capas */}
        {previews.length > 0 && previews.length < 3 && Array.from({ length: 3 - previews.length }, (_, i) => (
          <div key={`ph-${i}`} style={{
            flex: 1, borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
          }} />
        ))}
      </div>

      {/* Nome + contagem */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {list.name}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
            {(list.mediaIds || []).length} {(list.mediaIds || []).length === 1 ? 'item' : 'itens'}
          </p>
        </div>

        {/* Menu … */}
        <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 28, height: 28, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
              border: '1px solid transparent',
              fontSize: 16, fontWeight: 700, lineHeight: 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            ···
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, overflow: 'hidden', zIndex: 100,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              minWidth: 140,
              animation: 'fadeIn 0.1s ease',
            }}>
              <button
                onClick={() => { onRename(list); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '10px 14px',
                  color: 'var(--text-secondary)', fontSize: 13, textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Pencil size={13} /> Renomear
              </button>
              <button
                onClick={() => { onDelete(list); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '10px 14px',
                  color: '#f87171', fontSize: 13, textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <ChevronRight size={14} color="var(--text-muted)" style={{ position: 'absolute', bottom: 18, right: 18, opacity: 0.5 }} />
    </div>
  );
}

/* ════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════ */
export default function Lists() {
  useTitle('Listas Personalizadas · Nakama');
  const { showToast } = useToast();

  const [lists, setLists]             = useState([]);
  const [activeList, setActiveList]   = useState(null); // list object or null
  const [showCreate, setShowCreate]   = useState(false);
  const [renameTarget, setRenameTarget] = useState(null); // list object
  const [deleteTarget, setDeleteTarget] = useState(null); // list object

  /* Carrega listas */
  const reload = () => setLists(getCustomLists());
  useEffect(reload, []);

  /* Handlers */
  const handleCreate = name => {
    createCustomList(name);
    reload();
    setShowCreate(false);
    showToast(`Lista "${name}" criada!`, 'success');
  };

  const handleRename = (id, name) => {
    renameCustomList(id, name);
    reload();
    // Se a lista aberta for essa, atualiza
    if (activeList?.id === id) setActiveList(l => ({ ...l, name }));
    showToast('Lista renomeada!', 'success');
  };

  const handleDelete = id => {
    const l = lists.find(x => x.id === id);
    deleteCustomList(id);
    reload();
    if (activeList?.id === id) setActiveList(null);
    showToast(`Lista "${l?.name}" excluída`, 'info');
  };

  const handleRemoveMedia = (listId, mediaId) => {
    removeFromCustomList(listId, mediaId);
    reload();
    if (activeList?.id === listId) {
      setActiveList(l => ({ ...l, mediaIds: l.mediaIds.filter(id => id !== mediaId) }));
    }
    showToast('Mídia removida da lista', 'info');
  };

  /* ── Se lista aberta ── */
  if (activeList) {
    // Merge com dados atualizados
    const current = lists.find(l => l.id === activeList.id) || activeList;
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <ListView
          list={current}
          onBack={() => setActiveList(null)}
          onRename={(id, name) => handleRename(id, name)}
          onDelete={id => { handleDelete(id); setActiveList(null); }}
          onRemoveMedia={handleRemoveMedia}
        />
      </div>
    );
  }

  /* ── Grade de listas ── */
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>
            Listas Personalizadas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Organize suas mídias em coleções customizadas
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
            color: '#fff', fontSize: 13.5, fontWeight: 700,
            boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Plus size={16} /> Nova Lista
        </button>
      </div>

      {/* Listas */}
      {lists.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: 'var(--text-muted)',
        }}>
          <ListPlus size={52} style={{ opacity: 0.25, marginBottom: 16 }} />
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Nenhuma lista criada ainda
          </p>
          <p style={{ fontSize: 13.5, maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}>
            Crie listas personalizadas para organizar seus animes e mangás como quiser — por gênero, humor, temporada ou o que preferir.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 24px', borderRadius: 10,
              background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
            }}
          >
            <Plus size={16} /> Criar primeira lista
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onClick={() => setActiveList(list)}
              onRename={l => setRenameTarget(l)}
              onDelete={l => setDeleteTarget(l)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {showCreate && (
        <ListFormModal
          title="Nova Lista"
          onClose={() => setShowCreate(false)}
          onConfirm={handleCreate}
        />
      )}
      {renameTarget && (
        <ListFormModal
          title="Renomear Lista"
          initial={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onConfirm={name => { handleRename(renameTarget.id, name); setRenameTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          listName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { handleDelete(deleteTarget.id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}
