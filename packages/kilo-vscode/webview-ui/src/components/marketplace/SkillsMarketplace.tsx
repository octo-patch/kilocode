import { Component, createSignal, createMemo, Show, For } from "solid-js"
import { Spinner } from "@kilocode/kilo-ui/spinner"
import { TextField } from "@kilocode/kilo-ui/text-field"
import { RadioGroup } from "@kilocode/kilo-ui/radio-group"
import { Tag } from "@kilocode/kilo-ui/tag"
import { useLanguage } from "../../context/language"
import type { MarketplaceItem, MarketplaceInstalledMetadata, SkillMarketplaceItem } from "../../types/marketplace"
import { ItemCard } from "./ItemCard"

interface SkillsMarketplaceProps {
  items: MarketplaceItem[]
  metadata: MarketplaceInstalledMetadata
  fetching: boolean
  onInstall: (item: MarketplaceItem) => void
  onRemove: (item: MarketplaceItem, scope: "project" | "global") => void
}

const ALL = "__all__"

export const SkillsMarketplace: Component<SkillsMarketplaceProps> = (props) => {
  const { t } = useLanguage()
  const [search, setSearch] = createSignal("")
  const [category, setCategory] = createSignal(ALL)

  const skills = createMemo(() => props.items.filter((i): i is SkillMarketplaceItem => i.type === "skill"))

  const categories = createMemo(() => {
    const set = new Set<string>()
    for (const item of skills()) {
      if (item.displayCategory) set.add(item.displayCategory)
    }
    return [ALL, ...[...set].sort()]
  })

  const filtered = createMemo(() => {
    const query = search().toLowerCase()
    const cat = category()

    return skills().filter((item) => {
      if (query) {
        const id = item.id.toLowerCase()
        const name = item.name.toLowerCase()
        const display = item.displayName.toLowerCase()
        const desc = item.description.toLowerCase()
        const dc = item.displayCategory.toLowerCase()
        if (
          !id.includes(query) &&
          !name.includes(query) &&
          !display.includes(query) &&
          !desc.includes(query) &&
          !dc.includes(query)
        )
          return false
      }

      if (cat !== ALL && item.displayCategory !== cat) return false

      return true
    })
  })

  return (
    <div>
      <TextField
        placeholder={t("marketplace.searchSkills")}
        value={search()}
        onChange={setSearch}
        hideLabel
        class="marketplace-search-field"
      />

      <RadioGroup
        options={categories()}
        current={category()}
        onSelect={(v) => setCategory(v ?? ALL)}
        label={(c) => (c === ALL ? t("marketplace.categoryAll") : c)}
        value={(c) => c}
        size="small"
        class="marketplace-categories"
      />

      <Show when={props.fetching}>
        <div class="marketplace-loading">
          <Spinner />
        </div>
      </Show>

      <Show when={!props.fetching && filtered().length === 0}>
        <div class="marketplace-empty">{t("marketplace.emptySkills")}</div>
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
                displayName={item.displayName}
                linkUrl={item.githubUrl || undefined}
                footer={
                  <Show when={item.displayCategory}>
                    <Tag>{item.displayCategory}</Tag>
                  </Show>
                }
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
