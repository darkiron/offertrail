# Atomic primitives

The public contracts in `atoms/` own native controls and single-purpose visual
elements. `molecules/` may compose those contracts but must not duplicate their
domain mapping or interaction semantics.

## Canonical components

- `Button` is the canonical native button. It owns loading, disabled, size and
  visual variants. `ActionButton` is a compatibility facade that delegates to
  it; `ActionLink` and `ExternalAction` remain the navigation equivalents.
- `ProbityBadge` and `OrganizationTypeBadge` live only in `atoms/`. Their old
  molecule implementations were unreferenced and duplicated labels, colors and
  behavior.
- `PageHeader` owns compact, editorial and SaaS variants. The former
  `SaasPageHeader` was folded into it so heading semantics and responsive action
  layout have one contract.
- `UiPrimitives` is a temporary typed compatibility layer for screens migrated
  away from Mantine. Layout props are translated to local CSS variables and are
  never forwarded as invalid DOM attributes. Native text fields keep native
  change events; select and number compatibility controls emit values.

Component modules use Sass, design tokens and the shared accessibility and
breakpoint mixins. New global utility classes are not part of this layer.
