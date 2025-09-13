# Card Component Usage Examples

## Basic Card Usage

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

function BasicCard() {
  return (
    <Card variant="gaming" size="default" glow="subtle">
      <CardHeader>
        <CardTitle>Gaming Card</CardTitle>
        <CardDescription>A card with gaming theme</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
    </Card>
  )
}
```

## Collapsible Card Usage

```tsx
import { 
  CardCollapsible, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardCollapsibleTrigger, 
  CardCollapsibleContent 
} from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'

function CollapsibleCard() {
  return (
    <CardCollapsible defaultOpen={false}>
      <Card variant="neon" size="default">
        <CardHeader>
          <CardCollapsibleTrigger className="flex w-full items-center justify-between">
            <CardTitle>Expandable Content</CardTitle>
            <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
          </CardCollapsibleTrigger>
        </CardHeader>
        <CardCollapsibleContent>
          <div className="px-6 pb-6">
            <p>This content is collapsible and supports progressive disclosure.</p>
            <p>It respects reduced motion preferences and animates smoothly.</p>
          </div>
        </CardCollapsibleContent>
      </Card>
    </CardCollapsible>
  )
}
```

## Available Variants

- `variant`: `default`, `gaming`, `neon`, `glass`, `solid`
- `size`: `xs`, `sm`, `default`, `lg`, `mobile`, `touch`
- `glow`: `none`, `subtle`, `strong`

## Accessibility Features

- Collapsible cards use Radix UI primitives for proper ARIA attributes
- `aria-expanded` is automatically managed based on open state
- Respects `prefers-reduced-motion` for animations
- Touch-friendly sizing with `touch` variant
