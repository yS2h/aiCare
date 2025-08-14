import { useNavigate, useLocation } from 'react-router-dom'
import { TbChartLine, TbHome, TbChartPie, TbFileText } from 'react-icons/tb'
import { IoBagAddOutline } from 'react-icons/io5'
import clsx from 'clsx'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    {
      id: 'growth',
      icon: TbChartLine,
      label: '성장관리',
      path: '/growth-history'
    },
    {
      id: 'bone-age',
      icon: IoBagAddOutline,
      label: '골격성숙도',
      path: '/bone-age'
    },
    {
      id: 'home',
      icon: TbHome,
      label: '홈',
      path: '/'
    },
    {
      id: 'body-type',
      icon: TbChartPie,
      label: '체형분석',
      path: '/spine'
    },
    {
      id: 'report',
      icon: TbFileText,
      label: '레포트',
      path: '/guide'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t z-50"
      style={{ borderColor: '#cdcdcd' }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200',
                'hover:bg-gray4',
                active ? 'text-main' : 'text-gray1'
              )}
            >
              <Icon size={24} className={clsx('mb-1', active ? 'text-main' : 'text-gray1')} />
              <span
                className={clsx(
                  'text-xs font-medium',
                  active ? 'text-main font-bold' : 'text-gray1'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
