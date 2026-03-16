import { Component, createSignal, createMemo, Show, For } from "solid-js"
import { Spinner } from "@kilocode/kilo-ui/spinner"
import { TextField } from "@kilocode/kilo-ui/text-field"
import { Select } from "@kilocode/kilo-ui/select"
import { Tag } from "@kilocode/kilo-ui/tag"
import { useLanguage } from "../../context/language"
import type { MarketplaceItem, MarketplaceInstalledMetadata } from "../../types/marketplace"
import { ItemCard } from "./ItemCard"
import { isInstalled } from "./utils"

interface MarketplaceListViewProps {
  type: "mcp" | "mode"
  items: MarketplaceItem[]
  metadata: MarketplaceInstalledMetadata
  fetching: boolean
  onInstall: (item: MarketplaceItem) => void
  onRemove: (item: MarketplaceItem, scope: "project" | "global") => void
}

type StatusFilter = "all" | "installed" | "notInstalled"

const STATUS_OPTIONS: StatusFilter[] = ["all", "installed", "notInstalled"]

export const MarketplaceListView: Component<MarketplaceListViewProps> = (props) => {
  const { t } = useLanguage()
  const [search, setSearch] = createSignal("")
  const [status, setStatus] = createSignal<StatusFilter>("all")
  const [tags, setTags] = createSignal<string[]>([])

  const statusLabel = (s: StatusFilter) => {
    if (s === "all") return t("marketplace.filter.all")
    if (s === "installed") return t("marketplace.installed")
    return t("marketplace.filter.notInstalled")
  }

  const allTags = createMemo(() => {
    const set = new Set<string>()
    for (const item of props.items) {
      for (const tag of item.tags ?? []) {
        set.add(tag)
      }
    }
    return [...set].sort()
  })

  const toggleTag = (tag: string) => {
    const current = tags()
    const idx = current.indexOf(tag)
    if (idx >= 0) {
      setTags([...current.slice(0, idx), ...current.slice(idx + 1)])
      return
    }
    setTags([...current, tag])
  }

  const filtered = createMemo(() => {
    const query = search().toLowerCase()
    const selected = tags()
    const filter = status()

    return props.items.filter((item) => {
      if (query) {
        const name = item.name.toLowerCase()
        const desc = item.description.toLowerCase()
        if (!name.includes(query) && !desc.includes(query)) return false
      }

      if (filter === "installed" && !isInstalled(item.id, item.type, props.metadata)) return false
      if (filter === "notInstalled" && isInstalled(item.id, item.type, props.metadata)) return false

      if (selected.length > 0) {
        const itemTags = item.tags ?? []
        if (!selected.some((t) => itemTags.includes(t))) return false
      }

      return true
    })
  })

  return (
    <div>
      <div class="marketplace-filters">
        <TextField
          placeholder={t("marketplace.search")}
          value={search()}
          onChange={setSearch}
          hideLabel
          class="marketplace-search-field"
        />
        <Select
          options={STATUS_OPTIONS}
          current={status()}
          onSelect={(v) => v && setStatus(v)}
          label={statusLabel}
          value={(s) => s}
          variant="secondary"
          size="small"
        />
      </div>

      <Show when={tags().length > 0}>
        <div class="marketplace-active-tags">
          <For each={tags()}>
            {(tag) => (
              <button class="marketplace-tag-filter active" onClick={() => toggleTag(tag)}>
                <Tag>{tag} ×</Tag>
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show when={props.fetching}>
        <div class="marketplace-loading">
          <Spinner />
        </div>
      </Show>

      <Show when={!props.fetching && filtered().length === 0}>
        <div class="marketplace-empty">{t("marketplace.empty")}</div>
      </Show>

      <Show when={!props.fetching && filtered().length > 0}>
        <div class="marketplace-grid">
          <For each={filtered()}>
            {(item) => (
              <ItemCard
                item={item}
                metadata={props.metadata}
                onInstall={props.onInstall}
                onRemove={props.onRemove}
                linkUrl={item.type === "mcp" && "url" in item ? item.url : undefined}
                typeBadge={item.type === "mcp" ? t("marketplace.badge.mcpServer") : t("marketplace.badge.mode")}
                footer={
                  <For each={item.tags ?? []}>
                    {(tag) => (
                      <button class="marketplace-tag-filter" onClick={() => toggleTag(tag)}>
                        <Tag>{tag}</Tag>
                      </button>
                    )}
                  </For>
                }
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
