import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, BookOpen, Upload, Flame, Loader2, PartyPopper, MessageSquareText } from 'lucide-react'
import { currentLocale } from '../i18n'

interface HeatCell { date: string; count: number }

const progressOf = (d: any) => Math.round((Math.min(Number(d?.completed_levels) || 0, 3) / 3) * 100)

/** Bucket a raw activity count into 0-4 intensity levels. */
const intensity = (count: number) => (count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4)
import { usePageTitle } from '../utils/usePageTitle'

export default function DashboardPage() {
  usePageTitle('dashboard')
  const { user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const locale = currentLocale()

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    const fetchData = async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([
          axios.get('/api/documents/stats/summary'),
          axios.get('/api/documents')
        ])
        if (cancelled) return
        setStats(statsRes.data)
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : [])
        // Keep polling while AI is still analyzing something
        if (docsRes.data?.some?.((d: any) => d.status === 'processing')) {
          timer = setTimeout(fetchData, 5000)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [])

  const analyzedDocs = useMemo(() => documents.filter(d => d.status === 'analyzed'), [documents])
  const processingDocs = useMemo(() => documents.filter(d => d.status === 'processing'), [documents])
  // Most recently touched analyzed document that is NOT finished yet
  const activeDoc = useMemo(() => analyzedDocs.find(d => progressOf(d) < 100) || null, [analyzedDocs])
  const allCompleted = analyzedDocs.length > 0 && !activeDoc
  const otherDocs = useMemo(() => documents.filter(d => d.id !== activeDoc?.id).slice(0, 4), [documents, activeDoc])

  // Heatmap: 12 columns (weeks) x 7 rows (Mon..Sun)
  const heatmapWeeks = useMemo(() => {
    const cells: HeatCell[] = stats?.heatmap || []
    if (cells.length === 0) return []
    // Align so each column starts on Monday
    const first = new Date(cells[0].date + 'T00:00:00')
    const mondayOffset = (first.getDay() + 6) % 7
    const padded: (HeatCell | null)[] = [...Array(mondayOffset).fill(null), ...cells]
    const weeks: (HeatCell | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7))
    return weeks.slice(-12)
  }, [stats?.heatmap])

  const weekdayShort = (dayIndexFromMonday: number) => {
    // 2024-01-01 is a Monday
    const d = new Date(2024, 0, 1 + dayIndexFromMonday)
    return d.toLocaleDateString(locale, { weekday: 'short' })
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12 animate-pulse">
        <div className="h-8 w-64 bg-[var(--border-color)] rounded mb-3" />
        <div className="h-4 w-48 bg-[var(--border-color)] rounded mb-12" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-56 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg" />
          <div className="h-56 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg" />
        </div>
      </div>
    )
  }

  const nameParts = (user?.name || '').trim().split(/\s+/).filter(Boolean)
  const firstName = (locale === 'vi-VN' ? nameParts[nameParts.length - 1] : nameParts[0]) || t('dashboard.greeting_fallback')
  const skills: { key: string; value: number }[] = stats?.skills || []
  const hasSkillData = skills.some(s => s.value > 0)

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-12">
      
      {/* 1. Header & Quick Stats Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-heading font-semibold tracking-tight text-[var(--text-main)] mb-1">
            {t('dashboard.greeting', { name: firstName })}
          </h1>
          <p className="text-sm md:text-base text-[var(--text-muted)] flex items-center gap-2 flex-wrap">
            {t('dashboard.subtitle')}
            {stats?.streak > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-semibold">
                <Flame size={12} /> {t('dashboard.streak', { count: stats.streak })}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm border border-[var(--border-color)] rounded-lg px-6 py-4 bg-[var(--bg-surface)]">
          {[
            { label: t('dashboard.stat_docs'), value: stats?.totalDocs },
            { label: t('dashboard.stat_concepts'), value: stats?.totalConcepts },
            { label: t('dashboard.stat_questions'), value: stats?.totalQuizzes },
            { label: t('dashboard.stat_levels'), value: stats?.completedLevels },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              {i > 0 && <div className="w-px h-8 bg-[var(--border-color)] hidden sm:block" />}
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs uppercase font-medium mb-1 tracking-wider">{s.label}</span>
                <span className="font-heading font-semibold text-xl text-[var(--text-main)] tabular-nums tracking-tight">{s.value || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing banner */}
      {processingDocs.length > 0 && (
        <Link
          to={`/app/documents/${processingDocs[0].id}`}
          className="mb-8 flex items-center gap-3 px-5 py-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-sm hover:bg-amber-500/10 transition-colors"
        >
          <Loader2 size={16} className="text-amber-500 animate-spin shrink-0" />
          <span className="font-medium text-[var(--text-main)]">{t('dashboard.processing_title', { count: processingDocs.length })}</span>
          <span className="text-[var(--text-muted)] hidden sm:inline">— {t('dashboard.processing_desc')}</span>
          <ArrowRight size={14} className="ml-auto text-[var(--text-muted)]" />
        </Link>
      )}

      {/* 2. Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">
        
        {/* Left Column (2/3) - Priority: Continue Learning */}
        <div className="lg:col-span-2 space-y-12">
          
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase mb-4">{t('dashboard.continue_learning')}</h2>
            
            {activeDoc ? (
              <div className="minimal-card p-6 md:p-8 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-heading font-semibold text-[var(--text-main)] mb-2 truncate max-w-sm">
                      {activeDoc.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-[var(--text-main)]">{activeDoc.concepts_count || 0} {t('common.concepts')}</span>
                      <span>•</span>
                      <span className="text-[var(--accent)] font-medium">{t('dashboard.percent_completed', { percent: progressOf(activeDoc) })}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    <Link 
                      id="dashboard-flashcards-btn"
                      to={`/app/documents/${activeDoc.id}/flashcards`}
                      className="px-4 py-2.5 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--text-muted)] rounded transition-colors"
                    >
                      {t('dashboard.practice_flashcards')}
                    </Link>
                    <Link 
                      id="dashboard-learn-btn"
                      to={`/app/documents/${activeDoc.id}`} 
                      className="px-4 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity"
                    >
                      {t('dashboard.learn_now')}
                    </Link>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 h-1 bg-[var(--border-color)] w-full">
                  <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${progressOf(activeDoc)}%` }}></div>
                </div>
              </div>
            ) : allCompleted ? (
              <div className="minimal-card p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-12 h-12 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                  <PartyPopper size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-[var(--text-main)] mb-1">{t('dashboard.all_completed_title')}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{t('dashboard.all_completed_desc')}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link to="/app/review" className="px-4 py-2.5 text-sm font-medium text-[var(--text-main)] border border-[var(--border-color)] hover:border-[var(--text-muted)] rounded transition-colors flex items-center gap-2">
                    <MessageSquareText size={15} /> {t('dashboard.review_now')}
                  </Link>
                  <Link to="/app/upload" className="px-4 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity flex items-center gap-2">
                    <Upload size={15} /> {t('dashboard.upload_more')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="minimal-card p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] mb-4">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-main)] mb-2">{t('dashboard.no_docs_title')}</h3>
                <p className="text-[var(--text-muted)] mb-6 text-sm max-w-xs">{t('dashboard.no_docs_desc')}</p>
                <Link to="/app/upload" className="px-5 py-2.5 text-sm font-medium bg-[var(--text-main)] text-[var(--bg-main)] hover:opacity-90 rounded transition-opacity flex items-center gap-2">
                  <Upload size={16} /> {t('dashboard.upload_cta')}
                </Link>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase">{t('dashboard.other_docs')}</h2>
              {documents.length > 0 && (
                <Link id="dashboard-view-all" to="/app/documents" className="text-sm font-medium text-[var(--text-main)] hover:underline flex items-center gap-1">
                  {t('dashboard.view_all')} <ArrowRight size={14} />
                </Link>
              )}
            </div>
            
            <div className="space-y-3">
              {otherDocs.length > 0 ? (
                otherDocs.map((doc: any) => (
                  <Link to={`/app/documents/${doc.id}`} key={doc.id} className="p-4 md:p-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                        {doc.status === 'processing' ? <Loader2 size={18} className="animate-spin text-amber-500" /> : <BookOpen size={18} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-[var(--text-main)] mb-0.5 truncate">{doc.title}</h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {doc.status === 'analyzed'
                            ? `${doc.concepts_count || 0} ${t('common.concepts')} • ${t('dashboard.percent_completed', { percent: progressOf(doc) })}`
                            : t(`status.${doc.status}`)}
                        </p>
                      </div>
                    </div>
                    <div className="text-[var(--text-muted)] group-hover:text-[var(--text-main)] group-hover:translate-x-0.5 transition-all shrink-0">
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 md:p-8 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col items-start gap-4">
                  <div className="w-10 h-10 rounded bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)]">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-[var(--text-main)] mb-1">{t('dashboard.no_other_title')}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{t('dashboard.no_other_desc')}</p>
                  </div>
                  <Link 
                    to="/app/upload" 
                    className="mt-2 px-5 py-2.5 text-sm font-medium text-[var(--bg-main)] bg-[var(--text-main)] hover:opacity-90 transition-opacity rounded flex items-center gap-2"
                  >
                    <Upload size={16} />
                    <span>{t('dashboard.upload_new')}</span>
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column (1/3) - Analytics */}
        <div className="lg:col-span-1 space-y-12">
          
          <section>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase mb-4">{t('dashboard.weekly_activity')}</h2>
            
            <div className="p-6 minimal-card">
              <div className="flex items-end gap-2 mb-6">
                <span className="text-4xl font-heading font-semibold tracking-tight text-[var(--text-main)] tabular-nums">{stats?.weekActivity || 0}</span>
                <span className="text-sm font-medium text-[var(--text-muted)] mb-1">{t('dashboard.activities_this_week')}</span>
              </div>

              {/* Last 7 days bars */}
              <div className="flex items-end justify-between gap-1.5 h-16 mb-6">
                {(stats?.activityData || []).map((d: HeatCell) => {
                  const max = Math.max(1, ...(stats?.activityData || []).map((x: HeatCell) => x.count))
                  const h = d.count > 0 ? Math.max(12, (d.count / max) * 100) : 6
                  const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString(locale, { weekday: 'narrow' })
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      <div
                        className={`w-full rounded-sm transition-all duration-700 ${d.count > 0 ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`}
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-[var(--text-muted)] font-medium">{dayLabel}</span>
                      <div className="absolute bottom-full mb-1 px-2 py-1 bg-[var(--text-main)] text-[var(--bg-main)] text-[10px] whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.count === 0 ? t('dashboard.no_activity') : t('dashboard.activity_count', { count: d.count })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 12-week Heatmap */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex flex-col gap-1.5 text-[9px] font-medium text-[var(--text-muted)] pr-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <span key={i} className="h-3.5 leading-[14px]">{i % 2 === 0 ? weekdayShort(i) : ''}</span>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {heatmapWeeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1.5">
                        {Array.from({ length: 7 }).map((_, dIdx) => {
                          const cell = week[dIdx]
                          if (!cell) return <div key={dIdx} className="w-3.5 h-3.5" />
                          const lvl = intensity(cell.count)
                          return (
                            <div 
                              key={dIdx} 
                              className="w-3.5 h-3.5 rounded-sm transition-colors hover:ring-1 hover:ring-[var(--text-main)] group relative"
                              style={{ 
                                backgroundColor: lvl === 0 
                                  ? 'var(--border-color)' 
                                  : `color-mix(in srgb, var(--accent) ${lvl * 25}%, var(--bg-main))`
                              }}
                            >
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[var(--text-main)] text-[var(--bg-main)] text-[10px] whitespace-nowrap rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {new Date(cell.date + 'T00:00:00').toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}
                                {' · '}
                                {cell.count === 0 ? t('dashboard.no_activity') : t('dashboard.activity_count', { count: cell.count })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--text-muted)] font-medium mt-1">
                  <span>{t('dashboard.less')}</span>
                  <div className="w-3 h-3 rounded-sm bg-[var(--border-color)]"></div>
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `color-mix(in srgb, var(--accent) ${l * 25}%, var(--bg-main))` }}></div>
                  ))}
                  <span>{t('dashboard.more')}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase mb-4">{t('dashboard.skills')}</h2>
            
            <div className="minimal-card p-6 space-y-6">
              {!hasSkillData && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t('dashboard.skills_empty')}</p>
              )}
              {skills.map(skill => (
                <div key={skill.key} className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[var(--text-main)]">{t(`dashboard.skill_${skill.key}`)}</span>
                    <span className="text-[var(--text-muted)] tabular-nums">{skill.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--text-main)] rounded-full transition-all duration-1000" style={{ width: `${skill.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
