import clsx from 'clsx'
import { TbHeadphones, TbUser } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

type TopBarProps = {
  title: string
  variant?: 'light' | 'dark'
}

export default function TopBar({ title, variant = 'light' }: TopBarProps) {
  const navigate = useNavigate()
  const isDark = variant === 'dark'

  const textClass = isDark ? 'text-white' : 'text-main'
  const subTextClass = isDark ? 'text-white' : 'text-main'
  const iconClass = clsx(
    isDark ? 'text-white' : 'text-main',
    'cursor-pointer transition-colors duration-150 hover:brightness-110'
  )

  return (
    <header className="w-full">
      <div className="flex items-center justify-between px-6 py-5">
        {/* 왼쪽 */}
        <div className="flex items-baseline gap-2">
          <span
            onClick={() => navigate('/')}
            className={clsx(
              'select-none tracking-tight font-extrabold text-2xl leading-none cursor-pointer hover:brightness-110',
              textClass
            )}
          >
            aiCare
          </span>
          <span className={clsx('text-sm whitespace-nowrap', subTextClass)}>{title}</span>
        </div>

        {/* 오른쪽 아이콘 */}
        <div className="flex items-center gap-2">
          <TbHeadphones size={24} className={iconClass} onClick={() => navigate('/consulting')} />
          <TbUser size={24} className={iconClass} onClick={() => navigate('/mypage')} />
        </div>
      </div>
    </header>
  )
}
