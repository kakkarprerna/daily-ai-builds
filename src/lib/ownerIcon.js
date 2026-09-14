import {
  Monitor, Server, BarChart3, Plug, Cloud, Lock,
  CreditCard, Bell, Smartphone, FileText, HelpCircle,
} from 'lucide-react'

const RULES = [
  [/mobile/i, Smartphone],
  [/frontend|client|web app/i, Monitor],
  [/backend|api|server/i, Server],
  [/data|pipeline|analytics/i, BarChart3],
  [/third[- ]?party|vendor|integration/i, Plug],
  [/infra|platform|capacity|ops/i, Cloud],
  [/auth|identity|login|permission/i, Lock],
  [/payment|billing|checkout/i, CreditCard],
  [/notification|messaging|email|sms/i, Bell],
  [/content|cms/i, FileText],
]

export function ownerIcon(name = '') {
  const match = RULES.find(([pattern]) => pattern.test(name))
  return match ? match[1] : HelpCircle
}
