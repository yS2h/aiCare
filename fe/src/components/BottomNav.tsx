import { useNavigate } from 'react-router-dom'
import { TbChartLine, TbHome, TbChartPie, TbFileText } from 'react-icons/tb'
import { IoBagAddOutline } from 'react-icons/io5'
import clsx from 'clsx'

interface BottomNavProps {
  activePage?: string
  showBottomNav?: boolean
}

export default function BottomNav({ activePage, showBottomNav = true }: BottomNavProps) {
  const navigate = useNavigate()
  if (!showBottomNav) return null

  const navItems = [
    { id: 'growth-management', icon: TbChartLine, label: '성장관리', path: '/growth-history' },
    { id: 'bone-age', icon: IoBagAddOutline, label: '골격성숙도', path: '/bone-age' },
    { id: 'home', icon: TbHome, label: '홈', path: '/' },
    { id: 'body-type', icon: TbChartPie, label: '체형분석', path: '/spine' },
    { id: 'report', icon: TbFileText, label: '레포트', path: '/guide' }
  ]

  const isActive = (path: string) => activePage === path

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 bottom-0 z-50 w-full max-w-[600px] px-4"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="bg-white border-t " style={{ borderColor: 'var(--color-grey3)' }}>
        <div
          className="flex items-center justify-around py-3 px-2"
          style={{ borderColor: '#cdcdcd' }}
        >
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={clsx(
                  'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                  'hover:bg-grey4',
                  active ? 'text-main' : 'text-grey1'
                )}
              >
                <Icon size={24} className={clsx('mb-1', active ? 'text-main' : 'text-grey1')} />
                <span className={clsx('text-xs font-medium', active ? 'text-main' : 'text-grey1')}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
